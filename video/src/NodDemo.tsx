import React from "react";
import {
  AbsoluteFill,
  Sequence,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { Audio } from "@remotion/media";
import "./nod.css";
import { Demo } from "./scenes/Demo";
import { EndCard, TitleCard } from "./scenes/Cards";
import { END_IN, TITLE_OUT } from "./story";
import { LINE_LIST, TOTAL, sec } from "./timeline";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/** Music bed: about -11 dB under its own level, ducked by half (-6 dB) while the narrator talks. */
const musicVolume = (f: number) => {
  let duck = 0;
  for (const l of LINE_LIST) {
    duck = Math.max(
      duck,
      interpolate(
        f,
        [l.from - 8, l.from, l.end, l.end + 10],
        [0, 1, 1, 0],
        clamp,
      ),
    );
  }
  const fades = Math.min(
    interpolate(f, [0, 20], [0, 1], clamp),
    interpolate(f, [TOTAL - 60, TOTAL - 2], [1, 0], clamp),
  );
  return 0.28 * (1 - 0.5 * duck) * fades;
};

export const NodDemo: React.FC = () => {
  const frame = useCurrentFrame();
  const titleOp = interpolate(
    frame,
    [TITLE_OUT - 8, TITLE_OUT + 6],
    [1, 0],
    clamp,
  );
  const endOp = interpolate(frame, [END_IN, END_IN + 14], [0, 1], clamp);
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <Sequence name="Demo" durationInFrames={END_IN + 16}>
        <Demo />
      </Sequence>
      <Sequence name="Title" durationInFrames={TITLE_OUT + 8}>
        <AbsoluteFill style={{ opacity: titleOp }}>
          <TitleCard />
        </AbsoluteFill>
      </Sequence>
      <Sequence name="End" from={END_IN}>
        <AbsoluteFill style={{ opacity: endOp }}>
          <EndCard tagAt={14 + sec(1.3)} />
        </AbsoluteFill>
      </Sequence>

      {LINE_LIST.map((l) => (
        <Sequence
          key={l.id}
          name={`VO ${l.id}`}
          from={l.from}
          durationInFrames={l.dur + 6}
          layout="none"
        >
          <Audio src={staticFile(`vo/${l.id}.wav`)} />
        </Sequence>
      ))}
      <Audio src={staticFile("music/bed.mp3")} volume={musicVolume} />
    </AbsoluteFill>
  );
};
