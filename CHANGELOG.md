# Changelog

All notable user-facing changes to Turnleaf are listed here, newest first. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## Unreleased

### Added

- A command line, `turnleaf` (`npm run build:cli`, then `node dist/cli.js`), for scripts and AI agents: `sign-in`, `projects`, `link`, `pull`, `status` and `send`, which refuses file edits unless Track Changes is on (`--allow-untracked-edits` to lift it), and with `--comments-only` and `--allow-deletes` checks, JSON output and exit codes. It is not part of the extension package. See [Command line for scripts and agents](docs/guide/command-line.md).

## 0.10.2

### Added

- A long first message on a sidebar comment card, cut to three lines, now has **Show more** and **Show less** under it. Unfolding a card's replies also shows its first message in full. Each card keeps the choice when the list refreshes.

## 0.10.1

### Added

- Each comment card in the sidebar shows the thread's newest reply under the first message: author, time and the first two lines of its text. Clicking the reply count unfolds every reply in full inside the card, and the card remembers whether it is unfolded. A reply not yet sent is marked **Pending send**.

## 0.10.0

### Changed

- The extension is now **Turnleaf**, with the extension ID `zeyuxu.turnleaf`. Commands use the `Turnleaf:` category, the Activity Bar container and the output channel are named "Turnleaf", settings use the `turnleaf.` prefix, and local state lives in `.turnleaf/`.
- Settings, local state and sign-ins of earlier versions are not carried over: install Turnleaf, sign in, link the project and choose the files again. Send or discard pending drafts before switching.

### Added

- A **Getting Started** walkthrough (**Welcome → Walkthroughs**, or **Turnleaf: Open Getting Started**): sign in, link a project, choose files, get latest, review comments, enable sending and send.

### Fixed

- The Turnleaf overview opens on its own only in a workspace that holds `.tex` files, not in every new folder.
- The added and removed line counts next to each file match the lines its diff marks: a changed line counts once as removed and once as added, however many edits it has, and a new line counts once.

## 0.9.4

- Nothing is synchronized until files are chosen; `main.tex` and `references.bib` are no longer assumed.
- Choosing a project opens **Choose files** with the project's Overleaf source files ticked, the main document first.
- A selected file that is missing both locally and on Overleaf starts unticked, so **OK** removes it from the selection.

## 0.9.3

- Released under the MIT License.

## 0.9.2

- The comment change that blocks Send is listed first under **Waiting** and marked **Blocks Send**.
- Long comment texts in the outgoing summary fold to four lines.
- The file and line of each outgoing row link to that place in the editor.
- With word wrap on, a comment marker stays below its paragraph whether highlights are on or off.

## 0.9.1

- AI agents and scripts can start new comment threads by saving JSON files in `review/new/`.
- Local review files for agents and scripts are on by default.
- **Open**, **Resolved**, **Suggestions** and **Going out** filters in the Review tab.
- New comments follow their text through later edits.
- **Show in editor** on outgoing comment rows.
- With word wrap on, comment markers go below the paragraph instead of on every wrapped row.

## 0.9.0

- Pictures and PDF figures (PNG, JPG, PDF) are synchronized by content in Get latest, Send and Undo this send.
- An optional fast Send check, with a **Full**/**Fast** switch in the outgoing summary.
- "Checking Overleaf…" shows while the first read after opening the window, or after changing the file selection, runs.

## 0.8.0

- The separate send preview is replaced by an always-visible outgoing summary with one **Send**.
- **Undo this send** takes a send back from Overleaf.
- Local text files that are not on Overleaf yet can be selected and are created at Send.
- The sync state comes first in the sidebar header.

## 0.7.4

- No longer asks for **Use this baseline** by mistake after upgrading from an earlier version.

## 0.7.3

- **Review**, **Setup** and **Sync** tabs in the sidebar.
- Comments whose text was deleted on Overleaf are explained and kept, with the text they were on.

## 0.7.2

- Reviewer names and initials on suggestions, and local date and time on comments and suggestions.
- Clear outline comment markers are turned on for linked workspaces. The previous appearance can be restored in **Project setup → Comment appearance**, and that choice is remembered.

## 0.7.1

- Comments are available as files for AI agents and scripts: an index, a Markdown overview and one JSON file per thread, where replies and resolutions can be queued.
- A finished incoming preview closes after **Apply**.

## 0.7.0

- Fixed comment threads disappearing from the editor after a live update.
- Editor hovers show the date and **Open thread**, **Reply** and **Resolve** links.
- A **Highlights** switch hides or shows every comment highlight.
- Edit or delete your own messages from the review cards and the larger view.
- **Accept all** and **Reject all** suggestions in a file.

## 0.6.0

- Accept and reject suggestions from the sidebar and from the editor hover. Decisions are sent with Send, and rejections also update your local files.

## 0.5.0

- Overleaf-style review cards with author, date, line and a resolve button.
- **Current file** / **All files** switch; the larger view shows the selected thread beside the list.
- Distinct gutter markers for open, resolved and new comments.
- Suggested deletions are shown struck through.
- The extension version is shown in the sidebar.

## 0.4.1

- Edits that were typed and deleted again on Overleaf no longer show as incoming changes.
- Sign out closes the live connection.

## 0.4.0

- **Sign in with Browser**: sign in on Overleaf's own page in a separate browser window. Pasting a session cookie remains available.
- Live updates: one connection per project shows Overleaf edits and comments as they happen.
- Send transmits your reviewed edits as versioned edits instead of whole-file uploads.
- Overleaf changes that do not overlap yours are applied first with **Apply & send**.
- First syncs offer **Use Overleaf version**, **Keep my version** or **Merge manually** for files that differ.

## 0.3.2

- Simpler sidebar with each control in one place, and smoother redrawing.

## 0.3.1

- **Update selection** re-attaches a new comment after its text changed, keeping its message and replies.
- Gutter markers open and close threads with a click.

## 0.3.0

- Synchronization no longer uses Git: state, history and recovery copies are kept in a local folder.
- All comment actions are queued and sent together with file changes.
- New comments from an editor selection.
- **Sync history** with exact file diffs.

## 0.2.1

- Outline icons in a more compact sidebar, and green/red colors in diffs.
- Optional outline comment markers under **Project setup → Comment appearance**.

## 0.2.0

- Sidebar home with guided setup.
- Review of saved files before sending, and merge previews for incoming changes, using the editor's diff view.
- Editable comment threads in the editor.
- Configurable remote checks.

## 0.1.1

- Pull Overleaf changes and push reviewed changes, with writes off by default and a confirmation for each write.
- Replies and resolve/reopen, local **Addressed**/**Declined** status, review log export and annotated review PDF.

## 0.1.0

- First version: sign in, link a project, and inspect its files, comments and suggestions read-only.
