import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Clawd } from "../components/Icons";
import { Island } from "../components/Island";
import { Wordmark } from "../components/Overlays";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const FONT = '"SF Pro Display", system-ui, -apple-system, sans-serif';

/** A notch with the working island (mascot + wave), drawn at 2.2x. */
const NotchBadge: React.FC<{ frame: number; fps: number; liveAt: number }> = ({
  frame,
  fps,
  liveAt,
}) => (
  <div
    className="nd"
    style={{
      position: "absolute",
      left: 960 - 756 * 2.2,
      top: 0,
      width: 1512,
      height: 60,
      transform: "scale(2.2)",
      transformOrigin: "0 0",
    }}
  >
    <Island
      keys={[
        { at: -100, view: { k: "idle" } },
        { at: liveAt, view: { k: "working" } },
      ]}
      frame={frame}
      fps={fps}
    />
  </div>
);

const Lockup: React.FC<{
  frame: number;
  fps: number;
  nameAt: number;
  tagAt: number;
  mascotAt: number;
}> = ({ frame, fps, nameAt, tagAt, mascotAt }) => {
  const m = spring({
    frame: frame - mascotAt,
    fps,
    config: { damping: 11, stiffness: 160, mass: 0.8 },
  });
  const n = spring({
    frame: frame - nameAt,
    fps,
    config: { damping: 16, stiffness: 170 },
  });
  const t = interpolate(frame, [tagAt, tagAt + 14], [0, 1], clamp);
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        fontFamily: FONT,
        color: "#fff",
      }}
    >
      <div
        style={{
          opacity: Math.min(1, m * 1.4),
          transform: `translateY(${(1 - m) * 30}px) scale(${0.6 + 0.4 * m})`,
        }}
      >
        <Clawd w={150} color="#D97757" />
      </div>
      <div
        style={{
          marginTop: 34,
          fontSize: 196,
          fontWeight: 800,
          letterSpacing: "-0.045em",
          lineHeight: 0.92,
          opacity: n,
          transform: `translateY(${(1 - n) * 40}px)`,
        }}
      >
        <Wordmark />
      </div>
      <div
        style={{
          marginTop: 34,
          fontSize: 64,
          fontWeight: 600,
          letterSpacing: "-0.02em",
          color: "rgba(255,255,255,.78)",
          opacity: t,
          transform: `translateY(${(1 - t) * 18}px)`,
        }}
      >
        Approve your agents from the{" "}
        <span style={{ color: "#E8916E" }}>notch</span>.
      </div>
    </div>
  );
};

const Backdrop: React.FC = () => (
  <AbsoluteFill
    style={{
      background:
        "radial-gradient(900px 520px at 50% -8%, rgba(217,119,87,.30), rgba(217,119,87,0) 70%), radial-gradient(1200px 800px at 50% 120%, rgba(123,63,228,.22), rgba(123,63,228,0) 70%), #050506",
    }}
  />
);

export const TitleCard: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill>
      <Backdrop />
      <NotchBadge frame={frame} fps={fps} liveAt={10} />
      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          paddingTop: 30,
        }}
      >
        <Lockup frame={frame} fps={fps} mascotAt={4} nameAt={12} tagAt={26} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/** End card. `tagAt` is when the narrator says the tagline (frames from the card's start). */
export const EndCard: React.FC<{ tagAt?: number }> = ({ tagAt = 30 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const foot = interpolate(frame, [tagAt + 24, tagAt + 40], [0, 1], clamp);
  return (
    <AbsoluteFill>
      <Backdrop />
      <NotchBadge frame={frame} fps={fps} liveAt={-100} />
      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          paddingTop: 10,
        }}
      >
        <Lockup frame={frame} fps={fps} mascotAt={6} nameAt={12} tagAt={tagAt} />
      </AbsoluteFill>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 84,
          textAlign: "center",
          fontFamily: FONT,
          fontSize: 32,
          fontWeight: 600,
          letterSpacing: "-0.01em",
          color: "rgba(255,255,255,.5)",
          opacity: foot,
        }}
      >
        For Claude Code · macOS 26 · Built at BV Hacks 2026
      </div>
    </AbsoluteFill>
  );
};
