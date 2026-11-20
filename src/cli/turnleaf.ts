// Headless command line for scripts and AI agents. It drives the same core
// workflow as the extension: Get latest, the local review files, and Send.
// Nothing reaches Overleaf without `send --yes`; see docs/guide/command-line.md.
import { chmod, mkdir, readFile, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { OverleafReader } from '../core/overleaf';
import { ProjectStore } from '../core/projectStore';
import { ReviewWorkflow, SyncService, pushReport, pullChanges, type PushPlan } from '../core/folderWorkflow';
import { LocalReviewFiles } from '../core/reviewFiles';
import { validateTrackedFiles } from '../core/docState';
import { normalizeBaseUrl } from '../core/http';
import { SessionExpiredError, SyncError, safeError } from '../core/errors';
import { browserSignIn, findBrowser } from '../core/browserSignIn';
import { withOperation } from '../core/operation';
import { sendsPicture } from '../core/pictures';

export interface Io { out(line: string): void; err(line: string): void; env: NodeJS.ProcessEnv; cwd: string; }
/** Exit codes: 0 done, 1 failed, 2 usage, 3 needs a decision (conflict, policy refusal, blocked send), 4 signed out. */
export const exitCodes = { ok: 0, failed: 1, usage: 2, blocked: 3, signedOut: 4 } as const;

const usage = `Usage: turnleaf <command> [options]

  sign-in   [--browser PATH] [--headless]     Sign in with a browser window and save the session.
  projects                                    List the projects of the signed-in account.
  link      <project-id> [--files a.tex,b.bib | --all-sources]
                                              Link the folder to a project and choose its files.
  pull      [--take-overleaf] [--dry-run]     Get latest: merge Overleaf's files and comments into the folder.
  status                                      Import review files and show what Send would do.
  send      [--yes] [--dry-run] [--comments-only] [--allow-untracked-edits] [--allow-deletes]
                                              Send queued comments and saved edits to Overleaf. Edits are
                                              refused unless Track Changes is on for this account.

Common options:
  --folder DIR        Working folder (default: current folder).
  --base-url URL      Overleaf server (default: TURNLEAF_BASE_URL or https://www.overleaf.com).
  --session-file F    Where the session cookie is kept (default: TURNLEAF_SESSION_FILE or
                      ~/.config/turnleaf/session-<server>). TURNLEAF_COOKIE overrides it.
  --pictures          Also synchronize pictures (PNG, JPG, PDF). Off by default.
  --json              Print results as JSON.`;

interface Options { [name: string]: string | boolean | undefined }
const flags = new Set(['headless', 'all-sources', 'take-overleaf', 'dry-run', 'yes', 'comments-only', 'allow-untracked-edits', 'allow-deletes', 'pictures', 'json', 'help']);
function parse(argv: string[]): { command?: string; positional: string[]; options: Options } {
  const positional: string[] = [], options: Options = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (!arg.startsWith('--')) { positional.push(arg); continue; }
    const [name, inline] = arg.slice(2).split(/=(.*)/s, 2);
    if (flags.has(name)) { if (inline !== undefined) throw new UsageError(`--${name} takes no value.`); options[name] = true; continue; }
    const value = inline ?? argv[++i];
    if (value === undefined || value.startsWith('--')) throw new UsageError(`--${name} needs a value.`);
    options[name] = value;
  }
  return { command: positional.shift(), positional, options };
}
class UsageError extends Error {}
/** A refusal the caller must resolve: a conflict, a policy check or a blocked Send. */
class Blocked extends Error { constructor(message: string, readonly details: unknown = undefined) { super(message); } }

interface Link { schema: 1; baseUrl: string; projectId: string; paths: string[] }
const linkFile = (folder: string) => join(folder, '.turnleaf', 'cli.json');
async function readLink(folder: string): Promise<Link> {
  let value: Link;
  try { value = JSON.parse(await readFile(linkFile(folder), 'utf8')); }
  catch (error: any) { if (error.code === 'ENOENT') throw new UsageError('This folder is not linked. Run turnleaf link <project-id> first.'); throw new SyncError(`Cannot read ${linkFile(folder)}.`, 'configuration'); }
  if (value?.schema !== 1 || typeof value.projectId !== 'string' || !value.projectId) throw new SyncError(`Unsupported ${linkFile(folder)}.`, 'configuration');
  return { ...value, baseUrl: normalizeBaseUrl(value.baseUrl), paths: validateTrackedFiles(value.paths) };
}

