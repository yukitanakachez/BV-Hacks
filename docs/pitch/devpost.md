# Nod: approve your agents from the notch

> **Tagline:** Nod puts your Claude Code agents in the MacBook notch. See what each one is doing, read a plain-English risk call on every request, and answer it with ⌥↵ without leaving your editor.
>
> **Demo video:** `video/out/nod-demo.mp4` (93 s) · **Built with:** Swift 6, SwiftUI (Liquid Glass), AppKit, Network.framework, Claude Code hooks, bash/curl/jq, Remotion
>
## Inspiration

We run several Claude Code sessions at once, each in its own worktree: one fixing auth, one rewriting copy, one chasing a flaky CI cache. They're fast, but they keep stopping to ask. *Can I run `npm test`? Can I edit `session.ts`?* Each question means finding the right terminal, reading the prompt, and typing "1". Then you lose your place in what you were doing. It happens dozens of times a day.

The fix that looked obvious, "auto-approve more," is the dangerous one. Most requests are harmless, but buried among them is the occasional `rm -rf ../something`. We didn't want to approve less carefully. We wanted to approve faster while making the risky requests stand out more.

The MacBook notch turned out to be the right place for this. It's always visible, it sits right above whatever you're doing, and it's otherwise wasted space. Apps already put media controls and timers there, and some put agent status there. We wanted it to show a judgment: what is this agent about to do, and how worried should I be?

## What it does

Nod is a macOS menu-bar app that turns the notch into a control surface for every Claude Code session on your machine.

