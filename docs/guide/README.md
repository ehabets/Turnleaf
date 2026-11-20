# Turnleaf user guide

Turnleaf brings the comments and suggestions of an Overleaf project into VS Code or Cursor, merges Overleaf's edits into your local files after you review them, and sends your edits, replies and decisions back in one checked step.

New to Turnleaf? Start with [Getting started](getting-started.md), or open the **Getting Started** walkthrough in the editor (**Turnleaf: Open Getting Started**).

| Page | What it covers |
| --- | --- |
| [Getting started](getting-started.md) | Install, trust the folder, sign in, use a self-hosted server, link a project, choose files, enable sending, sign out |
| [Syncing](syncing.md) | Get latest and the merge preview, the first sync, conflicts, the outgoing summary, Send, Fast and Full checks, Undo this send, Sync history, recovery, live updates, pictures and PDF figures |
| [Comments and suggestions](comments.md) | The Review tab and its filters, gutter markers and highlights, replying, editing, resolving and deleting, suggestions, new comments, local addressed and declined status, the review log |
| [Review files for AI agents and scripts](review-files-for-agents.md) | The JSON and Markdown files under `.turnleaf/`, queuing replies and resolutions, starting new comments from a file |
| [Command line for scripts and agents](command-line.md) | `turnleaf` without an editor: sign in, link, pull, send, the checks a headless Send adds, exit codes |
| [Annotated review PDF](annotated-pdf.md) | Putting the comments on your compiled PDF |
| [Settings](settings.md) | Every `turnleaf.*` setting and color |
| [Troubleshooting](troubleshooting.md) | Common messages, Send blocked, where data is kept, starting over, reporting a bug |

## How Turnleaf works, in short

1. You keep your LaTeX sources in a local folder; your co-authors work on Overleaf.
2. **Get latest** reads the project and shows how Overleaf's changes would merge into your files. **Apply** writes the result.
3. Comments and suggestions appear in the editor. Your replies, resolutions and decisions are queued as drafts.
4. The outgoing summary always lists what would go to Overleaf. **Send** checks Overleaf again and writes exactly that.
5. Every Send and Apply is recorded in Sync history, and a send can be taken back with **Undo this send**.

Sending is off for every project until you turn it on, and Turnleaf never uses Git.
