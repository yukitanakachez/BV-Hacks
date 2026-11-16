/**
 * Builds the whole video's timing from the measured voiceover.
 *
 * Every VO line is placed after the previous one plus a gap, and named pauses
 * give the visuals room to land (a toast, a keypress). Change a VO file, run
 * `npm run vo:measure`, and every scene re-times itself.
 */
import durations from "./generated/vo-durations.json";
import voLines from "./data/vo-lines.json";

export const FPS = 30;
export const WIDTH = 1920;
export const HEIGHT = 1080;

export const sec = (s: number) => Math.round(s * FPS);

type Step = { line: string; gap?: number } | { pause: string; sec: number };

// gap = seconds of silence before the line starts
const LAYOUT: Step[] = [
  { pause: "title", sec: 2.7 },
  { pause: "problem-in", sec: 0.6 },
  { line: "01a-problem", gap: 0 },
  { line: "01b-problem", gap: 0.35 },
  { line: "01c-problem", gap: 0.35 },
  { pause: "switching", sec: 0.9 },
  { line: "02a-reveal", gap: 0.25 },
  { line: "02b-reveal", gap: 0.3 },
  { line: "03a-progress", gap: 0.7 },
  { line: "03b-progress", gap: 0.35 },
  { line: "03c-progress", gap: 0.35 },
  { pause: "progress-out", sec: 0.6 },
  { line: "04a-approve", gap: 0.4 },
  { line: "04b-approve", gap: 0.5 },
  { pause: "approve-toast", sec: 0.5 },
  { line: "04c-approve", gap: 0.2 },
  { pause: "approve-out", sec: 0.7 },
  { line: "05a-risk", gap: 0.4 },
  { line: "05b-risk", gap: 0.3 },
  { line: "05c-risk", gap: 1.0 },
  { pause: "review-allow", sec: 1.5 },
  { line: "06a-high", gap: 0.5 },
  { line: "06b-high", gap: 0.3 },
  { line: "06c-high", gap: 0.35 },
  { pause: "high-deny", sec: 2.4 },
  // learned approvals: the card opens in the gap, the deny lands in the pause
  { line: "06d-learn", gap: 0.9 },
  { pause: "learn-deny", sec: 1.7 },
  { line: "07a-many", gap: 0.4 },
  { line: "07b-many", gap: 0.5 },
  { pause: "auto-allow", sec: 2.4 },
  { line: "08a-close", gap: 0.5 },
  { pause: "end-hold", sec: 2.2 },
];

export type LineT = {
  id: string;
  from: number;
  dur: number;
  end: number;
  text: string;
  caption: string;
};

const D = durations as Record<string, number>;
const meta = new Map(voLines.lines.map((l) => [l.id, l]));

const lines: Record<string, LineT> = {};
const pauses: Record<string, { from: number; end: number }> = {};
let cursor = 0; // in frames
for (const step of LAYOUT) {
  if ("pause" in step) {
    const len = sec(step.sec);
    pauses[step.pause] = { from: cursor, end: cursor + len };
    cursor += len;
  } else {
    const d = D[step.line];
    if (d === undefined)
      throw new Error(`No measured duration for ${step.line}. Run npm run vo.`);
    cursor += sec(step.gap ?? 0.3);
    const dur = Math.ceil(d * FPS);
    const m = meta.get(step.line)!;
    lines[step.line] = {
      id: step.line,
      from: cursor,
      dur,
      end: cursor + dur,
      text: m.text,
      caption: m.caption,
    };
    cursor += dur;
  }
}

export const TOTAL = cursor;
export const LINES = lines;
export const PAUSES = pauses;
export const LINE_LIST = Object.values(lines);

/** Start / end frame of a VO line by id prefix, e.g. L('04b'). */
export const L = (prefix: string): LineT => {
  const hit = LINE_LIST.find((l) => l.id.startsWith(prefix));
  if (!hit) throw new Error(`Unknown line ${prefix}`);
  return hit;
};
export const P = (name: string) => {
  const p = pauses[name];
  if (!p) throw new Error(`Unknown pause ${name}`);
  return p;
};
