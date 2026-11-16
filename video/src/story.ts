/**
 * The demo's choreography, all anchored to VO line starts (see timeline.ts).
 * Frames are absolute (frame 0 = first frame of the video).
 */
import { Easing, interpolate } from "remotion";
import { IslandFx, IslandKey, ReqSpec } from "./components/Island";
import {
  CamKey,
  FILL,
  NOTCH,
  WIDE,
  CursorKey,
  KeyEvent,
  CaptionCue,
  CalloutCue,
} from "./components/Overlays";
import { TermState, termYesPoint, TYPED_LEN } from "./components/Desktop";
import { FPS, L, LINE_LIST, P, TOTAL, sec } from "./timeline";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/* ------------------------------------------------------------------ */
/* Requests (same copy as the prototype)                               */
/* ------------------------------------------------------------------ */

export const REQ_LOW: ReqSpec = {
  ring: 0,
  over: { 0: "need" },
  ask: "Run the auth test suite",
  risk: "low",
  body: {
    kind: "cmd",
    cmd: "npm test -- src/auth",
    why: "read-only · inside repo",
  },
  acts: "allow",
  always: "npm test",
  learned: { text: "Likely allow · 97%" },
};
const REQ_GIT: ReqSpec = {
  ring: 2,
  over: { 2: "need" },
  ask: "Show the last 5 commits",
  risk: "low",
  body: {
    kind: "cmd",
    cmd: "git log --oneline -5",
    why: "read-only · inside repo",
  },
  acts: "allow",
  always: "git log",
  learned: { text: "Likely allow · 94%" },
};
export const REQ_MED: ReqSpec = {
  ring: 0,
  over: { 0: "need" },
  ask: "Edit 2 files in src/auth",
  risk: "med",
  body: {
    kind: "diff",
    file: "session.ts",
    meta: "+12 −4 · and 1 more file",
    del: "-  if (!res.ok) throw new SessionError(res.status);",
    add: "+  if (res.status === 401) return refreshAndRetry(token);",
  },
  acts: "edit",
  learned: { text: "Likely allow · 91%" },
};
export const REQ_HIGH: ReqSpec = {
  ring: 1,
  over: { 1: "need" },
  ask: "Delete 14 files outside this repo",
  risk: "high",
  body: {
    kind: "cmd",
    cmd: "rm -rf ../design-assets/export/*",
    chips: [
      "Outside the project",
      "Not in git · can’t undo",
      "14 files · 38 MB",
    ],
  },
  acts: "high",
  learned: { text: "Likely deny · 95%" },
};
// a review-level request this user always denies: the learned chip disagrees with the pill
const REQ_DEPLOY: ReqSpec = {
  ring: 2,
  over: { 2: "need" },
  ask: "Deploy to staging",
  risk: "med",
  body: {
    kind: "cmd",
    cmd: "npm run deploy:staging",
    why: "network · outside repo",
  },
  acts: "allow",
  always: "npm run deploy",
  learned: { text: "Unusual for you · 95% deny", unusual: true },
};
const Q1: ReqSpec = {
  ring: 3,
  over: { 0: "need", 2: "need", 3: "need" },
  ask: "Fetch docs.example.com",
  risk: "med",
  body: {
    kind: "cmd",
    cmd: "curl -s https://docs.example.com/api",
    why: "network · read-only",
  },
  acts: "allow",
  always: "curl",
  learned: { text: "Likely allow · 72%" },
};
const Q2: ReqSpec = {
  ring: 2,
  over: { 0: "need", 2: "need" },
  ask: "Build the project",
  risk: "low",
  body: { kind: "cmd", cmd: "npm run build", why: "build · inside repo" },
  acts: "allow",
  always: "npm run build",
  learned: { text: "Likely allow · 96%" },
};
const Q3: ReqSpec = { ...REQ_LOW, over: { 0: "need" } };