function baseUrlOf(options: Options, io: Io): string {
  return normalizeBaseUrl(String(options['base-url'] ?? io.env.TURNLEAF_BASE_URL ?? 'https://www.overleaf.com'));
}
function sessionFile(options: Options, io: Io, baseUrl: string): string {
  const explicit = options['session-file'] ?? io.env.TURNLEAF_SESSION_FILE;
  if (typeof explicit === 'string') return resolve(io.cwd, explicit);
  const origin = createHash('sha256').update(new URL(baseUrl).origin).digest('hex').slice(0, 16);
  return join(io.env.XDG_CONFIG_HOME || join(homedir(), '.config'), 'turnleaf', `session-${origin}`);
}
async function saveSession(path: string, cookie: string): Promise<void> {
  await mkdir(dirname(path), { recursive: true, mode: 0o700 });
  await writeFile(path, cookie + '\n', { mode: 0o600 }); await chmod(path, 0o600);
}
/** The reader for a server, and a callback that keeps a cookie Overleaf renewed. */
async function connect(options: Options, io: Io, baseUrl: string): Promise<{ reader: OverleafReader; keep(): Promise<void> }> {
  const file = sessionFile(options, io, baseUrl);
  let cookie = io.env.TURNLEAF_COOKIE;
  if (!cookie) {
    try { cookie = (await readFile(file, 'utf8')).trim(); }
    catch (error: any) { if (error.code === 'ENOENT') throw new SessionExpiredError(); throw error; }
  }
  if (!cookie) throw new SessionExpiredError();
  const reader = new OverleafReader(baseUrl, cookie), initial = cookie;
  return { reader, keep: async () => { const now = reader.sessionCookie; if (!io.env.TURNLEAF_COOKIE && now && now !== initial) await saveSession(file, now); } };
}

async function workflowFor(folder: string, link: Link, reader: OverleafReader, options: Options) {
  const state = new ProjectStore(folder, link.baseUrl, link.projectId, link.paths);
  state.syncPictures = () => !!options.pictures;
  const sync = new SyncService(state, reader);
  return { state, sync, workflow: new ReviewWorkflow(sync), files: new LocalReviewFiles(state) };
}
/** Turns the review files on, imports what agents saved there and regenerates REVIEW.md and index.json. */
async function refreshReviewFiles(files: LocalReviewFiles, state: ProjectStore): Promise<void> {
  if ((await state.read()).reviewFiles) await files.sync(); else await files.enable();
}

const destructive = new Set(['deleteThread', 'deleteMessage']);
/** What a plan writes, in a form a script can check. */
function summary(plan: PushPlan) {
  return {
    trackChanges: plan.inspection.trackChanges ?? null,
    files: plan.files.map(file => ({ path: file.doc.path, added: file.added, removed: file.removed, ...file.create && { create: true }, ...file.remove && { remove: true } })),
    pictures: (plan.pictures ?? []).filter(sendsPicture).map(picture => ({ path: picture.path, kind: picture.kind })),
    comments: plan.comments.map(comment => ({ id: comment.id, label: comment.label, path: comment.path, line: comment.line ?? null, threadId: comment.threadId ?? null })),
  };
}
/** The checks a headless Send applies on top of the core's own: refusals, never silent changes. */
export function policyProblems(plan: PushPlan, options: { commentsOnly?: boolean; allowUntrackedEdits?: boolean; allowDeletes?: boolean }): string[] {
  const problems: string[] = [], pictures = (plan.pictures ?? []).filter(sendsPicture);
  if (options.commentsOnly && (plan.files.length || pictures.length))
    problems.push(`--comments-only: the folder also has file changes (${[...plan.files.map(file => file.doc.path), ...pictures.map(picture => picture.path)].join(', ')}). Undo them or drop --comments-only.`);
  // On by default: without a person reviewing the summary, edits must arrive as suggestions.
  if (!options.allowUntrackedEdits && plan.files.some(file => !file.create) && plan.inspection.trackChanges !== true)
    problems.push('Track Changes is off for this account in this project, so edits would change the text directly instead of arriving as suggestions. Turn Track Changes on for this account on Overleaf, send comments only, or pass --allow-untracked-edits.');
  if (!options.allowDeletes) {
    const deletions = [...(plan.operations ?? plan.pending).filter(draft => destructive.has(draft.kind)).map(draft => `${draft.kind} ${draft.id}`),
      ...plan.files.filter(file => file.remove).map(file => `delete ${file.doc.path}`), ...pictures.filter(picture => picture.kind === 'delete').map(picture => `delete ${picture.path}`)];
    if (deletions.length) problems.push(`Deletions need --allow-deletes: ${deletions.join(', ')}.`);
  }
  return problems;
}

