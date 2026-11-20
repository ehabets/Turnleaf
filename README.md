<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://github.com/ZeyuXuAudio/Turnleaf/raw/HEAD/media/brand/turnleaf-wordmark-dark.png">
    <img src="media/brand/turnleaf-wordmark.png" alt="Turnleaf" width="360">
  </picture>
</p>

<p align="center">
  <strong>Work through your co-authors' Overleaf comments without leaving VS Code or Cursor.</strong><br>
  Review and sync for Overleaf
</p>

Turnleaf is a VS Code and Cursor extension for authors who write LaTeX in a local folder while their co-authors comment and suggest edits on Overleaf. It shows Overleaf comments and suggestions next to your source, merges Overleaf edits into your files after you review them, and sends your edits, replies and decisions back in one checked step.

## Features

- **Comments and suggestions in the editor.** Overleaf threads appear as gutter markers, highlights and native comment threads; suggested insertions and deletions are marked in the text. Reply, edit, resolve, reopen, accept and reject from the sidebar or the editor.
- **Get latest with a merge preview.** Overleaf changes are merged three ways with your saved files and shown as diffs before anything changes on disk. Non-overlapping local edits are kept; conflicts are resolved in the editor.
- **Outgoing summary and one Send.** The sidebar always lists what the next Send writes: files with line counts and every queued comment change. Send checks Overleaf again and writes only what the summary showed.
- **Undo this send.** Take a send back from Overleaf; your local files stay as they are.
- **New comments from a selection.** Select text and start a thread; it follows its text as you keep editing.
- **Sync history.** A local timeline of every Send and Apply, with exact before/after copies and colored diffs.
- **Pictures and PDF figures.** PNG, JPG and PDF files are compared by content and synchronized with the text.
- **Review files for AI agents and scripts.** Comments are kept as JSON and Markdown files that agents can read, and where they can queue replies, resolutions and new comments for you to send.
- **Annotated review PDF.** Put the comments as highlights and margin notes on your own compiled PDF.
- **Command line for scripts and agents.** `turnleaf` runs Get latest, the review files and Send without an editor, for example for an automated reviewer that leaves comments on Overleaf.
- **Self-hosted servers.** Point Turnleaf at your institution's Overleaf Server Pro.

## See it at work

**Get latest, then Apply.** Overleaf's edits are shown as a merge with your files first; Apply writes them and keeps your unsent edits.

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://github.com/ZeyuXuAudio/Turnleaf/raw/HEAD/media/demos/get-latest-dark.gif">
  <img src="https://github.com/ZeyuXuAudio/Turnleaf/raw/HEAD/media/demos/get-latest-light.gif" alt="Get latest opens a merge preview of Overleaf's edits; Apply writes them and keeps the local draft line." width="100%">
</picture>

**Comments and suggestions in the editor.** Open a thread, reply in the native comment widget and accept a suggestion; each change is listed as going out.

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://github.com/ZeyuXuAudio/Turnleaf/raw/HEAD/media/demos/comments-suggestions-dark.gif">
  <img src="https://github.com/ZeyuXuAudio/Turnleaf/raw/HEAD/media/demos/comments-suggestions-light.gif" alt="A reply typed in the editor's comment widget and an accepted suggestion appear in the outgoing summary." width="100%">
</picture>

**Send, then Undo this send.** Send writes exactly what the outgoing summary lists and verifies it on Overleaf; Undo this send takes it back and keeps your local files.

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://github.com/ZeyuXuAudio/Turnleaf/raw/HEAD/media/demos/send-and-undo-dark.gif">
  <img src="https://github.com/ZeyuXuAudio/Turnleaf/raw/HEAD/media/demos/send-and-undo-light.gif" alt="Send is verified on Overleaf; Undo this send shows what is taken back, then sends the undo." width="100%">
</picture>

**Review files for AI agents.** An agent reads the comment files, edits the source and queues a reply; nothing reaches Overleaf until you press Send.

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://github.com/ZeyuXuAudio/Turnleaf/raw/HEAD/media/demos/agent-review-dark.gif">
  <img src="https://github.com/ZeyuXuAudio/Turnleaf/raw/HEAD/media/demos/agent-review-light.gif" alt="An agent in the terminal edits the source and the thread's JSON file; Turnleaf lists both as going out, then sends them." width="100%">