// bottom centre of each card's learned chip, in screen points (measured from stills)
const CHIP_LOW = { x: 866, y: 108 };
const CHIP_DEPLOY = { x: 845, y: 108 };
const CARD_BOTTOM = 226; // just under an expanded request card

/* ------------------------------------------------------------------ */
/* Anchors                                                             */
/* ------------------------------------------------------------------ */

const T = {
  titleEnd: P("title").end,
  probIn: P("problem-in").from,
  p1: L("01a"),
  p2: L("01b"),
  p3: L("01c"),
  r1: L("02a"),
  r2: L("02b"),
  g1: L("03a"),
  g2: L("03b"),
  g3: L("03c"),
  gOut: P("progress-out"),
  a1: L("04a"),
  a2: L("04b"),
  a3: L("04c"),
  aOut: P("approve-out"),
  k1: L("05a"),
  k2: L("05b"),
  k3: L("05c"),
  kAllow: P("review-allow"),
  h1: L("06a"),
  h2: L("06b"),
  h3: L("06c"),
  hDeny: P("high-deny"),
  learn: {
    from: L("06d").from - sec(0.7),
    line: L("06d"),
    end: P("learn-deny").end,
  },
  m1: L("07a"),
  m2: L("07b"),
  mAuto: P("auto-allow"),
  c1: L("08a"),
};
export const ANCHORS = T;

/* ------------------------------------------------------------------ */
/* Problem: four terminals, prompts, window switching                  */
/* ------------------------------------------------------------------ */

// first prompt per terminal, seconds into line 01b ("...Can I run npm test? Can I edit this file?")
const FIRST_PROMPT = [2.2, 3.7, 0.45, 1.15].map((s) => T.p2.from + sec(s));
const VISIT_EVERY = 13;
const VISIT_ORDER = [0, 1, 2, 3, 0, 2, 1, 3];
export const VISITS = VISIT_ORDER.map((term, j) => ({
  term,
  at: T.p3.from - 4 + j * VISIT_EVERY,
}));
const ANSWER_DELAY = 7;
const REASK_DELAY = 24;
const MINIMIZE_AT = T.r1.from - 16;

type PromptSpan = { perm: number; from: number; to: number };
const PROMPTS: PromptSpan[][] = [0, 1, 2, 3].map((i) => {
  const visits = VISITS.filter((v) => v.term === i).map(
    (v) => v.at + ANSWER_DELAY,
  );
  const spans: PromptSpan[] = [];
  let from = FIRST_PROMPT[i];
  visits.forEach((answeredAt, n) => {
    spans.push({ perm: n % 2, from, to: answeredAt });
    from = answeredAt + REASK_DELAY;
  });
  spans.push({ perm: visits.length % 2, from, to: Infinity });
  return spans;
});

export function termState(i: number, f: number): TermState {
  const appear = Easing.out(Easing.cubic)(
    interpolate(f, [T.probIn - 8 + i * 4, T.probIn + 6 + i * 4], [0, 1], clamp),
  );
  const span = PROMPTS[i].find((s) => f >= s.from && f < s.to);
  const permIn = span
    ? Easing.out(Easing.back(1.4))(
        interpolate(f, [span.from, span.from + 8], [0, 1], clamp),
      )
    : 0;
  const answerFlash =
    span && span.to !== Infinity
      ? interpolate(f, [span.to - 5, span.to - 1], [0, 1], clamp)
      : 0;
  // focus: highlighted while being visited
  let focus = 0;
  let anyFocus = 0;
  for (const v of VISITS) {
    const w = interpolate(
      f,
      [v.at - 2, v.at + 2, v.at + VISIT_EVERY - 2, v.at + VISIT_EVERY + 1],
      [0, 1, 1, 0],
      clamp,
    );
    anyFocus = Math.max(anyFocus, w);
    if (v.term === i) focus = Math.max(focus, w);
  }
  const minimize = Easing.in(Easing.cubic)(
    interpolate(
      f,
      [MINIMIZE_AT + i * 2, MINIMIZE_AT + 14 + i * 2],
      [0, 1],
      clamp,
    ),
  );
  return {
    appear,
    perm: span ? span.perm : null,
    permIn,
    answering: answerFlash,
    focus,
    dim: Math.max(0, anyFocus - focus),
    minimize,
    tSec: f / FPS,
  };
}

