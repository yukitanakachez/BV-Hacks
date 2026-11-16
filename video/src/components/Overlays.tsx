import React from "react";
import { Easing, interpolate, spring } from "remotion";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const inOut = Easing.bezier(0.65, 0, 0.35, 1);

/* ------------------------------------------------------------------ */
/* Camera: scales the 1512pt screen into the 1920x1080 frame           */
/* ------------------------------------------------------------------ */

export type Cam = {
  s: number;
  fx: number;
  fy: number;
  px: number;
  py: number;
  bezel: number;
};
export type CamKey = { at: number; dur: number; cam: Cam };

export const FILL: Cam = {
  s: 1920 / 1512,
  fx: 756,
  fy: 0,
  px: 960,
  py: 0,
  bezel: 0,
};
export const WIDE: Cam = {
  s: 1.0,
  fx: 756,
  fy: 425.5,
  px: 960,
  py: 540,
  bezel: 1,
};
export const NOTCH = (s: number, py = 0): Cam => ({
  s,
  fx: 756,
  fy: 0,
  px: 960,
  py,
  bezel: 0,
});

export function camAt(keys: CamKey[], f: number): Cam {
  let cur = keys[0].cam;
  for (let i = 1; i < keys.length; i++) {
    const k = keys[i];
    if (f < k.at) break;
    const p = inOut(Math.min(1, (f - k.at) / Math.max(1, k.dur)));
    const a = cur;
    const b = k.cam;
    cur = {
      // interpolate scale perceptually so zooms feel even
      s: Math.exp(Math.log(a.s) + (Math.log(b.s) - Math.log(a.s)) * p),
      fx: a.fx + (b.fx - a.fx) * p,
      fy: a.fy + (b.fy - a.fy) * p,
      px: a.px + (b.px - a.px) * p,
      py: a.py + (b.py - a.py) * p,
      bezel: a.bezel + (b.bezel - a.bezel) * p,
    };
  }
  return cur;
}

export const camTransform = (c: Cam) =>
  `translate(${c.px - c.fx * c.s}px, ${c.py - c.fy * c.s}px) scale(${c.s})`;

/* ------------------------------------------------------------------ */
/* Cursor (screen coordinates, so it scales with the camera)           */
/* ------------------------------------------------------------------ */

export type CursorKey = { at: number; dur: number; x: number; y: number };
export type CursorState = { x: number; y: number; op: number; down: number };

export function cursorAt(
  path: CursorKey[],
  shows: { from: number; to: number }[],
  clicks: { at: number; len: number }[],
  f: number,
): CursorState {
  let x = path[0].x;
  let y = path[0].y;
  for (let i = 1; i < path.length; i++) {
    const k = path[i];
    if (f < k.at) break;
    const p = inOut(Math.min(1, (f - k.at) / Math.max(1, k.dur)));
    x = x + (k.x - x) * p;
    y = y + (k.y - y) * p;
  }
  let op = 0;
  for (const s of shows) {
    op = Math.max(
      op,
      interpolate(f, [s.from, s.from + 5, s.to - 5, s.to], [0, 1, 1, 0], clamp),
    );
  }
  let down = 0;
  for (const c of clicks) {
    down = Math.max(
      down,
      interpolate(
        f,
        [c.at, c.at + 2, c.at + c.len, c.at + c.len + 3],
        [0, 1, 1, 0],
        clamp,
      ),
    );
  }
  return { x, y, op, down };
}

export const Cursor: React.FC<{ st: CursorState }> = ({ st }) =>
  st.op <= 0 ? null : (
    <svg
      width={22}
      height={30}
      viewBox="0 0 22 30"
      style={{
        position: "absolute",
        left: st.x - 2,
        top: st.y - 2,
        zIndex: 50,
        opacity: st.op,
        transform: `scale(${1 - 0.12 * st.down})`,
        transformOrigin: "2px 2px",
        filter: "drop-shadow(0 2px 3px rgba(0,0,0,.45))",
      }}
    >
      <path
        d="M2 2 L2 23 L7.2 18.2 L10.6 26.4 L14 25 L10.7 17 L17.6 17 Z"
        fill="#000"
        stroke="#fff"
        strokeWidth={1.6}
        strokeLinejoin="round"
      />
    </svg>
  );

/* ------------------------------------------------------------------ */
/* Keycap overlay (frame coordinates)                                  */
/* ------------------------------------------------------------------ */

export type KeyEvent = {
  show: number;
  press: number;
  hide: number;
  keys: ("opt" | "ret" | "del")[];
  tint?: "orange" | "red";
};

const KEY_LABEL = {
  opt: { glyph: "⌥", name: "option", w: 168 },
  ret: { glyph: "↵", name: "return", w: 250 },
  del: { glyph: "⌫", name: "delete", w: 210 },
} as const;

