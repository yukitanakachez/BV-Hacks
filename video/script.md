# Nod demo video: narrated script

**Runtime:** 93 s · 1920×1080 · 30 fps · `out/nod-demo.mp4`
**Voice:** one narrator, warm and unhurried, conversational. Final read: ElevenLabs, voice "Brian" (eleven_v4), first take of each line; the original macOS `say` placeholder timing is superseded.
**Timestamps** come from the placeholder VO (`src/generated/vo-durations.json`). The whole video re-times itself when you swap in the final VO (see `README.md`), so treat these as targets, not hard cuts.

Each line is its own audio file, `public/vo/<id>.wav`. Keep the IDs.

---

## 0:00 – 0:03 · Title (no VO)

**On screen:** black. The pixel Claude Code mascot pops in, then **Nod** and the tagline *"Approve your agents from the notch."* A tiny notch at the top comes alive (mascot + wave).
**Music:** pad fades in.

## 0:03 – 0:16 · (a) The problem

| ID | Time | VO (spoken) | Caption |
|---|---|---|---|
| `01a-problem` | 0:03.3 | "Four Claude Code agents. Four terminals." | 4 agents. 4 terminals. |
| `01b-problem` | 0:06.3 | "And every one keeps stopping to ask. Can I run npm test? Can I edit this file?" | Each one stops to ask permission |
| `01c-problem` | 0:12.0 | "So you switch windows all day, just to say yes." | So you switch windows. All day. |

**On screen:** four Claude Code terminals tile the screen (token-refresh, hero-copy, ci-cache, api-docs). On 01b, permission boxes pop up one by one ("Bash command `npm test -- src/auth`", "Edit file `app/page.tsx`", …) and each window's border turns amber. On 01c, the cursor darts window to window answering "1. Yes" while the others dim. A **Window switches today** counter ticks up from 47 to 54. The camera slowly pushes in, so the moment feels claustrophobic.

## 0:16 – 0:20 · (b) Reveal: the notch comes alive

| ID | Time | VO | Caption |
|---|---|---|---|
| `02a-reveal` | 0:16.2 | "Meet Nod." | Meet Nod |
| `02b-reveal` | 0:17.2 | "It puts your agents in the MacBook notch." | Your agents, in the notch |

**On screen:** the terminals shrink away into the dock and the editor is back. On "Meet Nod," the black notch springs open into the **working** island (mascot on the left, orange wave on the right) with a soft orange bloom. The camera pushes in on the notch.

## 0:20 – 0:30 · (c) Glanceable progress on hover

| ID | Time | VO | Caption |
|---|---|---|---|
| `03a-progress` | 0:20.1 | "Hover, and you see what each agent is doing." | Hover for progress |
| `03b-progress` | 0:22.8 | "Its task, the steps it's done, and the tool running right now." | Task · steps · the live tool |
| `03c-progress` | 0:26.8 | "Click an avatar to check on another session." | One avatar per session |

**On screen:** the cursor slides up to the notch. After a 120 ms hover delay, the island springs open into **Progress**: four session avatars with status dots, **Claude ● add token refresh to auth**, the checklist rising in step by step, the current step sliding under the liquid-glass edge, and the tool card's seconds counter running live. On 03c the cursor clicks the second avatar and the panel swaps to *rewrite the hero copy for launch*. The cursor leaves and the island closes, critically damped.

## 0:30 – 0:37 · (d) Approve with ⌥↵ without leaving the editor

| ID | Time | VO | Caption |
|---|---|---|---|
| `04a-approve` | 0:30.1 | "When an agent needs you, the notch asks." | When an agent needs you, it asks |
| `04b-approve` | 0:33.1 | "Option-Return approves it." | ⌥ ↵ to approve |
| `04c-approve` | 0:35.2 | "You never leave your editor." | You never leave your editor |

**On screen:** the island pulses amber (attention), then opens a **low-risk** card: *Run the auth test suite*, `$ npm test -- src/auth`, *read-only · inside repo*. Big **⌥ option + ↵ return** keycaps rise in and press down; the Allow button depresses and the island tucks into **Allowed ✓**. On 04c the camera pulls back to show the editor, where the user has been typing `export const SESSION_TTL = 15 * 60;` the whole time.

## 0:37 – 0:48 · (e1) The risk read-out: green, then amber

| ID | Time | VO | Caption |
|---|---|---|---|
| `05a-risk` | 0:37.7 | "Every request gets a plain-English risk read-out." | A plain-English risk read-out |
| `05b-risk` | 0:40.6 | "Green is read-only, inside the repo." | ● Green: read-only, inside the repo |
| `05c-risk` | 0:43.9 | "Amber is a code edit, and you see the real diff." | ● Amber: a code edit, with the diff |