export function switchCount(f: number) {
  const n = VISITS.filter((v) => f >= v.at).length;
  return 46 + n;
}
export const COUNTER_SPAN = { from: T.p3.from - 6, to: MINIMIZE_AT };

/* ------------------------------------------------------------------ */
/* Island                                                              */
/* ------------------------------------------------------------------ */

const PROG_OPEN = T.g1.from + 16 + 4; // cursor arrives + 120 ms hover delay
const AVATAR_CLICK = T.g3.from + 24;
const PROG_LEAVE = T.gOut.from - 4;
const PROG_CLOSE = PROG_LEAVE + 14 + 7; // cursor leaves + 220 ms

const APPROVE_PRESS = T.a2.from + 14;
const PRE_MED_PRESS = T.k3.from - 18;
const MED_PRESS = T.kAllow.from + 8;
const HIGH_HOLD_DOWN = T.h3.from + 50;
const HIGH_HOLD_LEN = 17; // released at ~60% of the 0.9 s hold
const DENY_PRESS = T.hDeny.from + 10;
const LEARN_DENY = P("learn-deny").from + 6;
const Q1_PRESS = T.m1.from + 30;
const QUEUE_TOAST = 22; // "Allowed" stays up long enough to read before the next request opens
const Q2_AT = Q1_PRESS + 4 + QUEUE_TOAST;
const Q2_PRESS = Q2_AT + 24;
const Q3_AT = Q2_PRESS + 4 + QUEUE_TOAST;
const ALWAYS_CLICK = T.m2.from + 18;
const AUTO_AT = T.m2.from + sec(2.5);
const DONE_AT = T.mAuto.from + 18;

export const ISLAND: IslandKey[] = [
  { at: 0, view: { k: "idle" } },
  // reveal
  { at: T.r1.from - 2, view: { k: "working" } },
  // progress
  { at: PROG_OPEN, view: { k: "progress", s: 0 } },
  { at: AVATAR_CLICK + 3, view: { k: "progress", s: 1 } },
  { at: PROG_CLOSE, view: { k: "working" } },
  // approve
  { at: T.a1.from, view: { k: "attention" } },
  { at: T.a1.from + 26, view: { k: "req", r: REQ_LOW } },
  { at: APPROVE_PRESS + 4, view: { k: "toast", v: "allowed" } },
  { at: APPROVE_PRESS + 4 + 33, view: { k: "working" } },
  // risk: green, then amber
  { at: T.k1.from, view: { k: "req", r: REQ_GIT } },
  { at: PRE_MED_PRESS + 4, view: { k: "toast", v: "allowed" } },
  { at: T.k3.from, view: { k: "req", r: REQ_MED } },
  { at: MED_PRESS + 4, view: { k: "toast", v: "allowed" } },
  { at: MED_PRESS + 4 + 24, view: { k: "working" } },
  // high risk
  { at: T.h1.from, view: { k: "req", r: REQ_HIGH } },
  { at: DENY_PRESS + 4, view: { k: "toast", v: "denied" } },
  { at: DENY_PRESS + 4 + 39, view: { k: "working" } },
  // learned approvals: a habit that disagrees with the risk read-out
  { at: T.learn.from, view: { k: "req", r: REQ_DEPLOY } },
  { at: LEARN_DENY + 4, view: { k: "toast", v: "denied" } },
  { at: LEARN_DENY + 4 + 30, view: { k: "working" } },
  // many agents: a queue, then a rule
  { at: T.m1.from, view: { k: "req", r: Q1 } },
  { at: Q1_PRESS + 4, view: { k: "toast", v: "allowed" } },
  { at: Q2_AT, view: { k: "req", r: Q2 } },
  { at: Q2_PRESS + 4, view: { k: "toast", v: "allowed" } },
  { at: Q3_AT, view: { k: "req", r: Q3 } },
  { at: ALWAYS_CLICK + 4, view: { k: "toast", v: "rule", code: "npm test" } },
  { at: ALWAYS_CLICK + 4 + 36, view: { k: "working" } },
  { at: AUTO_AT, view: { k: "toast", v: "auto", code: "npm test" } },
  { at: AUTO_AT + 42, view: { k: "working" } },
  { at: DONE_AT, view: { k: "toast", v: "done" } },
];

