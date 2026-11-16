#!/usr/bin/env bash
# Generate VO lines with the ElevenLabs API, in the final read's voice, and convert
# them like the README's swap step (trim, 60 ms of air, loudnorm, 48 kHz mono WAV).
# Trimming uses silencedetect + atrim, so it also works with Remotion's bundled ffmpeg.
# Downloads are cached in out/vo-cache/ (keyed by text, voice and model) so a re-run doesn't spend credits.
# A line's optional `eleven` field overrides `text` for the API (e.g. to spell out how a name is said).
#
#   scripts/eleven-vo.sh 06d-learn [more ids...]
#
# The key comes from ELEVENLABS_API_KEY, or from ELEVENLABS_API_KEY=... in the repo's
# root .env. It is never printed. Override the voice or model with ELEVEN_VOICE / ELEVEN_MODEL.
set -euo pipefail
cd "$(dirname "$0")/.."

[[ $# -gt 0 ]] || { echo "usage: $0 <line-id>..." >&2; exit 2; }
LINES=src/data/vo-lines.json
VOICE="${ELEVEN_VOICE:-nPczCjzI2devNBz1zQrb}" # Brian (premade)
MODEL="${ELEVEN_MODEL:-eleven_v4}"
KEY="${ELEVENLABS_API_KEY:-}"
if [[ -z "$KEY" && -f ../.env ]]; then
  KEY="$(sed -n 's/^ELEVENLABS_API_KEY=//p' ../.env | tail -1 | tr -d "\r\"' ")"
fi
[[ -n "$KEY" ]] || { echo "no ELEVENLABS_API_KEY (env or ../.env)" >&2; exit 1; }

if command -v ffmpeg >/dev/null; then FFMPEG=(ffmpeg); else FFMPEG=(npx --no-install remotion ffmpeg); fi
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
CACHE=out/vo-cache
mkdir -p "$CACHE"

for id in "$@"; do
  text="$(jq -r --arg id "$id" '.lines[] | select(.id == $id) | .eleven // .text' "$LINES")"
  [[ -n "$text" ]] || { echo "unknown line $id" >&2; exit 1; }
  mp3="$CACHE/$id-$(printf '%s|%s|%s' "$text" "$VOICE" "$MODEL" | shasum | cut -c1-10).mp3"
  if [[ ! -s "$mp3" ]]; then
    jq -n --arg text "$text" --arg model "$MODEL" '{text: $text, model_id: $model}' > "$TMP/body.json"
    code="$(printf 'xi-api-key: %s\n' "$KEY" | curl -sS -o "$TMP/$id.mp3" -w '%{http_code}' -H @- \
      -H 'Content-Type: application/json' --data-binary "@$TMP/body.json" \
      "https://api.elevenlabs.io/v1/text-to-speech/$VOICE?output_format=mp3_44100_128")"
    if [[ "$code" != 200 ]]; then
      echo "$id: HTTP $code: $(head -c 400 "$TMP/$id.mp3")" >&2
      exit 1
    fi
    mv "$TMP/$id.mp3" "$mp3"
  fi
  # leading / trailing silence below -50 dB
  log="$("${FFMPEG[@]}" -hide_banner -nostats -i "$mp3" -af silencedetect=noise=-50dB:d=0.02 -f null - 2>&1)"
  dur="$(sed -n 's/.*Duration: \([0-9:.]*\).*/\1/p' <<<"$log" | head -1 | awk -F: '{ print $1 * 3600 + $2 * 60 + $3 }')"
  start="$(awk '/silence_start: / { s = $NF } /silence_end: / { if (s + 0 <= 0.001) { print $5; exit } }' <<<"$log")"
  end="$(awk -v d="$dur" '/silence_start: / { s = $NF; open = 1 } /silence_end: / { open = 0 } END { print (open ? s : d) }' <<<"$log")"
  "${FFMPEG[@]}" -hide_banner -loglevel error -y -i "$mp3" \
    -af "atrim=start=${start:-0}:end=$end,asetpts=PTS-STARTPTS,adelay=60,apad=pad_dur=0.06,loudnorm=I=-16:TP=-1.5:LRA=11" \
    -ar 48000 -ac 1 -c:a pcm_s16le "public/vo/$id.wav"
  echo "wrote public/vo/$id.wav"
done
