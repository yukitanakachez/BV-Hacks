# notchAgent

> Formerly **Nod**. The rename is in progress: the app bundle (`Nod.app`), source folders, settings paths and
> environment variables still use the old name, and the commands below use them as they are today.

**Approve your Claude Code agents from the MacBook notch, with a plain-English read-out of how risky each request is.**

![A high-risk request in the notch](docs/design/app-request-high.png)

## Why

Running several Claude Code sessions in parallel means each one keeps stopping to ask "run `npm test`?" or "edit
session.ts?", and every answer costs a window switch. notchAgent moves progress and approvals into the notch. You see what
every agent is doing at a glance, and you answer a request with one keystroke from whatever app you are in.

The same goes for giving an agent its next task. Press `⌃⌥P`, type a rough prompt in the notch, and notchAgent rewrites it
into a precise Claude Code prompt, shows it to you to edit, and types it into the session you picked when you press
Send. It learns from your edits: add "run tests after edits" once and the next polish already has it.

## Features

- **Live progress.** Collapsed, the notch shows the mascot and a wave while any session works. Hover to open
  Progress: one avatar per session, the last prompt, the completed steps and the current tool with a live timer.
- **Approve or deny from the notch.** Claude Code permission requests appear in the island. Click, or use a global
  hotkey, and the decision goes straight back to Claude Code.
- **Risk read-out.** Every request gets a plain-English title, a level (low, review, high), reason chips, and the
  real diff for edits. The classifier parses the shell command (pipes, `&&`, `$(...)`, `sudo`, `bash -c`,
  `curl | sh`, paths outside the project, secrets files) and never runs or reads anything.
- **Safe defaults for dangerous requests.** High risk glows red, Deny becomes the default action, and allowing takes
  a 0.9 second press-and-hold.
- **Always-allow rules.** "Always allow `npm test`" saves a per-repo rule. Later matches are answered at once and
  counted in the menu. Rules never match compound commands, anything rated high, or anything outside the project.
- **Learned approvals.** notchAgent learns your own approval habits. Every Allow or Deny you make in the notch trains a
  small on-device model (online logistic regression with AdaGrad), and later cards show what you would most likely
  do: "Likely allow · 94%", or an amber "Unusual for you · 81% deny"
  ([screenshot](docs/design/app-request-unusual.png)) when your habit and the risk level disagree.
  The chip appears after 5 decisions and only when the model leans at least 60% one way. It is advice only: it
  never answers a request, never changes the default button, and never skips the hold on a high-risk card.