const pulse = (f: number, at: number, len = 30) =>
  interpolate(f, [at, at + len * 0.35, at + len], [0, 1, 0], {
    ...clamp,
    easing: Easing.inOut(Easing.sin),
  });

export function islandFx(f: number): IslandFx {
  const fx: IslandFx = {};
  // button presses (Option-Return lands on the default button)
  const pressWin = (at: number) => f >= at && f < at + 5;
  if (
    pressWin(APPROVE_PRESS) ||
    pressWin(PRE_MED_PRESS) ||
    pressWin(MED_PRESS) ||
    pressWin(Q1_PRESS) ||
    pressWin(Q2_PRESS)
  )
    fx.press = "allow";
  if (pressWin(DENY_PRESS) || pressWin(LEARN_DENY)) fx.press = "deny";
  if (f >= AVATAR_CLICK && f < AVATAR_CLICK + 4) {
    fx.press = "avatar";
    fx.pressAvatar = 1;
  }
  if (f >= ALWAYS_CLICK - 6 && f < ALWAYS_CLICK + 4) fx.hoverBtn = "always";
  if (f >= ALWAYS_CLICK && f < ALWAYS_CLICK + 4) fx.press = "always";
  // hold to allow: fills over 0.9 s while held, springs back on release
  const held = f - HIGH_HOLD_DOWN;
  if (f >= T.h3.from + 40 && f < HIGH_HOLD_DOWN + HIGH_HOLD_LEN + 10)
    fx.hoverBtn = "hold";
  if (held >= 0 && held < HIGH_HOLD_LEN) {
    fx.press = "hold";
    fx.holdFill = Math.min(1, held / (0.9 * FPS));
  } else if (held >= HIGH_HOLD_LEN) {
    const peak = HIGH_HOLD_LEN / (0.9 * FPS);
    const back = Easing.bezier(
      0.2,
      0.9,
      0.25,
      1,
    )(Math.min(1, (held - HIGH_HOLD_LEN) / (0.35 * FPS)));
    fx.holdFill = peak * (1 - back);
  }
  // emphasis that follows the narration
  fx.pillPop = Math.max(
    pulse(f, T.k2.from + 2, 34),
    pulse(f, T.h1.from + 12, 34),
  );
  // the learned chip pops just after the first card opens, and again on the unusual one
  fx.learnPop = Math.max(
    pulse(f, T.a1.from + 46, 34),
    pulse(f, T.learn.from + 24, 34),
  );
  fx.chipPop = [0, 1, 2].map((i) => pulse(f, T.h2.from + sec(2.3) + i * 8, 28));
  fx.diffPop = pulse(f, T.k3.from + sec(1.4), 40);
  return fx;
}

/* ------------------------------------------------------------------ */
/* Keycaps                                                             */
/* ------------------------------------------------------------------ */