</picture>

## What Turnleaf never does

- It never writes to Overleaf until you turn on **Enable sending** for the project. Sending is off by default for a new project, and **Choose project** turns it off again when the project changes.
- It never sends anything you have not seen in the outgoing summary. Send first reads every selected file again; if Overleaf or your saved files changed since the summary was shown, nothing is sent and the changed rows are marked.
- It never writes Overleaf changes to your files before you have seen them: the preview always comes first, and only **Apply** or **Apply & send** writes them.
- It never runs Git. There are no commits, branches, stashes or merges, and it does not touch your Git metadata.
- It never deletes, renames or bulk-uploads files on Overleaf. The one exception is **Undo this send** removing a file that Turnleaf itself created and that is unchanged since.
- It never stores your Overleaf session in your workspace, settings or logs. The session is kept in the editor's secret storage and, after browser sign-in, in a private browser profile until **Sign out** (see [SECURITY.md](SECURITY.md)).
- It never contacts any server other than the configured Overleaf server, and it collects no telemetry.
- It never publishes what AI agents or scripts queue in the review files until you press **Send**.

The [command line](#command-line) is the exception to the first two points: a script decides when to send. It still writes nothing without `send --yes`, refuses file edits unless Track Changes is on for the account, needs `--allow-deletes` for any deletion, and keeps its session in `~/.config/turnleaf`, never in the project folder.

## Install

Turnleaf is currently installed from a VSIX file:

1. Download `turnleaf-<version>.vsix` from the repository's Releases page, or build it yourself (see [CONTRIBUTING.md](CONTRIBUTING.md)).
2. In VS Code or Cursor, run **Extensions: Install from VSIX…** from the Command Palette and choose the file.

Publication on the Visual Studio Marketplace and Open VSX is coming soon.

Requirements:

- VS Code 1.85.2 or newer, or a current Cursor release.
- A local folder opened as a **trusted** workspace. Turnleaf does not run in Restricted Mode, virtual workspaces or untrusted folders.
- An Overleaf account on overleaf.com or on a Server Pro installation.
- For **Sign in with Browser**: Chrome, Edge, Brave or Chromium. Without one, you can paste a session cookie instead.

## Quick start

1. Open the folder with your LaTeX sources and trust it.
2. Open **Turnleaf** in the Activity Bar and choose **Sign in with browser**. Sign in on Overleaf in the window that opens; it closes by itself.
3. Choose **Choose project**, then tick the source files to synchronize in **Choose files**.
4. Choose **Get latest**, look through the diffs, then **Apply**. This sets the shared starting point.
5. Work on your files. Read and answer comments in the **Review** tab or in the editor.
6. When you are ready to publish, choose **Enable sending** once, check the outgoing summary, and choose **Send**.

The same steps are in the **Turnleaf: Open Getting Started** walkthrough (**Welcome → Walkthroughs**).

## How it works

Turnleaf keeps the last synchronized version of each selected file in a private `.turnleaf/` folder in your workspace. **Get latest** compares that version, your saved files and Overleaf's current text, and shows the merged result before writing it. Your replies, resolutions, suggestion decisions and new comments are kept as local drafts. The outgoing summary is recomputed whenever your saved files, drafts or the known Overleaf state change, and **Send** writes exactly what it shows, then reads it back to verify it. Every Send and Apply is recorded in Sync history.

The sidebar has three tabs:

- **Review**: comments and suggestions of the current file or all files, with filters.
- **Setup**: sign-in, project, files, sending, comment appearance and the switch for AI agent files.
- **Sync**: how often Overleaf is checked, Sync history, local review files and the version.

## Common commands

The commands below are in the Command Palette under **Turnleaf:**.

| Command | What it does |
| --- | --- |
| **Turnleaf: Sign In with Browser** | Sign in on Overleaf's page in a separate browser window |
| **Turnleaf: Link Project** | Choose the Overleaf project for this folder |
| **Turnleaf: Choose Source Files** | Choose the files to synchronize |
| **Turnleaf: Get Latest (Preview)** | Preview and apply Overleaf's changes |
| **Turnleaf: Show Outgoing Summary and Send** | Show what goes out next |
| **Turnleaf: New Comment on Selection** | Start a comment on the selected text (also in the editor's context menu) |
| **Turnleaf: Open Sync History** | Open the timeline of sends and applies |
| **Turnleaf: Export Annotated Review PDF** | Put the comments on your compiled PDF |

## Command line

For scripts and AI agents, `turnleaf` runs the same workflow without an editor. It is a separate build and not part of the extension package:

```sh
npm ci --ignore-scripts && npm run build:cli      # builds dist/cli.js
node dist/cli.js sign-in                          # or save the session cookie by hand (below)
node dist/cli.js link <project-id> --folder paper --all-sources
node dist/cli.js pull --folder paper              # first run downloads the files
# ... an agent queues comments in the review files ...
node dist/cli.js send --folder paper --dry-run    # what would be written
node dist/cli.js send --folder paper --yes        # write it
```

If `sign-in` cannot open a browser, for example because of an organization's browser policy, [save the session cookie by hand](docs/guide/command-line.md#save-the-session-by-hand). Every command can print JSON (`--json`) and returns exit codes a script can act on. See [Command line for scripts and agents](docs/guide/command-line.md).

## Documentation

The [user guide](docs/guide/README.md) covers each task in detail:

- [Getting started](docs/guide/getting-started.md): install, sign in, link a project, choose files
- [Syncing](docs/guide/syncing.md): Get latest, the outgoing summary, Send, Undo this send, Sync history, pictures
- [Comments and suggestions](docs/guide/comments.md): the Review tab, gutter markers, threads, new comments, suggestions
- [Review files for AI agents and scripts](docs/guide/review-files-for-agents.md)
- [Annotated review PDF](docs/guide/annotated-pdf.md)
- [Command line for scripts and agents](docs/guide/command-line.md)
- [Settings](docs/guide/settings.md)
- [Troubleshooting](docs/guide/troubleshooting.md)

## Limitations

- Turnleaf uses the same web interface as the Overleaf editor in your browser. It is not a public API and can change without notice, which can break Turnleaf until it is updated.
- Overleaf Community Edition has no comments or Track Changes, and Turnleaf cannot read projects from a Community Edition server. Use overleaf.com or Server Pro.
- Track Changes stays an Overleaf setting. When it is on, your edits to existing files arrive on Overleaf as your suggestions, but the initial contents of a new file that Send creates arrive as plain text, like pictures. Turnleaf shows the detected state but does not change it.
- A write cannot be atomic with a collaborator typing at the same moment. Send checks the version just before writing and verifies the result afterwards, but an edit made in that instant can still be overwritten. Overleaf's project history keeps it.
- Synchronized text files must be `.tex`, `.bib`, `.sty` or `.cls`, valid UTF-8 with LF line endings, without NUL characters or characters outside the Basic Multilingual Plane (such as emoji), and at most 1 MB each. Symbolic links are refused.
- Pictures are limited to PNG, JPG and PDF and to the server's upload limit (50 MiB if the server reports none). A PNG or JPG that exists on both sides opens as a side-by-side diff; a PDF opens in the system viewer. Files linked on Overleaf from a URL or another project are not sent.
- Renames and deletions are not synchronized. A selected file that was deleted or renamed on Overleaf is reported, not created there again.
- Creating a comment takes two server steps. If the connection fails between them, Turnleaf reports the result as uncertain and never sends it again on its own.

## Disclaimer

Turnleaf is an independent project. It is not affiliated with, endorsed by or supported by Overleaf; "Overleaf" is used only to describe what the extension works with. Use Turnleaf with your own account, in line with Overleaf's terms of service, and keep your own backups of important projects.

## Contributing and security

See [CONTRIBUTING.md](CONTRIBUTING.md) to build and test Turnleaf, and [SECURITY.md](SECURITY.md) for what it stores and how to report a vulnerability. Changes are listed in [CHANGELOG.md](CHANGELOG.md).

## License

Turnleaf is released under the [MIT License](LICENSE). It includes an MIT-licensed adaptation of [olcli](https://github.com/aloth/olcli) and bundles third-party packages under their own licenses; see [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