const Keycap: React.FC<{
  k: "opt" | "ret" | "del";
  down: number;
  tint: string;
}> = ({ k, down, tint }) => {
  const L = KEY_LABEL[k];
  return (
    <div
      style={{
        width: L.w,
        height: 150,
        borderRadius: 26,
        position: "relative",
        background: `linear-gradient(180deg, ${down > 0.5 ? "#45454b" : "#3b3b40"} 0%, #2b2b2f 100%)`,
        boxShadow: `inset 0 1.5px 0 rgba(255,255,255,.16), inset 0 0 0 1px rgba(255,255,255,.06), 0 ${10 - 7 * down}px 0 #141416, 0 ${22 - 10 * down}px 36px rgba(0,0,0,.55), 0 0 ${60 * down}px ${10 * down}px ${tint}`,
        transform: `translateY(${7 * down}px)`,
        color: "#f5f5f7",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      <div
        style={{
          position: "absolute",
          right: 22,
          top: 16,
          fontSize: 52,
          fontWeight: 500,
          lineHeight: 1,
        }}
      >
        {L.glyph}
      </div>
      <div
        style={{
          position: "absolute",
          left: 22,
          bottom: 18,
          fontSize: 26,
          fontWeight: 500,
          opacity: 0.85,
        }}
      >
        {L.name}
      </div>
    </div>
  );
};

export const Keycaps: React.FC<{
  events: KeyEvent[];
  frame: number;
  fps: number;
  y?: number;
}> = ({ events, frame, fps, y = 640 }) => {
  const ev = events.find((e) => frame >= e.show && frame < e.hide + 10);
  if (!ev) return null;
  const inP = spring({
    frame: frame - ev.show,
    fps,
    config: { damping: 14, stiffness: 180, mass: 0.8 },
  });
  const outP = interpolate(frame, [ev.hide, ev.hide + 8], [0, 1], clamp);
  const down = interpolate(
    frame,
    [ev.press - 2, ev.press, ev.press + 7, ev.press + 11],
    [0, 1, 1, 0],
    clamp,
  );
  const tint =
    ev.tint === "red"
      ? `rgba(255,69,58,${0.55 * down})`
      : `rgba(217,119,87,${0.6 * down})`;
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: y,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        gap: 22,
        opacity: inP * (1 - outP),
        transform: `translateY(${(1 - inP) * 40 + outP * 20}px) scale(${0.9 + 0.1 * inP})`,
        zIndex: 60,
      }}
    >
      {ev.keys.map((k, i) => (
        <React.Fragment key={k}>
          {i > 0 ? (
            <div
              style={{
                color: "rgba(255,255,255,.7)",
                fontSize: 54,
                fontWeight: 300,
                fontFamily: "system-ui",
              }}
            >
              +
            </div>
          ) : null}
          <Keycap k={k} down={down} tint={tint} />
        </React.Fragment>
      ))}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Callout: a label under a point on screen, joined by a leader line   */
/* ------------------------------------------------------------------ */

export type CalloutCue = {
  from: number;
  to: number;
  anchor: { x: number; y: number }; // screen points
  below: number; // screen y the label hangs from (under the card)
  title: string;
  sub: string;
  tone?: "amber";
};

export const Callout: React.FC<{
  cues: CalloutCue[];
  cam: Cam;
  frame: number;
  fps: number;
}> = ({ cues, cam, frame, fps }) => {
  const cue = cues.find((c) => frame >= c.from && frame < c.to + 8);
  if (!cue) return null;
  const pin = spring({
    frame: frame - cue.from,
    fps,
    config: { damping: 15, stiffness: 190, mass: 0.7 },
  });
  const pout = interpolate(frame, [cue.to, cue.to + 8], [0, 1], clamp);
  const op = pin * (1 - pout);
  // the anchor follows the camera
  const ax = cam.px + (cue.anchor.x - cam.fx) * cam.s;
  const ay = cam.py + (cue.anchor.y - cam.fy) * cam.s;
  const boxTop = cam.py + (cue.below - cam.fy) * cam.s;
  const lead = Math.max(0, boxTop - ay - 14) * pin;
  const color = cue.tone === "amber" ? "#FFB340" : "#E8916E";
  const W = 760;
  const left = Math.max(40, Math.min(1920 - 40 - W, ax - W / 2));
  return (
    <div style={{ position: "absolute", inset: 0, opacity: op, zIndex: 66 }}>
      <div
        style={{
          position: "absolute",
          left: ax - 7,
          top: ay + 2,
          width: 14,
          height: 14,
          borderRadius: 7,
          background: color,
          boxShadow: `0 0 18px ${color}`,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: ax - 1.5,
          top: ay + 14,
          width: 3,
          height: lead,
          background: `linear-gradient(${color}, rgba(255,255,255,.25))`,
          borderRadius: 2,
        }}
      />
      <div
        style={{
          position: "absolute",
          left,
          top: ay + 14 + lead,
          width: W,
          padding: "20px 30px 22px",
          borderRadius: 26,
          background: "rgba(12,12,16,.78)",
          backdropFilter: "blur(22px) saturate(1.4)",
          WebkitBackdropFilter: "blur(22px) saturate(1.4)",
          boxShadow: `inset 0 1px 0 rgba(255,255,255,.14), inset 0 0 0 1.5px ${color}55, 0 24px 50px -18px rgba(0,0,0,.85)`,
          fontFamily: '"SF Pro Display", system-ui, -apple-system, sans-serif',
          color: "#fff",
          textAlign: "center",
          transform: `translateY(${(1 - pin) * 18}px) scale(${0.95 + 0.05 * pin})`,
        }}
      >
        <div
          style={{
            fontSize: 40,
            fontWeight: 800,
            letterSpacing: "-0.02em",
            color,
          }}
        >
          {cue.title}
        </div>
        <div
          style={{
            marginTop: 6,
            fontSize: 28,
            fontWeight: 600,
            color: "rgba(255,255,255,.72)",
          }}
        >
          {cue.sub}
        </div>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Captions (bold, bottom centre)                                      */
/* ------------------------------------------------------------------ */

const InlineKey: React.FC<{ g: string }> = ({ g }) => (
  <span
    style={{
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      minWidth: 64,
      height: 64,
      padding: "0 12px",
      margin: "0 4px",
      borderRadius: 14,
      background: "linear-gradient(180deg, #47474d, #2c2c30)",
      boxShadow: "inset 0 1px 0 rgba(255,255,255,.2), 0 4px 0 #151517",
      fontSize: 42,
      fontWeight: 600,
      verticalAlign: 6,
      lineHeight: 1,
    }}
  >
    {g}
  </span>
);

const renderCaption = (text: string) =>
  text.split(/(\{opt\}|\{ret\}|npm test|notchAgent)/).map((part, i) => {
    if (part === "{opt}") return <InlineKey key={i} g="⌥" />;
    if (part === "{ret}") return <InlineKey key={i} g="↵" />;
    if (part === "notchAgent") return <Wordmark key={i} />;
    if (part === "npm test")
      return (
        <span key={i} style={{ color: "#E8916E" }}>
          npm test
        </span>
      );
    return <React.Fragment key={i}>{part}</React.Fragment>;
  });

/** The product name: "notch" in the accent, "Agent" in the surrounding colour. */
export const Wordmark: React.FC = () => (
  <span>
    <span style={{ color: "#E8916E" }}>notch</span>Agent
  </span>
);

export type CaptionCue = {
  from: number;
  to: number;
  text: string;
  accent?: string;
};

export const Captions: React.FC<{
  cues: CaptionCue[];
  frame: number;
  fps: number;
}> = ({ cues, frame, fps }) => {
  const cue = cues.find((c) => frame >= c.from && frame < c.to);
  if (!cue || !cue.text) return null;
  const pin = spring({
    frame: frame - cue.from,
    fps,
    config: { damping: 16, stiffness: 210, mass: 0.7 },
  });
  const pout = interpolate(frame, [cue.to - 6, cue.to], [0, 1], clamp);
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 64,
        display: "flex",
        justifyContent: "center",
        zIndex: 70,
      }}
    >
      <div
        style={{
          maxWidth: 1600,
          padding: "20px 44px 22px",
          borderRadius: 30,
          background: "rgba(12,12,16,.66)",
          backdropFilter: "blur(24px) saturate(1.4)",
          WebkitBackdropFilter: "blur(24px) saturate(1.4)",
          boxShadow:
            "inset 0 1px 0 rgba(255,255,255,.14), inset 0 0 0 1px rgba(255,255,255,.06), 0 20px 50px -20px rgba(0,0,0,.8)",
          color: "#fff",
          fontFamily: '"SF Pro Display", system-ui, -apple-system, sans-serif',
          fontWeight: 800,
          fontSize: 66,
          lineHeight: 1.12,
          letterSpacing: "-0.025em",
          textAlign: "center",
          opacity: pin * (1 - pout),
          transform: `translateY(${(1 - pin) * 26}px) scale(${0.96 + 0.04 * pin})`,
          whiteSpace: "nowrap",
        }}
      >
        {cue.accent ? <span style={{ color: cue.accent }}>● </span> : null}
        {renderCaption(cue.text)}
      </div>
    </div>
  );
};