const keyEv = (
  press: number,
  tint: "orange" | "red" = "orange",
  lead = 14,
  tail = 16,
  keys: KeyEvent["keys"] = ["opt", "ret"],
): KeyEvent => ({
  show: press - lead,
  press,
  hide: press + tail,
  keys,
  tint,
});
export const KEYS: KeyEvent[] = [
  keyEv(APPROVE_PRESS, "orange", 18, 24),
  keyEv(PRE_MED_PRESS, "orange", 12, 12),
  keyEv(MED_PRESS, "orange", 12, 14),
  keyEv(DENY_PRESS, "red", 16, 22),
  keyEv(LEARN_DENY, "red", 16, 18, ["opt", "del"]),
  keyEv(Q1_PRESS, "orange", 12, 12),
  keyEv(Q2_PRESS, "orange", 12, 12),
];

/* ------------------------------------------------------------------ */
/* Cursor                                                              */
/* ------------------------------------------------------------------ */

const yes = (i: number) => termYesPoint(i);
const problemPath: CursorKey[] = VISITS.map((v) => ({
  at: v.at - 8,
  dur: 8,
  x: yes(v.term).x,
  y: yes(v.term).y,
}));

export const CURSOR_PATH: CursorKey[] = [
  { at: 0, dur: 1, x: 900, y: 600 },
  { at: T.p3.from - 20, dur: 10, x: yes(0).x - 60, y: yes(0).y + 40 },
  ...problemPath,
  // progress: up to the notch, then the second avatar, then away
  { at: T.g1.from - 12, dur: 1, x: 1060, y: 340 },
  { at: T.g1.from, dur: 16, x: 792, y: 18 },
  { at: T.g3.from + 6, dur: 14, x: 869, y: 59 },
  { at: PROG_LEAVE, dur: 14, x: 1010, y: 400 },
  // high risk: press and hold, then let go
  { at: T.h3.from + 18, dur: 1, x: 700, y: 360 },
  { at: T.h3.from + 26, dur: 16, x: 603, y: 214 },
  { at: HIGH_HOLD_DOWN + HIGH_HOLD_LEN + 8, dur: 14, x: 690, y: 380 },
  // many: "Always allow npm test"
  { at: T.m2.from - 14, dur: 1, x: 930, y: 360 },
  { at: T.m2.from - 4, dur: 14, x: 756, y: 186 },
  { at: ALWAYS_CLICK + 14, dur: 14, x: 900, y: 380 },
];
export const CURSOR_SHOWS = [
  { from: T.p3.from - 22, to: MINIMIZE_AT },
  { from: T.g1.from - 12, to: PROG_LEAVE + 16 },
  { from: T.h3.from + 18, to: HIGH_HOLD_DOWN + HIGH_HOLD_LEN + 22 },
  { from: T.m2.from - 14, to: ALWAYS_CLICK + 28 },
];
export const CURSOR_CLICKS = [
  ...VISITS.map((v) => ({ at: v.at + 2, len: 3 })),
  { at: AVATAR_CLICK, len: 4 },
  { at: HIGH_HOLD_DOWN, len: HIGH_HOLD_LEN },
  { at: ALWAYS_CLICK, len: 4 },
];

/* ------------------------------------------------------------------ */
/* Camera                                                              */
/* ------------------------------------------------------------------ */

export const CAMERA: CamKey[] = [
  { at: 0, dur: 1, cam: FILL },
  { at: T.p2.from, dur: T.r1.from - T.p2.from - 20, cam: { ...FILL, s: 1.34 } },
  { at: T.r1.from - 6, dur: 40, cam: NOTCH(2.0) },
  { at: T.g1.from, dur: 30, cam: NOTCH(2.06) },
  { at: T.a1.from - 10, dur: 24, cam: NOTCH(2.0) },
  { at: T.a3.from - 8, dur: 26, cam: FILL },
  { at: T.k1.from - 16, dur: 24, cam: NOTCH(2.0) },
  { at: T.h1.from, dur: T.h3.end - T.h1.from, cam: NOTCH(2.12) },
  { at: T.hDeny.from + 20, dur: 24, cam: NOTCH(1.95) },
  // lean in on the learned chip, then back out for the queue
  { at: T.learn.from + 4, dur: 30, cam: NOTCH(2.6) },
  { at: LEARN_DENY + 8, dur: 24, cam: NOTCH(1.95) },
  // lean in on the compact notch for "rule saved" and "auto-allowed"
  { at: ALWAYS_CLICK + 8, dur: 22, cam: NOTCH(2.8) },
  { at: T.mAuto.from + 6, dur: 54, cam: WIDE },
];

