# Nod: 2-minute live demo run-of-show

**Goal:** show, live, three moments: progress at a glance, approving with ⌥↵ without leaving the editor, and the red high-risk card with Deny as the default. Everything else is optional.
**Rule:** if anything stalls for more than ~10 seconds, switch to the fallback ladder at the bottom. Don't debug on stage.

---

## T-30 min: setup (on the demo MacBook)

1. **Build the app.** Run `scripts/bundle.sh`, which creates `build/Nod.app`. Launch it, and the Nod icon appears in the menu bar.
2. **Install the hooks.** Menu bar → **Install Claude Code hooks…** (or `scripts/install-hooks.sh`). It backs up `~/.claude/settings.json` to `settings.json.nod-backup-<timestamp>` first. Afterwards, `scripts/uninstall-hooks.sh` removes only Nod's entries. Do this on the demo machine only.
3. **Prepare three or four worktrees** of a small sample repo (e.g. `token-refresh`, `hero-copy`, `ci-cache`, `api-docs`), each with a Claude Code session open in its own terminal tab. Keep the permission mode at the default, so requests actually ask.
4. **Stage the high-risk request safely.** Create a throwaway folder *outside* the repo with dummy files:
   `mkdir -p ../design-assets/export && for i in $(seq 1 14); do head -c 2700000 /dev/urandom > ../design-assets/export/frame-$i.png; done`
   You'll press **Deny** on stage, but if anything goes wrong, nothing real is lost.
5. **Pre-type the prompts** (don't send them yet):
   - Session A: *"add token refresh to auth, then run the auth tests"* (asks for `npm test`, low risk)
   - Session B: *"rewrite the hero copy, and clean out ../design-assets/export first"* (asks for `rm -rf ../design-assets/export/*`, high risk)
   - Session C: *"fix the flaky CI cache"* (gives it progress to show)
6. **Projector check.** Mirror the display, don't extend it, so the audience sees the real notch area. The island is small on a projector, so turn on **System Settings → Accessibility → Zoom** with a modifier+scroll shortcut and practice zooming on the notch.
7. **Dry run** the whole thing once. Then run `scripts/simulate.sh --fast session-start` to confirm Nod answers on `127.0.0.1:47474`.
8. Open the editor full-screen on `session.ts`. Close Slack, mail and notifications (turn on Focus mode).

## The two minutes

| Time | Do | Say (short) |
|---|---|---|
| **0:00–0:15** | Editor on screen, notch idle. Send the prompts in Sessions A and C, then switch back to the editor. | "I run several Claude Code agents at once. Normally every 'can I run npm test?' means hunting for the right terminal. Watch the notch instead." |
| **0:15–0:35** | The notch turns into the working state (mascot + wave). **Hover** it: Progress opens. Point at the avatars, the prompt, the steps, the live tool timer. Click another avatar. | "Every session gets an avatar. Hover, and I see what it's doing: the task, finished steps, and the tool running right now." |
| **0:35–0:55** | Session A asks to run `npm test`, and a **green** card appears. Keep typing in the editor, then press **⌥↵**. The notch says *Allowed ✓*, and the terminal (if visible) continues. | "Green means read-only, inside the repo. Option-Return. I never left my editor." |
| **0:55–1:25** | Send Session B's prompt. The **red** card appears: *Delete 14 files outside this repo*, glowing red with the reason chips. Point at **Deny ⌥↵** as the default. Press and briefly hold **Hold to allow**, then **let go** to show it springs back. Press **⌥↵**: *Denied ✕*. | "Red means stop. It says it in English, and it says why: outside the project, not in git. Deny is the default, and allowing takes a deliberate hold." |
| **1:25–1:45** | When `npm test` comes up again, click **Always allow `npm test`**. Trigger it once more (ask Session A to "run the tests again") and show it passing through on its own with the counter. | "For the boring stuff, one click makes a rule for this repo. Next time it just goes through, and Nod counts it." |
| **1:45–2:00** | Hands off the keyboard. | "Nod: approve your agents from the notch. And if Nod isn't running, Claude Code just asks you as usual. It never fails open to 'allow'." |

**If there's time for questions:** offer to show the risk read-out for an edit, which is amber and includes the real diff.

## Fallback ladder (use the first one that works)

1. **A request is slow to appear (>10 s).** Keep talking about Progress while it shows. If it still doesn't come, go to 2.
2. **Demo mode (no Claude Code, no network).** Menu bar → **Play demo** (or launch `build/Nod.app/Contents/MacOS/Nod --demo`). It replays the scripted story through the real UI: progress, a low-risk `npm test`, the edit with the diff, and the red `rm -rf`. Answer with ⌥↵ and the hold exactly as rehearsed. Say: *"Same app, same UI, scripted events, so the Wi-Fi can't ruin it."*
3. **Demo mode over the real HTTP path.** In a hidden terminal, run `scripts/simulate.sh story` (add `--session ci-cache` in a second tab for another avatar). This POSTs realistic hook payloads to Nod exactly like the hook does, and the permission steps block until you answer in the notch. It's useful if you want to say "this is the real bridge."
4. **Nod itself won't start or crashes.** Play the video `video/out/nod-demo.mp4` (93 s) full-screen and narrate over it, muting its audio if you prefer. Then show the code (`RiskEngine`, the hook script) for the remaining time.

## Reset between runs

- In each session, press `Esc` and `/clear`.
- Recreate the dummy files from step 4 if anything touched them.
- To clear the rules: menu bar → Quit, then delete `~/Library/Application Support/Nod/rules.json` and relaunch.
- After the event, run `scripts/uninstall-hooks.sh`, or restore the `settings.json.nod-backup-*` file.