- **Live progress, at a glance.** While any agent works, the notch shows the Claude Code mascot on one side and an animated wave on the other. Hover, and it opens into **Progress**: one avatar per session with a status dot (orange working, amber needs you, green done), the session's latest prompt (**Claude ● add token refresh to auth**), a checklist of finished steps, the current step, and a live tool card with a running timer.
- **Approve from the notch.** Permission requests appear in the notch. **⌥↵** answers the top request from any app, and **⌥⌫** denies it. Your answer goes straight back to Claude Code. The hotkeys are registered only while a request is pending, so Nod never steals your keystrokes otherwise.
- **A plain-English risk read-out on every request.**
  - **Green · Low risk:** read-only or test/build commands inside the repo (`npm test`, `git log`, `swift build`).
  - **Amber · Review:** code edits, which git can undo, shown with the actual diff, plus installs and network fetches.
  - **Red · High risk:** irreversible or outside the project, for example *"Delete 14 files outside this repo"*. The notch glows red, the reason chips say why (*Outside the project · Not in git, can't undo · 14 files, 38 MB*), **Deny becomes the default**, and allowing takes a deliberate **0.9-second press and hold**.
- **Many agents, one queue.** Requests from every session form a single FIFO queue. You clear them with one keystroke each.
- **It learns how you approve.** Every Allow or Deny you make in the notch trains a small machine-learning model on your Mac. After a few decisions each card says what you would most likely do (*Likely allow · 94%*), and flags in amber when your habit and the risk level disagree (*Unusual for you · 81% deny*). It's advice only: it never answers for you and never removes the hold on a red card.
- **Rules for the boring stuff.** *Always allow `npm test` here* creates a per-repo rule. The next matching request passes through on its own and gets counted, so you can see what Nod handled for you.
- **Demo mode.** A scripted story drives the real UI through the real event path, for videos and as a live-demo backup.

## How we built it

**The bridge: Claude Code hooks → curl → localhost.** Nod registers a tiny shell hook (`hooks/nod-hook.sh`) for Claude Code's hook events: SessionStart, UserPromptSubmit, Pre/PostToolUse, PermissionRequest, Notification, Stop and SessionEnd. The hook reads the event JSON on stdin and POSTs it to Nod on `127.0.0.1:47474`. For permission requests, Nod holds the HTTP response open until you decide, and the hook prints the decision JSON back to Claude Code. No compiled helper, no transcript parsing, just documented hooks. `scripts/install-hooks.sh` merges the entries into `settings.json` with `jq`. It's idempotent and writes a timestamped backup first.

**NodCore (Swift library, unit-tested, no UI):**
- `RiskEngine`: a pure function from (tool, input, cwd) to an assessment: level, title, reason chips and diff preview. It parses the shell command and resolves its paths, and anything that reaches outside the repo is raised a level. Titles come from templates and read like a person wrote them. We deliberately didn't use an LLM here: an advisor in the approval path has to be instant, deterministic and offline.
- `SessionStore`: sessions, steps, the request queue and the auto-allowed counter.
- `RulesStore`: per-repo "always allow" rules, saved as JSON.
- `ApprovalModel`: on-device online logistic regression. Each request becomes a sparse vector of binary features (tool, program, command prefix, risk level, reason chips, file extension, host, repo). Each decision is one stochastic gradient step on the log loss, with AdaGrad per-feature learning rates and L2 regularization. The logit starts from a prior set by the risk level, so a brand-new model already leans towards deny on red cards, and the chip only appears after 5 decisions with at least a 60% leaning. No cloud, no training server: the weights are a small JSON file next to the rules.
- `HookServer`: an `NWListener` HTTP server bound to localhost. It rejects browser-originated requests (any `Origin` header, a cross-site `Sec-Fetch-Site`, or a non-loopback `Host`), so a web page can't put fake cards in your notch.

**The app (SwiftUI + AppKit).** A borderless, non-activating `NSPanel` sits above the menu bar on every Space, sized to the real notch from `NSScreen.safeAreaInsets`. Clicks pass through everywhere except the island. The island opens with `.spring(response: 0.5, dampingFraction: 0.8)` and closes critically damped. It stays solid black where it meets the hardware notch and turns into native Liquid Glass (`.glassEffect`) at the bottom edge. Global hotkeys use Carbon `RegisterEventHotKey`.

**Design first.** We iterated on a clickable HTML prototype (`docs/design/prototype.html`) through three versions, from tabs, to a progress-first layout, to true-scale sizing with liquid glass. Then we built the SwiftUI views to match it one to one.

**How we built it in a day: an AI agent team.** We planned with Claude: idea research, three prototype iterations, then a written design spec. The build ran as a multi-agent workflow. A Claude Fable 5.2 orchestrator checked the hook API against the live docs, wrote the plan and the shared Swift contracts, and handed out work. Claude Opus 5.5 agents built the risk engine, the hook bridge, the notch UI and this video in parallel. The orchestrator then integrated everything and ran an end-to-end simulated session. An adversarial reviewer tried to break the result; it found commands rated "low" that shouldn't have been, plus a localhost CSRF hole, and both were fixed before submission. The Swift package ships with 275 tests.

**The demo video** is a Remotion (React) project. We ported the prototype's island to React components with the same CSS, so it's pixel-faithful. We converted the SwiftUI spring parameters to Remotion's `spring()` and drove everything from the frame number. Scene timing comes from the measured length of each voiceover line, so swapping in the final narration re-times the whole video. The narration is ElevenLabs (voice "Brian").

## Challenges we ran into

- **Never making things worse.** An approval tool that hangs your agent is worse than no tool. The hook uses a 0.3 s connect timeout and always exits 0. If Nod isn't running, or times out, Claude Code silently falls back to its own prompt. It fails open to *the normal prompt*, never to "allow."
- **Holding a decision open across processes.** A permission request is an HTTP request that may wait minutes for a human, while Claude Code may cancel it or the user may answer in the terminal instead. Getting the queue, the timeouts and dropped connections right took more care than the UI did.
- **Risk without false alarms.** If everything is red, people stop reading. The rules keep everyday requests (tests, builds, reads, edits inside the repo) green or amber, so a red card is rare enough to get attention.
- **Hotkeys that don't hijack your keyboard.** ⌥↵ is a real key combination in some editors. We register it only while a request is waiting, and unregister it the moment the queue is empty.
- **Liquid glass in the video.** The prototype's glass edge uses a CSS `backdrop-filter` with an SVG displacement filter plus a fade mask. In Remotion's headless Chrome, the mask was silently dropped and left a hard edge. We traced it by transplanting the rendered DOM into the prototype page: Chrome only applies that mask when an ancestor has a rounded overflow clip. The fix was one line, a `border-radius: 0.5px`.

## Accomplishments that we're proud of

- The red request. A "Delete 14 files outside this repo" card that glows red, defaults to Deny and makes you hold to allow is the moment that shows the idea.
- Approving a request takes one keystroke, and you never leave your editor.
- It degrades safely. When Nod is closed, Claude Code behaves exactly as before.
- A risk engine covered by fixture tests whose payloads follow Claude Code's hook schema.
- The video's UI is the real design, not a mock-up of it: the same CSS values, spring physics and glass as the prototype the app was built from.

## What we learned

- The notch works better for questions than for information. Showing status is nice, but being able to answer from there is what saves time.
- Plain English beats a risk score. "Delete 14 files outside this repo" gets an instant, correct reaction. "Risk: 0.82" doesn't.
- Safe defaults have to be visible. Making Deny the default only builds trust if you can see that it's the default.
- Claude Code's hooks are a solid integration surface. Documented events plus a held HTTP response gave us a two-way bridge without patching anything.

## What's next

- **Nod to approve.** Approve with a nod and deny with a head shake, using the camera that's already in the notch. It was our stretch goal, and the name came from it.
- **More agents.** The bridge is just hooks and HTTP, so Codex, Cursor and other agents could plug in.
- **Smarter, still local, rules.** "Allow edits under `src/` for this session," expiring rules, and a weekly summary of what was auto-allowed.
- **Team policies.** Share rule files per repo so a team agrees on what's always safe and what always needs a human.
- **Signed, notarized builds** and a one-click installer for the hooks.