/* ------------------------------------------------------------------ */
/* Editor typing (the user keeps working while agents ask)            */
/* ------------------------------------------------------------------ */

const TYPE_START = T.a1.from + 6;
export function typedAt(f: number) {
  return Math.max(
    0,
    Math.min(TYPED_LEN, Math.floor(((f - TYPE_START) * 15) / FPS)),
  );
}
export function caretOn(f: number) {
  if (f < TYPE_START) return false;
  const typing = typedAt(f) < TYPED_LEN;
  return typing || Math.floor(f / 16) % 2 === 0;
}

/* ------------------------------------------------------------------ */
/* Captions, reveal glow, cards                                        */
/* ------------------------------------------------------------------ */

const ACCENT: Record<string, string> = {
  "05b-risk": "#30D158",
  "05c-risk": "#FFB340",
  "06a-high": "#FF453A",
};

const VO_CAPTIONS: CaptionCue[] = LINE_LIST.filter((l) => l.caption).map(
  (l, i, arr) => {
    const next = arr[i + 1];
    const to = Math.min(l.end + 30, next ? next.from : TOTAL);
    return { from: l.from, to, text: l.caption, accent: ACCENT[l.id] };
  },
);
// 06d's caption comes in two parts, split near "and flags"
const LEARN_SPLIT = T.learn.line.from + Math.round(T.learn.line.dur * 0.55);
export const CAPTIONS: CaptionCue[] = [
  ...VO_CAPTIONS,
  { from: T.learn.from + 6, to: LEARN_SPLIT, text: "It learns how you decide" },
  {
    from: LEARN_SPLIT,
    to: T.learn.end + 6,
    text: "and flags what’s unusual for you",
    accent: "#FFB340",
  },
].sort((a, b) => a.from - b.from);

/** Labels that point at the learned chip (screen coordinates for the anchor). */
export const CALLOUTS: CalloutCue[] = [
  {
    from: T.a1.from + 50,
    to: APPROVE_PRESS + 2,
    anchor: CHIP_LOW,
    below: CARD_BOTTOM,
    title: "On-device machine learning",
    sub: "Predicts your answer from your past decisions",
  },
  {
    from: T.learn.from + 34,
    to: LEARN_DENY + 2,
    anchor: CHIP_DEPLOY,
    below: CARD_BOTTOM,
    title: "You deny deploys like this",
    sub: "Learned on your Mac · never leaves it",
    tone: "amber",
  },
];

export const REVEAL_GLOW = { at: T.r1.from - 2 };
export const TITLE_OUT = T.titleEnd;
export const END_IN = T.c1.from - 14;
export const DONE_FRAME = DONE_AT;

// Fail loudly if a timing edit puts keys out of order (e.g. after swapping in a longer VO line).
const assertSorted = (name: string, ats: number[]) => {
  for (let i = 1; i < ats.length; i++) {
    if (ats[i] < ats[i - 1])
      throw new Error(
        `${name} keys out of order at index ${i}: ${ats[i - 1]} > ${ats[i]}`,
      );
  }
};
assertSorted(
  "ISLAND",
  ISLAND.map((k) => k.at),
);
assertSorted(
  "CAMERA",
  CAMERA.map((k) => k.at),
);
assertSorted(
  "CURSOR_PATH",
  CURSOR_PATH.map((k) => k.at),
);
assertSorted(
  "KEYS",
  KEYS.map((k) => k.show),
);
