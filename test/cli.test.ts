import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, rm, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { run, exitCodes } from '../src/cli/turnleaf';
import { fixtureCookie, startFixtureServer } from './fixtureServer';

async function cli(options: { trackChanges?: boolean; cookie?: string | null } = {}) {
  const fixture = await startFixtureServer({ writable: true, trackChanges: options.trackChanges ?? true });
  fixture.replies.modern[0] = { content: 'Rain was excluded.\n\nMethods.\n\nResults.\n\nDrift: 0.64.\n', comments: [{ id: 'c1', ranges: [{ pos: 0, length: 4 }] }], trackedChanges: [] };
  const root = await mkdtemp(join(tmpdir(), 'turnleaf-cli-')), config = await mkdtemp(join(tmpdir(), 'turnleaf-cli-config-'));
  const env: NodeJS.ProcessEnv = { XDG_CONFIG_HOME: config, ...options.cookie !== null && { TURNLEAF_COOKIE: options.cookie ?? fixtureCookie } };
  const exec = async (...argv: string[]) => {
    const out: string[] = [], err: string[] = [];
    const code = await run([...argv, '--folder', root, '--base-url', fixture.baseUrl], { out: line => out.push(line), err: line => err.push(line), env, cwd: root });
    return { code, out: out.join('\n'), err: err.join('\n'), json: () => JSON.parse(out.join('\n')) };
  };
  const reviewDir = async () => (await exec('pull', '--json')).json().reviewFiles as string;
  return { fixture, root, exec, reviewDir, close: async () => { await fixture.close(); await rm(root, { recursive: true, force: true }); await rm(config, { recursive: true, force: true }); } };
}

test('cli: link, pull into an empty folder, queue a new comment from a file and send it only with --yes', async () => {
  const c = await cli();
  try {
    assert.equal((await c.exec('link', 'test-project', '--files', 'main.tex,references.bib')).code, exitCodes.ok);
    const pulled = await c.exec('pull', '--json');
    assert.equal(pulled.code, exitCodes.ok, pulled.err);
    assert.match(await readFile(join(c.root, 'main.tex'), 'utf8'), /Rain was excluded/);
    const review = pulled.json().reviewFiles as string;
    await readFile(join(review, 'REVIEW.md'), 'utf8');
    await writeFile(join(review, 'new', 'agent-1.json'), JSON.stringify({ id: 'agent-1', path: 'main.tex', quote: 'Methods.', text: 'Please describe the sampling rate.' }));
    const dry = await c.exec('send', '--dry-run', '--json');
    assert.equal(dry.code, exitCodes.ok, dry.err);
    assert.deepEqual(dry.json().comments.map((comment: { label: string }) => comment.label), ['New comment']);
    const before = Object.keys(c.fixture.threads).length;
    assert.equal((await c.exec('send')).code, exitCodes.usage);
    assert.equal(Object.keys(c.fixture.threads).length, before);
    const sent = await c.exec('send', '--yes', '--comments-only', '--json');
    assert.equal(sent.code, exitCodes.ok, sent.err);
    assert(Object.values(c.fixture.threads).some((thread: any) => thread.messages.some((message: any) => message.content === 'Please describe the sampling rate.')));
    assert.equal((await c.exec('send', '--yes', '--json')).json().sent, false);
  } finally { await c.close(); }
});

test('cli: edits are refused while Track Changes is off unless --allow-untracked-edits is given', async () => {
  const c = await cli({ trackChanges: false });
  try {
    await c.exec('link', 'test-project', '--files', 'main.tex');
    assert.equal((await c.exec('pull')).code, exitCodes.ok);
    const text = await readFile(join(c.root, 'main.tex'), 'utf8');
    await writeFile(join(c.root, 'main.tex'), text.replace('Methods.', 'Methods and materials.'));
    const version = c.fixture.replies.modern[1];
    const refused = await c.exec('send', '--yes', '--json');
    assert.equal(refused.code, exitCodes.blocked);
    assert.match(refused.json().blocked, /Track Changes is off/);
    assert.equal(c.fixture.replies.modern[1], version);
    const sent = await c.exec('send', '--yes', '--allow-untracked-edits');
    assert.equal(sent.code, exitCodes.ok, sent.err);
    assert(c.fixture.replies.modern[1] > version);
  } finally { await c.close(); }
});

test('cli: --comments-only refuses when saved files changed', async () => {
  const c = await cli();
  try {
    await c.exec('link', 'test-project', '--files', 'main.tex');
    await c.exec('pull');
    await writeFile(join(c.root, 'main.tex'), (await readFile(join(c.root, 'main.tex'), 'utf8')) + 'Extra.\n');
    const refused = await c.exec('send', '--yes', '--comments-only');
    assert.equal(refused.code, exitCodes.blocked);
    assert.match(refused.err, /comments-only/);
  } finally { await c.close(); }
});

test('cli: deleting a thread needs --allow-deletes', async () => {
  const c = await cli();
  try {
    await c.exec('link', 'test-project', '--files', 'main.tex');
    const review = await c.reviewDir();
    const path = join(review, 'threads', 'c1.json'), thread = JSON.parse(await readFile(path, 'utf8'));
    thread.localEdits = [{ id: 'drop-c1', action: 'deleteThread' }];
    await writeFile(path, JSON.stringify(thread, null, 2));
    assert.equal((await c.exec('send', '--yes')).code, exitCodes.blocked);
    assert(c.fixture.threads.c1);
    assert.equal((await c.exec('send', '--yes', '--allow-deletes')).code, exitCodes.ok);
    assert.equal(c.fixture.threads.c1, undefined);
  } finally { await c.close(); }
});

test('cli: --take-overleaf resolves a conflict with Overleaf\'s text; without it pull stops', async () => {
  const c = await cli();
  try {
    await c.exec('link', 'test-project', '--files', 'main.tex');
    await c.exec('pull');
    // The same number changed differently on both sides, as in folderWorkflow.test.ts.
    await writeFile(join(c.root, 'main.tex'), (await readFile(join(c.root, 'main.tex'), 'utf8')).replace('0.64', '0.60'));
    c.fixture.replies.modern[0].content = c.fixture.replies.modern[0].content.replace('0.64', '0.58'); c.fixture.replies.modern[1]++;
    assert.equal((await c.exec('pull')).code, exitCodes.blocked);
    assert.match(await readFile(join(c.root, 'main.tex'), 'utf8'), /0\.60/);
    assert.equal((await c.exec('pull', '--take-overleaf')).code, exitCodes.ok);
    assert.match(await readFile(join(c.root, 'main.tex'), 'utf8'), /0\.58/);
  } finally { await c.close(); }
});

test('cli: without a session it exits with the signed-out code; unknown commands are usage errors', async () => {
  const c = await cli({ cookie: null });
  try {
    await mkdir(join(c.root, '.turnleaf'), { recursive: true });
    await c.exec('link', 'test-project', '--files', 'main.tex');
    assert.equal((await c.exec('pull')).code, exitCodes.signedOut);
    assert.equal((await c.exec('frobnicate')).code, exitCodes.usage);
  } finally { await c.close(); }
});