- **Several sessions.** Requests from all sessions queue up first-in, first-out.
- **Prompt composer.** `⌃⌥P` (or a click on the session's avatar) opens a text field in the notch. **Polish** sends
  your rough text to Claude Haiku 5.5 and puts the result in an editable pane. **Send** types it into the session's
  tmux pane. Nothing is sent to a session until you press Send or Return on the text.
- **Learned style.** Every send is compared with what the polish proposed. Lines you add become "Add:" notes,
  lines and filler words you keep deleting become "Leave out" notes, and notchAgent tracks whether you cut or expand the
  polish, bullets or sentences, and the verbs you use. The notes go into the next polish request, and a
  "Learned: …" chip shows each change. A note you delete twice in a row is dropped. The learning is plain local
  code; see [What leaves your Mac](#what-leaves-your-mac).
- **Demo mode.** A scripted story plays through the real store and UI without Claude Code.

| Low risk | Review (edit with diff) | High risk |
|---|---|---|
| ![low](docs/design/app-request-low.png) | ![review](docs/design/app-request-review.png) | ![high](docs/design/app-request-high.png) |

| Working | Progress | Finished |
|---|---|---|
| ![working](docs/design/app-working.png) | ![progress](docs/design/app-progress.png) | ![done](docs/design/app-progress-done.png) |

| Rough prompt | Polished, editable | Sent, with what was learned |
|---|---|---|
| ![draft](docs/design/app-composer-draft.png) | ![polished](docs/design/app-composer-polished.png) | ![sent](docs/design/app-composer-sent.png) |

These images come from the app's own `--snapshot` renderer (offscreen, so the glass uses a gradient fallback). The
design reference is [`docs/design/prototype.html`](docs/design/prototype.html).

## Install

Needs macOS 26 or later, Xcode 26+ (Swift 6.2+), and `jq` for the install scripts.

```sh
scripts/bundle.sh            # release build -> build/Nod.app (menu-bar agent, ad-hoc signed)
open build/Nod.app           # the mascot appears in the menu bar; the island sits on the notch
scripts/install-hooks.sh     # adds notchAgent's hooks to ~/.claude/settings.json
```

`install-hooks.sh` writes a timestamped backup next to the file first (`settings.json.nod-backup-<date>`), keeps
every unrelated key and hook, refuses invalid JSON, and is safe to run twice. Use `--dry-run` to see the result
without writing, or `--settings PATH` to target another file. The menu item "Install Claude Code hooks…" runs the
same script after a confirmation.

The hooks point at the absolute path of `hooks/nod-hook.sh`. If you move the repo or the app, run the install
script again.

To remove notchAgent's hooks (and only those):

```sh
scripts/uninstall-hooks.sh
```

### For the prompt composer

Sending needs `tmux` (`brew install tmux`), and the session has to run inside a tmux pane that notchAgent knows about.
Start Claude Code with the launcher instead of `claude`:

```sh
cd ~/code/my-repo
/path/to/Nod/scripts/nod-claude                # tmux session "nod-my-repo", then attaches
/path/to/Nod/scripts/nod-claude -- --model opus  # arguments after -- go to claude
```

`nod-claude` runs `claude --session-id <new uuid>` in a new tmux session and writes
`~/Library/Application Support/Nod/panes/<session id>.json` (pane id, tmux socket, server pid, directory). notchAgent uses
that file to find the pane. A session started any other way still shows up in the notch, but the composer can only
offer **Copy** for it.

Polish needs an Anthropic API key. Either start notchAgent from a shell that has `ANTHROPIC_API_KEY` set, or use the
menu item **Set Anthropic API key…**, which stores it in your login Keychain (service `Nod`, account
`anthropic-api-key`). Without a key the composer says so and you can still send the text as written.

## Usage

| Do this | To |
|---|---|
| Hover the notch | open Progress; click another session's avatar to switch to it |
| `⌃⌥P` (Control-Option-P), or click the avatar of the session Progress is showing | open the prompt composer for that session; `⌃⌥P` again hides it and keeps the draft |
| `↵` in the composer | Polish the rough text; on the polished text, Send |
| `⇧↵` in the composer | new line |
| `esc` in the composer | discard the prompt and close |
| `⌥↵` (Option-Return) | take the default action: Allow for low and review, **Deny** for high |
| `⌥⌫` (Option-Delete) | deny |
| Press and hold "Hold to allow" for 0.9 s | allow a high-risk request |
| Click "Always allow `<command>`" | allow, and save a rule for this repo |
| Click "Open full diff" | open the file an edit request would change |

`⌥↵` and `⌥⌫` are registered only while a request is showing, so they do not shadow other apps the rest of the time.
`⌃⌥P` is registered while notchAgent runs. The composer takes the keyboard only while it is open and gives it back when
it closes; notchAgent never becomes the active app. A permission request that arrives while you are writing waits (the
composer says so) and shows as soon as the composer closes.
A hotkey only answers the card that is on screen, and only once it has been there for half a second (and half a
second after the previous decision), so a double tap or a key already on its way down never answers a request you
have not read.

Safety notes:

- The hook server only talks to local tools. Requests with an `Origin` header, a `Host` other than
  `127.0.0.1` / `localhost`, or a POST that is not `application/json` are refused, so a web page cannot put fake
  cards in the notch.
- Always-allow rules never cover a riskier variant of the command (`sort` does not allow `sort -o file`), an
  argument containing `=`, a write to `.git/`, `.claude/` or `.mcp.json`, or `sed` / `awk` / `rg` at all.
- "Install Claude Code hooks…" copies `nod-hook.sh` to `~/Library/Application Support/Nod/` and registers that
  copy, so the hooks keep working if this checkout moves.
You can still answer in the terminal: the first answer wins and notchAgent drops the request.

- The composer only types into a pane that is showing Claude Code's input prompt, and never into a session that
  has a permission request open: text typed into a dialog would answer it. In those cases, and when tmux or the
  pane is missing, it tells you why and offers **Copy** instead.
- Prompt text goes to tmux as an argument list or on stdin (a paste buffer for multi-line text), never through a
  shell, AppleScript or the Accessibility API. Control characters are stripped first.

Rules live in `~/Library/Application Support/Nod/rules.json`. Delete an entry there to remove a rule.
The learned approval model lives in `~/Library/Application Support/Nod/approvals.json` (mode 0600): one weight per
feature, plus counts. The menu shows how many decisions it has learned from and has **Reveal learned approvals in
Finder** and **Reset learned approvals…**.
The learned style lives in `~/Library/Application Support/Nod/style.json` (mode 0600). It is readable JSON: the
notes with their counts, and your last 50 prompts as rough text, polish and what you sent. The menu has
**Reveal learned style in Finder** and **Reset learned style…**.

Demo and debugging:

```sh
build/Nod.app/Contents/MacOS/Nod --demo        # play the scripted story (also: menu > Play demo)
scripts/simulate.sh story                      # post fixture hook payloads to a running notchAgent
build/Nod.app/Contents/MacOS/Nod --snapshot build/snapshots   # render every state to PNG
NOD_LOG=1 NOD_PORT=47480 build/Nod.app/Contents/MacOS/Nod     # debug log, another port
```

`NOD_LOG` output never contains prompt text, polished text, style notes or the API key; composer lines are counts
and status only (`composer: polish ok, 42 -> 180 chars, 2 style notes, 412 ms`). `NOD_STYLE_FILE`,
`NOD_PANES_DIR`, `NOD_TMUX` and `NOD_APPROVALS_FILE` point notchAgent at another style file, pane directory, tmux binary
or approval model.

## Architecture

```
Claude Code                         Nod.app (menu-bar agent)
-----------                         ------------------------------------------------------
hook event                          HookServer            127.0.0.1:47474, Network.framework
   |  stdin JSON                        |  POST /hook/<Event>
   v                                    v
hooks/nod-hook.sh --- curl ------>  SessionStore          sessions, steps, FIFO request queue
   ^                                    |-- RiskEngine    level, title, reasons, diff preview
   |                                    |-- RulesStore    always-allow rules (auto-answer)
   |                                    v
   |                                IslandModel -> SwiftUI island in a click-through NSPanel
   |                                    ^
   |                                    |  click / Option-Return / Option-Delete / hold
   |   held HTTP response               |
   +---- decision JSON <----------  SessionStore.resolve(...)

tmux pane  <-- send-keys / paste-buffer --  TmuxPromptSender  <-- Send --  ComposerModel (island)
(scripts/nod-claude)                                                         |  Polish        ^ notes
                                              api.anthropic.com  <-- HTTPS --+                |
                                              (rough text, style notes, repo names)   StyleLearner -> style.json
```

- `Sources/NodCore`: models, hook contract, risk engine, rules, session store, HTTP server. No UI.
  `Sources/NodCore/Compose` holds the composer's logic: the style learner and its store, the polish request,
  the git context, and the tmux send path. `Sources/NodCore/Learn` holds the approval model: feature extraction,
  the logistic regression, and its store.
- `Sources/Nod`: the app (panel, island views, hotkeys, demo, snapshots).
- `hooks/nod-hook.sh`: the only thing Claude Code runs. For a `PermissionRequest` the HTTP response is held open
  until you decide, and the hook prints exactly one line:

```json
{"hookSpecificOutput":{"hookEventName":"PermissionRequest","decision":{"behavior":"allow"}}}
{"hookSpecificOutput":{"hookEventName":"PermissionRequest","decision":{"behavior":"deny","message":"Denied from Nod."}}}
```

The full contract is in [`docs/superpowers/plans/hook-contract.md`](docs/superpowers/plans/hook-contract.md) and the
design in [`docs/superpowers/specs/2026-11-15-nod-design.md`](docs/superpowers/specs/2026-11-15-nod-design.md).
The composer is specified in
[`docs/superpowers/specs/2026-11-15-prompt-composer.md`](docs/superpowers/specs/2026-11-15-prompt-composer.md).

## Safety guarantees

- **Nothing is auto-allowed except by a rule you created.** The risk engine and the learned approval model only
  advise.
- **Fail open to Claude Code's own prompt.** If notchAgent is not running, crashes, or times out, the hook prints nothing
  and exits 0 within milliseconds, and Claude Code asks in the terminal as usual. The hook never exits non-zero.
- **Nothing is sent to a session without you.** The composer never auto-sends: Polish only fills the editable
  pane, and text reaches a session only when you press Send (or Return on the text).
- **One outbound call, and only when you press Polish.** See [What leaves your Mac](#what-leaves-your-mac). The
  hook server still listens on 127.0.0.1 only, and approvals, the risk read-out, rules and progress never use the
  network.
- **Deny rules still win.** An allow from notchAgent does not override a deny rule in Claude Code's settings.
- **`AskUserQuestion` and `ExitPlanMode` pass through** to the terminal untouched.
- **Your settings are backed up** before the install or uninstall script changes them.

## What leaves your Mac

Before the composer, nothing did. Now one thing does, and only when you press **Polish**: an HTTPS request to
`api.anthropic.com` (Messages API, model `claude-haiku-5-5`, at most 800 output tokens). It contains exactly:

- the rough prompt text you typed;
- your style notes (up to 8 short lines such as `Add: “run tests after edits”`);
- repo context for the selected session: its directory (home shortened to `~`), the git branch, the subjects of
  the last 3 commits, and the names of changed files from `git status --porcelain` (at most 30);
- a fixed system prompt describing the rewriting job, and your API key in the request header.

It never contains file contents, diffs, the session's transcript, permission requests, or your prompt history.
Anthropic handles the request under the terms of your API account.

Everything else stays on the machine: the style profile and its learning (plain Swift code, no model), the
learned approval model (trained and run in-process, never uploaded), the git commands that gather the context, the
tmux send, and all of the approval features.

To turn it off, untick **Polish prompts with Claude Haiku** in the menu. The composer then sends your text as
written and notchAgent makes no network request at all. The profile still learns from what you send.

## Tests

```sh
swift test          # 454 tests: risk engine, rules, formatter, server, store, hook scripts, island model,
                    # style learner, polish request, git context, tmux argv, nod-claude, composer flow,
                    # approval model (features, learning, persistence, what does and does not train it)
scripts/e2e.sh      # bundles the app, then drives the real path with nod-hook.sh and checks the decision bytes;
                    # then the composer: stub polish -> learned note -> the exact tmux argv
```

`scripts/e2e.sh` starts the app with `--test-autodecide`, a test-only flag that answers each request through the
same model actions as the buttons and hotkeys. It uses a private port and temporary rules and approval-model files,
and checks that the decisions trained the model. The composer part uses `--test-compose`, which polishes with an
offline stub (no network), a fake `tmux` that records its arguments, and temporary style and pane files. Unit tests never run tmux or call the API.

## Limitations

- Claude Code only, on a Mac with macOS 26+. Screens without a notch get a simulated one.
- The risk read-out is lexical: it reads the command text, not the disk. It cannot say how many files an `rm`
  would delete, and an unusual command can be rated lower or higher than it deserves. Read the command.
- The terminal prompt stays visible while notchAgent holds a request; either place can answer.
- Rules have no editing UI yet (the Rules tab in Progress is a placeholder).
- The composer can only send to sessions started with `scripts/nod-claude` (tmux). After `/clear` the session id
  changes and notchAgent falls back to matching the pane by directory, which works only while one launcher session runs
  in that directory.
- The style learner is simple and literal. It compares lines by shared words, so it can learn a note you did not
  mean; the note is dropped once you delete its effect twice, or edit `style.json`.
- The "is this pane at its prompt" check reads the pane's text and was calibrated on Claude Code 2.1.322. If a
  later version draws its input differently, Send reports "not at its prompt" and offers Copy.
- The approval model learns from features of the request (tool, program, prefix, risk level, reasons, file
  extension, host, repo folder name), not from what the command means. It needs a handful of decisions before it
  says anything, and it can be confidently wrong about a request that looks like ones you usually allow. Read the
  card.
- Hook payloads over 1 MB are skipped, so that step is missing from the progress list.
- Not notarized or sandboxed; the bundle is ad-hoc signed for local use.
