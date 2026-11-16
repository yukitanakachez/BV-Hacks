#!/usr/bin/env bash
# Verify the rendered video and pull review stills.
#   scripts/check-render.sh [video=out/nod-demo.mp4] [timestamps...]
# Prints codec/size/duration, fully decodes the file (fails on corruption),
# and writes PNG stills to out/frames/.
set -euo pipefail
cd "$(dirname "$0")/.."
VIDEO="${1:-out/nod-demo.mp4}"
shift || true
TIMES=("$@")
[[ ${#TIMES[@]} -eq 0 ]] && TIMES=(2.0 14.0 24.8 35.6 45.4 56.1 70.4 79.5 93.5)

ffprobe -v error -show_entries format=duration,size:stream=codec_name,width,height,r_frame_rate,sample_rate \
  -of default=nw=1 "$VIDEO"
ffmpeg -hide_banner -v error -i "$VIDEO" -f null - && echo "decode: ok"

mkdir -p out/frames
rm -f out/frames/*.png
for t in "${TIMES[@]}"; do
  ffmpeg -hide_banner -loglevel error -y -ss "$t" -i "$VIDEO" -frames:v 1 "out/frames/frame-$(printf '%05.1f' "$t")s.png"
done
ls -1 out/frames
