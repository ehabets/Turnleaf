# Command line for scripts and agents

`turnleaf` runs the same Get latest, review files and Send as the extension, without an editor. It is meant for scripts and AI agents, for example a bot account that reviews a paper and leaves comments on Overleaf.

It is a separate build and is not part of the extension package:

```sh
npm ci --ignore-scripts
npm run build:cli
node dist/cli.js --help
```

## A review round

```sh
turnleaf sign-in                                   # once; saves the session
turnleaf projects                                  # find the project ID
turnleaf link 0123456789abcdef01234567 --all-sources
turnleaf pull                                      # first run: downloads the files; later: merges
# ... an agent reads .turnleaf/projects/<key>/review/REVIEW.md,
#     drops new comments into review/new/ and replies into threads/*.json ...
turnleaf send --dry-run                            # what would be written
turnleaf send --yes --comments-only                # write it
```

The review files are described in [Review files for AI agents and scripts](review-files-for-agents.md). The command line turns them on at the first `pull`, and imports and regenerates them at every `pull`, `status` and `send`.

## Commands

| Command | What it does |
| --- | --- |
| `sign-in [--browser PATH] [--headless]` | Opens a Chromium-based browser at the Overleaf sign-in page and saves the session once you are signed in. |
| `projects` | Lists the projects of the signed-in account. |
| `link <project-id> --files a.tex,b.bib` or `--all-sources` | Links the folder to a project and chooses its `.tex`, `.bib`, `.sty` and `.cls` files. Writes `.turnleaf/cli.json`. |
| `pull [--take-overleaf] [--dry-run]` | Get latest. In an empty linked folder, it downloads the selected files (and, with `--pictures`, the pictures). Later it merges Overleaf's changes. Stops if a file changed both here and on Overleaf where they overlap; `--take-overleaf` uses Overleaf's version for those files. |
| `status` | Imports the review files and prints what Send would write, with any refusal. |
| `send [--yes] [--dry-run] [--comments-only] [--allow-untracked-edits] [--allow-deletes]` | Send. Writes nothing without `--yes`. |

Common options: `--folder DIR`, `--base-url URL` (or `TURNLEAF_BASE_URL`; default `https://www.overleaf.com`), `--session-file FILE` (or `TURNLEAF_SESSION_FILE`), `--pictures` to also synchronize pictures (off by default), and `--json` for machine-readable output.

## Checks a headless Send adds

Send keeps all of its own checks: it reads Overleaf again, writes only what the plan lists, verifies the result and records it in Sync history. Without a person reviewing the outgoing summary, these options refuse a Send instead:

- `--comments-only`: refuse when saved files or pictures changed, so only comments, replies and resolutions go out.
- File edits are refused unless Track Changes is on for the signed-in account in this project, because with it off they change the text directly instead of arriving as suggestions. `--allow-untracked-edits` lifts this check.
- Deleting a thread, a message, a created file or a picture is refused unless `--allow-deletes` is given.

## Exit codes

| Code | Meaning |
| --- | --- |
| 0 | Done (or nothing to do). |
| 1 | Failed, or Send verified a mismatch on Overleaf. |
| 2 | Usage error, including `send` without `--yes`. |
| 3 | Needs a decision: a conflict, a refused check, incoming changes, an interrupted sync or an invalid review file. |
| 4 | Not signed in, or the session expired. Run `sign-in` again. |

## The session

The session cookie is saved with owner-only permissions in `~/.config/turnleaf/session-<server>` (or under `XDG_CONFIG_HOME`), and the browser profile used to sign in next to it. When Overleaf renews the cookie, the new one is saved. `TURNLEAF_COOKIE` supplies a cookie for one run without saving it.

### Save the session by hand

When `sign-in` cannot open a browser (for example because an organization's policy blocks it), copy the cookie from any browser where you are signed in to Overleaf with the account to use: open the developer tools, then **Storage** (Safari, Firefox) or **Application** (Chrome) → **Cookies** → `https://www.overleaf.com`, and copy the complete value of `overleaf_session2`, without decoding it. With the value on the clipboard (macOS):

```sh
mkdir -p ~/.config/turnleaf && chmod 700 ~/.config/turnleaf
pbpaste > ~/.config/turnleaf/session-3f828e58a73ebf93 && chmod 600 ~/.config/turnleaf/session-3f828e58a73ebf93
turnleaf projects                                  # lists your projects if the session works
```

`session-3f828e58a73ebf93` is the file name for `https://www.overleaf.com`. For another server, pass `--session-file FILE` (or set `TURNLEAF_SESSION_FILE`) and save the cookie there. Do not sign out in that browser afterwards: signing out ends the session on Overleaf, and the saved cookie stops working. When it expires, commands exit with code 4; save a new cookie the same way. Treat the session file like a password, and prefer a separate Overleaf account for automated reviews, so its comments are clearly labeled.
