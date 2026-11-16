# Nod demo video

A 95-second, 1920×1080, 30 fps demo of Nod, made with [Remotion](https://remotion.dev). The island UI is a React port of `docs/design/prototype.html`: same class names, colors, sizes and glass, and the same spring physics, driven frame by frame so every render is identical.

- Narration and shot list: [`script.md`](script.md)
- Rendered video: `out/nod-demo.mp4`, with review stills in `out/frames/`

## Quick start

```bash
cd video
npm install
npm run dev        # Remotion Studio: scrub the timeline, open "NodDemo"
npm run render     # -> out/nod-demo.mp4 (H.264, about 3 min on an M-series Mac)
npm run check      # probe + full decode + stills -> out/frames/
```

Render on macOS. The UI uses `system-ui` and `ui-monospace`, which resolve to SF Pro and SF Mono there, just like the prototype. On Linux the fonts fall back to something else.

## How timing works

Every narration line is its own file, `public/vo/<id>.wav`. `scripts/measure-vo.sh` measures them all with ffprobe and writes `src/generated/vo-durations.json`. `src/timeline.ts` lays the lines end to end with small gaps and named pauses (`LAYOUT`), and `src/story.ts` anchors every visual event (island state, camera move, cursor, keypress, caption) to a line start. A longer or shorter read therefore moves the visuals with it, and the composition length follows automatically.

| file | what it holds |
|---|---|
| `src/data/vo-lines.json` | the narration: id, text, an optional `say` pronunciation override, on-screen caption |
| `src/timeline.ts` | gaps and pauses between lines → frame positions |
| `src/story.ts` | choreography: island keyframes, camera, cursor, keycaps, captions |
| `src/components/Island.tsx` | the island: geometry, springs, content (Progress, request cards, toasts) |
| `src/components/Desktop.tsx` | menu bar, sidebar, editor, the four Claude Code terminals |
| `src/components/Overlays.tsx` | camera, cursor, ⌥↵ keycaps, captions |
| `src/nod.css` | the prototype's CSS, ported (transitions removed, values unchanged) |
| `src/IslandCheck.tsx` | a 1512×640 still at 1:1 for side-by-side checks against the prototype |

## Voiceover

### Placeholder (current)

```bash
npm run vo          # generate any missing lines with macOS `say`, then measure
npm run vo:force    # regenerate every line (VOICE="Daniel" RATE=175 npm run vo:force to try another voice)
```

It uses `say -v Samantha -r 182`, trims the silence, adds 60 ms of air on each side, normalizes loudness (`loudnorm I=-16`), and writes 48 kHz mono WAV.

### Swapping in the final ElevenLabs VO

The filenames are the contract. Keep them exactly:

```
01a-problem 01b-problem 01c-problem 02a-reveal 02b-reveal
03a-progress 03b-progress 03c-progress 04a-approve 04b-approve 04c-approve
05a-risk 05b-risk 05c-risk 06a-high 06b-high 06c-high 06d-learn 07a-many 07b-many 08a-close
```

1. Generate each line from `text` in `src/data/vo-lines.json`, one file per line, using the reading notes at the bottom of `script.md`. Either export one file per line from ElevenLabs, or record one take and split it at the pauses.
2. Convert each file to the same format, overwriting the placeholder:
   ```bash
   for f in ~/Downloads/nod-vo/*.mp3; do
     id=$(basename "$f" .mp3)
     ffmpeg -y -i "$f" -af "silenceremove=start_periods=1:start_threshold=-50dB,areverse,silenceremove=start_periods=1:start_threshold=-50dB,areverse,adelay=60,apad=pad_dur=0.06,loudnorm=I=-16:TP=-1.5:LRA=11" \
       -ar 48000 -ac 1 -c:a pcm_s16le "public/vo/$id.wav"
   done
   ```
3. Re-measure, then render:
   ```bash
   npm run vo:measure   # rewrites src/generated/vo-durations.json
   npm run render && npm run check
   ```
   `npm run vo` without `--force` never overwrites existing files, so it's also safe to run after a swap.
4. Look at the stills. If a line runs much longer than the placeholder and a visual lands early, increase that line's `gap` or the following pause in `LAYOUT` (`src/timeline.ts`). `story.ts` throws a clear error if a change puts keyframes out of order.

### Generating a line with the ElevenLabs API

`scripts/eleven-vo.sh <id>...` reads each line's `text` from `src/data/vo-lines.json`, generates it in the final read's voice (Brian, `eleven_v4`), and converts it exactly like step 2 above, so it works with Remotion's bundled ffmpeg too. The key comes from `ELEVENLABS_API_KEY` in your environment or in the repo's root `.env` (gitignored), and is never printed. Downloads are cached in `out/vo-cache/` so a re-run doesn't spend credits. Then `npm run vo:measure` and render as usual.

## Music

`npm run music` synthesizes `public/music/bed.mp3` locally with no samples and no downloads: a sine pad (Am, F, C, G) and a soft plucked arpeggio that enters around the reveal, with a little reverb. `NodDemo.tsx` mixes it at about −11 dB and ducks it by half under every VO line. To replace it, drop in any `bed.mp3` that's at least as long as the video.

## Fidelity checks

```bash
npx remotion still IslandCheck out/checks/check-high.png --props='{"state":"high"}'   # working|progress|low|med|high|done
```

This renders the prototype's 1512×640 screen at 1:1 with the island settled. Compare it with a screenshot of `docs/design/prototype.html#s=high` at the same size. The island's request-card heights (219, 248 and 253 pt) were measured from the prototype this way.

### Gotcha: the liquid-glass edge

`.glass` uses `backdrop-filter: url(#lg) …` (an SVG displacement filter) together with a `mask-image` fade. Chrome drops that mask, leaving a hard edge where the glass starts, unless an ancestor has a rounded overflow clip. The prototype got one from `.stage { overflow:hidden; border-radius:16px }`. Here `.screen` keeps `border-radius: 0.5px` for the same reason, so don't remove it.

## Motion

- Island open: SwiftUI `.spring(response: 0.5, dampingFraction: 0.8)`, converted to Remotion `spring()` (mass 1, stiffness (2π/0.5)², damping 2·0.8·(2π/0.5)).
- Island close: `response 0.38, dampingFraction 1.0` (critically damped). Growing compact states use `0.42 / 0.7`.
- Content swaps like the prototype: the old content blurs out over 0.1 s, the swap happens at +90 ms, and the new content blurs in from scale 0.94.
- The wave bars, attention pulse, step rise and live seconds counter are all computed from the frame number, not CSS animations.