export async function run(argv: string[], io: Io): Promise<number> {
  let parsed: ReturnType<typeof parse>;
  try { parsed = parse(argv); } catch (error) { io.err(String((error as Error).message)); io.err(usage); return exitCodes.usage; }
  const { command, positional, options } = parsed;
  if (!command || options.help || command === 'help') { (command ? io.out : io.err)(usage); return command ? exitCodes.ok : exitCodes.usage; }
  const folder = resolve(io.cwd, String(options.folder ?? '.'));
  const print = (text: string, data: unknown) => io.out(options.json ? JSON.stringify(data, null, 2) : text);
  const controller = new AbortController();
  try {
    return await withOperation({ signal: controller.signal, report: message => io.err(message) }, async () => {
      switch (command) {
        case 'sign-in': {
          const baseUrl = baseUrlOf(options, io), executable = findBrowser(typeof options.browser === 'string' ? options.browser : undefined);
          if (!executable) throw new UsageError('No Chrome, Edge, Brave or Chromium browser was found. Pass --browser PATH, or set TURNLEAF_COOKIE.');
          const profileDir = join(dirname(sessionFile(options, io, baseUrl)), 'sign-in-profile');
          io.err('Sign in to Overleaf in the browser window. It closes once you are signed in.');
          const cookie = await browserSignIn({ baseUrl, executable, profileDir, headless: !!options.headless,
            validate: async value => { try { await new OverleafReader(baseUrl, value).signIn(); return true; } catch (error) { if (error instanceof SessionExpiredError) return false; throw error; } } });
          await saveSession(sessionFile(options, io, baseUrl), cookie);
          print(`Signed in to ${baseUrl}.`, { signedIn: true, baseUrl });
          return exitCodes.ok;
        }
        case 'projects': {
          const baseUrl = baseUrlOf(options, io), { reader, keep } = await connect(options, io, baseUrl);
          const projects = await reader.signIn(); await keep();
          print(projects.map(project => `${project.id}  ${project.name}`).join('\n') || 'No projects.', projects);
          return exitCodes.ok;
        }
        case 'link': {
          const projectId = positional[0];
          if (!projectId || positional.length > 1) throw new UsageError('link takes one project ID.');
          if (!!options.files === !!options['all-sources']) throw new UsageError('Choose the files: --files a.tex,b.bib or --all-sources.');
          const baseUrl = baseUrlOf(options, io);
          let paths: string[];
          if (typeof options.files === 'string') paths = options.files.split(',').map(path => path.trim()).filter(Boolean);
          else {
            const { reader, keep } = await connect(options, io, baseUrl);
            paths = (await reader.listSourceFiles(projectId)).paths.filter(path => /\.(tex|bib|sty|cls)$/i.test(path)); await keep();
          }
          const link: Link = { schema: 1, baseUrl, projectId, paths: validateTrackedFiles(paths) };
          await mkdir(dirname(linkFile(folder)), { recursive: true, mode: 0o700 });
          await writeFile(linkFile(folder), JSON.stringify(link, null, 2) + '\n', { mode: 0o600 });
          print(`Linked ${folder} to ${projectId}: ${link.paths.join(', ')}`, link);
          return exitCodes.ok;
        }
        case 'pull': {
          const link = await readLink(folder), { reader, keep } = await connect(options, io, link.baseUrl), { state, workflow, files } = await workflowFor(folder, link, reader, options);
          let plan = await workflow.preparePull();
          const conflicts = plan.files.filter(file => file.conflict).map(file => file.path), pictureConflicts = (plan.pictures ?? []).filter(picture => picture.kind === 'both' && !picture.choice).map(picture => picture.path);
          if (conflicts.length || pictureConflicts.length) {
            if (!options['take-overleaf']) throw new Blocked(`Changed both here and on Overleaf: ${[...conflicts, ...pictureConflicts].join(', ')}. Resolve them by hand, or rerun with --take-overleaf to use Overleaf's version.`, { conflicts, pictureConflicts });
            for (const file of plan.files.filter(file => file.conflict)) plan = workflow.resolve(plan, file.path, file.remote);
            for (const path of pictureConflicts) plan = workflow.choosePicture(plan, path, 'remote');
          }
          const result = { changed: pullChanges(plan), files: plan.files.map(file => ({ path: file.path, added: file.added, removed: file.removed, ...file.conflict && { tookOverleaf: true } })), comments: plan.comments.map(comment => ({ id: comment.id, label: comment.label, path: comment.path })) };
          if (options['dry-run']) { await keep(); print(`Would apply ${result.files.length} file change(s) and ${result.comments.length} comment change(s).`, { dryRun: true, ...result }); return exitCodes.ok; }
          if (result.changed) await workflow.apply(plan, () => true);
          await refreshReviewFiles(files, state); await keep();
          print(result.changed ? `Applied ${result.files.length} file change(s) and ${result.comments.length} comment change(s). Review files: ${await files.path()}` : `Up to date. Review files: ${await files.path()}`,
            { ...result, reviewFiles: dirname(await files.path()) });
          return exitCodes.ok;
        }
        case 'status':
        case 'send': {
          const link = await readLink(folder), { reader, keep } = await connect(options, io, link.baseUrl), { state, sync, workflow, files } = await workflowFor(folder, link, reader, options);
          await refreshReviewFiles(files, state);
          const plan = await workflow.prepareSend(), problems = policyProblems(plan, { commentsOnly: !!options['comments-only'], allowUntrackedEdits: !!options['allow-untracked-edits'], allowDeletes: !!options['allow-deletes'] });
          const planned = summary(plan);
          if (command === 'status' || options['dry-run']) { await keep(); print([pushReport(plan), ...problems.map(problem => `Refused: ${problem}`)].join('\n'), { dryRun: true, ...planned, problems }); return problems.length ? exitCodes.blocked : exitCodes.ok; }
          if (problems.length) throw new Blocked(problems.join('\n'), { ...planned, problems });
          if (!planned.files.length && !planned.pictures.length && !planned.comments.length) { await keep(); print('Nothing to send.', { sent: false, ...planned }); return exitCodes.ok; }
          if (!options.yes) throw new UsageError('send writes to Overleaf: add --yes, or use --dry-run to see what it would write.');
          const result = await sync.push(plan, () => true, line => io.err(line));
          await refreshReviewFiles(files, state); await keep();
          print([`Sent. History record ${result.history}.`, ...result.warnings.map(warning => `Warning: ${warning}`), ...result.mismatches.map(mismatch => `Mismatch: ${mismatch}`)].join('\n'),
            { sent: true, ...planned, history: result.history, warnings: result.warnings, mismatches: result.mismatches });
          return result.mismatches.length ? exitCodes.failed : exitCodes.ok;
        }
        default: throw new UsageError(`Unknown command: ${command}`);
      }
    });
  } catch (error) {
    if (error instanceof UsageError) { io.err(error.message); return exitCodes.usage; }
    if (error instanceof Blocked) { options.json ? io.out(JSON.stringify({ blocked: error.message, details: error.details ?? null }, null, 2)) : io.err(error.message); return exitCodes.blocked; }
    if (error instanceof SessionExpiredError) { io.err('Not signed in, or the Overleaf session expired. Run turnleaf sign-in, or set TURNLEAF_COOKIE.'); return exitCodes.signedOut; }
    // The core reports a blocked Send (interrupted sync, incoming changes, invalid review file) as a SyncError.
    io.err(safeError(error));
    return error instanceof SyncError && ['incoming', 'recovery', 'stale', 'review-files', 'conflict', 'missing'].includes(error.code) ? exitCodes.blocked : exitCodes.failed;
  }
}

if (require.main === module) {
  run(process.argv.slice(2), { out: line => process.stdout.write(line + '\n'), err: line => process.stderr.write(line + '\n'), env: process.env, cwd: process.cwd() })
    .then(code => { process.exitCode = code; });
}