**On screen:** *Show the last 5 commits* (`git log --oneline -5`) with the green **Low risk** pill, which pulses on "Green." A quick ⌥↵, then *Edit 2 files in src/auth* opens with the amber **Review** pill, a soft amber glow fading out under the glass edge, and the real diff (`- if (!res.ok) throw …` / `+ if (res.status === 401) return refreshAndRetry(token);`). The diff card gets an amber ring as the narrator says "diff." ⌥↵ allows it.

## 0:48 – 0:59 · (e2) High risk: red glow, Deny by default, hold to allow

| ID | Time | VO | Caption |
|---|---|---|---|
| `06a-high` | 0:48.6 | "Red means stop." | ● Red means stop |
| `06b-high` | 0:49.9 | "Delete fourteen files outside this repo? It tells you why." | It tells you why |
| `06c-high` | 0:53.8 | "Deny is the default. Allowing takes a deliberate hold." | Deny by default. Hold to allow. |

**On screen:** **Delete 14 files outside this repo**, `$ rm -rf ../design-assets/export/*`, the red **High risk** pill, and a red glow bleeding out from under the island with no outline. On "why," the chips pop in turn: *Outside the project · Not in git · can't undo · 14 files · 38 MB*. The big red **Deny ⌥↵** button is the default. On "deliberate hold," the cursor presses **Hold to allow**: the red fill creeps across, the user lets go at about 60%, and it springs back. Then ⌥↵ (red-tinted keycaps) and the island answers **Denied ✕**.

## 0:59 – 1:07 · (e3) Learned approvals

| ID | Time | VO | Caption |
|---|---|---|---|
| `06d-learn` | 1:00.0 | "Nod learns how you decide, on your Mac, and flags anything unusual for you." | It learns how you decide → ● and flags what's unusual for you |

**On screen:** the CI session asks to **Deploy to staging** (`npm run deploy:staging`) with the amber **Review** pill. Next to it, the learned chip reads **Unusual for you · 95% deny** in amber and pops as the camera leans in. A callout hangs from the chip: **You deny deploys like this** / *Learned on your Mac · never leaves it*. Then ⌥⌫ (red-tinted keycaps) and the island answers **Denied ✕**. The caption switches halfway through the line, near "and flags". This line was generated with `scripts/eleven-vo.sh` (ElevenLabs, Brian, `eleven_v4`).

Earlier, on the very first card (*Run the auth test suite*, 0:31), the grey chip **Likely allow · 97%** pops and a callout reads **On-device machine learning** / *Predicts your answer from your past decisions*. Every request card in the video carries a chip.

## 1:07 – 1:19 · (f) Many agents at once, plus rules

| ID | Time | VO | Caption |
|---|---|---|---|
| `07a-many` | 1:07.5 | "Run as many agents as you like. Requests queue up, one keystroke each." | Many agents. One queue. |
| `07b-many` | 1:12.3 | "Always allow npm test here, and next time it just goes through." | Always allow npm test here |

**On screen:** three avatars show amber "needs you" dots. The queue drains one ⌥↵ at a time: *Fetch docs.example.com* (Review), then *Build the project* (Low), then *Run the auth test suite*, with the dots clearing as it goes. On 07b the cursor clicks **Always allow `npm test`**. The camera leans in on the notch: **Always allow `npm test` ✓**. A few seconds later the next `npm test` passes straight through as **Auto-allowed `npm test` ✓**, with no card and no keystroke.

## 1:19 – 1:24 · (g) Close

| ID | Time | VO | Caption |
|---|---|---|---|
| `08a-close` | 1:19.3 | "Nod. Approve your agents from the notch." | none (end card) |

**On screen:** the island shows **Done ✓** as the camera pulls back to the whole MacBook screen, then a cross-fade to the end card: the mascot, **Nod**, *"Approve your agents from the notch."*, and *For Claude Code · macOS 26 · Built at BV Hacks 2026*. The music fades out.

---

## Notes for the final (ElevenLabs) read

- Say **"N-P-M test"** letter by letter, and **"Option-Return"** as two words.
- 01b has two beats: a pause after "ask," then the two questions slightly faster, a little exasperated.
- 02a "Meet Nod." is short and warm. Leave a breath after it.
- 06a "Red means stop." is flat and firm, the only stern line.
- 08a: a beat after "Nod.", then the tagline.
- Aim for each line within ±20% of the placeholder length so the visual beats still land. The timeline stretches to fit, but the on-screen moments are anchored to line starts.
