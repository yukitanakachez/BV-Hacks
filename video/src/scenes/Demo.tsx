import React from "react";
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import {
  EditorWindow,
  MenuBar,
  Sidebar,
  Terminal,
} from "../components/Desktop";
import { GlassFilter } from "../components/Icons";
import { Island } from "../components/Island";
import {
  Callout,
  Captions,
  Cursor,
  Keycaps,
  camAt,
  camTransform,
  cursorAt,
} from "../components/Overlays";
import {
  CALLOUTS,
  CAMERA,
  CAPTIONS,
  COUNTER_SPAN,
  CURSOR_CLICKS,
  CURSOR_PATH,
  CURSOR_SHOWS,
  ISLAND,
  KEYS,
  REVEAL_GLOW,
  caretOn,
  islandFx,
  switchCount,
  termState,
  typedAt,
} from "../story";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/** The orange bloom behind the notch when notchAgent comes alive. */
const RevealGlow: React.FC<{ frame: number }> = ({ frame }) => {
  const op = interpolate(
    frame,
    [REVEAL_GLOW.at, REVEAL_GLOW.at + 8, REVEAL_GLOW.at + 44],
    [0, 1, 0],
    clamp,
  );
  if (op <= 0) return null;
  const sc = interpolate(
    frame,
    [REVEAL_GLOW.at, REVEAL_GLOW.at + 44],
    [0.6, 1.5],
    clamp,
  );
  return (
    <div
      style={{
        position: "absolute",
        left: 756 - 260,
        top: -150,
        width: 520,
        height: 300,
        borderRadius: "50%",
        background:
          "radial-gradient(closest-side, rgba(217,119,87,.55), rgba(217,119,87,.18) 55%, rgba(217,119,87,0))",
        opacity: op,
        transform: `scale(${sc})`,
        zIndex: 3,
      }}
    />
  );
};

/** "Window switches today" counter for the problem beat (frame coordinates). */
const SwitchCounter: React.FC<{ frame: number }> = ({ frame }) => {
  const op = interpolate(
    frame,
    [
      COUNTER_SPAN.from,
      COUNTER_SPAN.from + 8,
      COUNTER_SPAN.to - 6,
      COUNTER_SPAN.to,
    ],
    [0, 1, 1, 0],
    clamp,
  );
  if (op <= 0) return null;
  const n = switchCount(frame);
  return (
    <div
      style={{
        position: "absolute",
        right: 64,
        top: 72,
        padding: "16px 26px 18px",
        borderRadius: 24,
        background: "rgba(12,12,16,.72)",
        backdropFilter: "blur(20px)",
        boxShadow:
          "inset 0 1px 0 rgba(255,255,255,.14), 0 20px 40px -16px rgba(0,0,0,.8)",
        fontFamily: "system-ui, -apple-system, sans-serif",
        color: "#fff",
        opacity: op,
        zIndex: 65,
        textAlign: "right",
      }}
    >
      <div
        style={{ fontSize: 24, fontWeight: 600, color: "rgba(255,255,255,.6)" }}
      >
        Window switches today
      </div>
      <div
        style={{
          fontSize: 76,
          fontWeight: 800,
          letterSpacing: "-0.03em",
          color: "#FFB340",
          fontVariantNumeric: "tabular-nums",
          lineHeight: 1.05,
        }}
      >
        {n}
      </div>
    </div>
  );
};

export const Demo: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const cam = camAt(CAMERA, frame);
  const cursor = cursorAt(CURSOR_PATH, CURSOR_SHOWS, CURSOR_CLICKS, frame);
  const terms = [0, 1, 2, 3].map((i) => termState(i, frame));
  const showTerms = terms.some((t) => t.minimize < 1);
  // the editor sits behind the terminals; reveal it as they minimise
  const editorOp = showTerms ? terms[0].minimize : 1;

  return (
    <AbsoluteFill
      style={{
        background:
          "radial-gradient(1400px 900px at 50% 40%, #232327 0%, #0d0d0f 70%)",
      }}
    >
      <div className="nd" style={{ position: "absolute", inset: 0 }}>
        <div
          className="screen"
          style={{
            transform: camTransform(cam),
            borderRadius: Math.max(0.5, 16 * cam.bezel), // > 0 keeps the glass mask working (see nod.css)
            boxShadow: `0 0 0 ${10 * cam.bezel}px #0b0b0c, 0 0 0 ${11 * cam.bezel}px #2a2a2a, 0 30px 60px rgba(0,0,0,${0.35 * cam.bezel})`,
          }}
        >
          <GlassFilter />
          <MenuBar
            app={showTerms && terms[0].minimize < 0.5 ? "Terminal" : "Code"}
          />
          <Sidebar opacity={editorOp} />
          <EditorWindow
            typed={typedAt(frame)}
            caretOn={caretOn(frame)}
            opacity={editorOp}
          />
          {showTerms
            ? terms.map((st, i) => <Terminal key={i} i={i} st={st} />)
            : null}
          <RevealGlow frame={frame} />
          <Island keys={ISLAND} frame={frame} fps={fps} fx={islandFx(frame)} />
          <Cursor st={cursor} />
        </div>
      </div>
      <SwitchCounter frame={frame} />
      <Callout cues={CALLOUTS} cam={cam} frame={frame} fps={fps} />
      <Keycaps events={KEYS} frame={frame} fps={fps} />
      <Captions cues={CAPTIONS} frame={frame} fps={fps} />
    </AbsoluteFill>
  );
};
