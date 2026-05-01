#!/usr/bin/env python3
"""Create a local HTML preview with self-rendered captions."""

from __future__ import annotations

import argparse
import html
import json
import re
from pathlib import Path


def timestamp_to_seconds(value: str) -> float:
    match = re.fullmatch(r"(?:(\d{2}):)?(\d{2}):(\d{2})[,.](\d{3})", value.strip())
    if not match:
        raise ValueError(f"Invalid timestamp: {value}")
    hours_raw, minutes_raw, seconds_raw, millis_raw = match.groups()
    hours = int(hours_raw or 0)
    return hours * 3600 + int(minutes_raw) * 60 + int(seconds_raw) + int(millis_raw) / 1000


def parse_caption_file(path: Path) -> list[dict]:
    text = path.read_text(encoding="utf-8-sig")
    text = re.sub(r"^WEBVTT.*?\n\n", "", text, flags=re.DOTALL)
    blocks = re.split(r"\n\s*\n", text.strip())
    segments: list[dict] = []
    for block in blocks:
        lines = [line.strip() for line in block.splitlines() if line.strip()]
        if not lines:
            continue
        time_index = next((index for index, line in enumerate(lines) if "-->" in line), -1)
        if time_index == -1:
            continue
        start_raw, end_raw = [part.strip().split()[0] for part in lines[time_index].split("-->", 1)]
        caption_text = " ".join(lines[time_index + 1 :]).strip()
        if caption_text:
            segments.append(
                {
                    "start": timestamp_to_seconds(start_raw),
                    "end": timestamp_to_seconds(end_raw),
                    "text": caption_text,
                }
            )
    return segments


def build_html(video_name: str, tracks: list[dict], title: str) -> str:
    tracks_json = json.dumps(tracks, ensure_ascii=False)
    escaped_title = html.escape(title)
    return f"""<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{escaped_title}</title>
    <style>
      body {{
        margin: 0;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        background: #111;
        color: #f6f6f6;
      }}
      main {{
        max-width: 1100px;
        margin: 0 auto;
        padding: 24px;
      }}
      .player {{
        position: relative;
        background: #000;
      }}
      video {{
        display: block;
        width: 100%;
        max-height: 78vh;
        background: #000;
      }}
      #captionOverlay {{
        position: absolute;
        left: 7%;
        right: 7%;
        bottom: 7%;
        display: grid;
        gap: 8px;
        text-shadow: 0 1px 2px #000;
        pointer-events: none;
      }}
      #captionOverlay:empty {{
        display: none;
      }}
      .captionRow {{
        display: grid;
        grid-template-columns: minmax(90px, auto) 1fr;
        gap: 10px;
        align-items: center;
        padding: 0.35em 0.7em;
        border-radius: 6px;
        background: rgba(0, 0, 0, 0.74);
        color: white;
        font-size: clamp(15px, 2.1vw, 28px);
        line-height: 1.35;
      }}
      .captionLabel {{
        color: #f2d17b;
        font-size: 0.72em;
        font-weight: 700;
        text-align: right;
        white-space: nowrap;
      }}
      .captionText {{
        text-align: left;
      }}
      .toolbar {{
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-top: 12px;
      }}
      button {{
        border: 1px solid #555;
        border-radius: 6px;
        background: #222;
        color: #f6f6f6;
        padding: 8px 10px;
        cursor: pointer;
      }}
      button:hover {{
        background: #333;
      }}
      .status {{
        margin-top: 10px;
        color: #bbb;
        font-size: 14px;
      }}
    </style>
  </head>
  <body>
    <main>
      <div class="player">
        <video id="video" controls>
          <source src="{html.escape(video_name)}" type="video/mp4">
        </video>
        <div id="captionOverlay"></div>
      </div>
      <div class="toolbar" id="trackControls"></div>
      <div class="toolbar">
        <button data-seek="39.82">00:39 first caption</button>
        <button data-seek="60.62">01:00 speech sample</button>
        <button data-seek="300">05:00 mid sample</button>
        <button data-seek="600">10:00 late sample</button>
      </div>
      <div class="status" id="status"></div>
    </main>
    <script>
      const tracks = {tracks_json};
      const visibleTracks = new Set(tracks.map((track) => track.label));
      const video = document.getElementById("video");
      const overlay = document.getElementById("captionOverlay");
      const status = document.getElementById("status");
      const trackControls = document.getElementById("trackControls");

      function activeCaption(track, time) {{
        return track.captions.find((caption) => time >= caption.start && time <= caption.end);
      }}

      function renderCaption() {{
        overlay.textContent = "";
        for (const track of tracks) {{
          if (!visibleTracks.has(track.label)) continue;
          const caption = activeCaption(track, video.currentTime);
          if (!caption) continue;
          const row = document.createElement("div");
          row.className = "captionRow";
          const label = document.createElement("div");
          label.className = "captionLabel";
          label.textContent = track.label;
          const text = document.createElement("div");
          text.className = "captionText";
          text.textContent = caption.text;
          row.append(label, text);
          overlay.append(row);
        }}
        const count = tracks.map((track) => track.label + ": " + track.captions.length).join(" / ");
        status.textContent = count + " embedded caption segments. Current time: " + video.currentTime.toFixed(2) + "s";
      }}

      for (const track of tracks) {{
        const button = document.createElement("button");
        button.textContent = "Hide " + track.label;
        button.addEventListener("click", () => {{
          if (visibleTracks.has(track.label)) {{
            visibleTracks.delete(track.label);
            button.textContent = "Show " + track.label;
          }} else {{
            visibleTracks.add(track.label);
            button.textContent = "Hide " + track.label;
          }}
          renderCaption();
        }});
        trackControls.append(button);
      }}

      video.addEventListener("timeupdate", renderCaption);
      video.addEventListener("seeked", renderCaption);
      video.addEventListener("loadedmetadata", renderCaption);
      document.querySelectorAll("button[data-seek]").forEach((button) => {{
        button.addEventListener("click", () => {{
          video.currentTime = Number(button.dataset.seek);
          video.play();
          renderCaption();
        }});
      }});
      renderCaption();
    </script>
  </body>
</html>
"""


def main() -> int:
    parser = argparse.ArgumentParser(description="Create a local HTML caption preview.")
    parser.add_argument("video", help="Local video file path")
    parser.add_argument("captions", nargs="?", help="SRT or VTT caption file path")
    parser.add_argument(
        "--track",
        action="append",
        default=[],
        help="Caption track as LABEL=/path/to/captions.srt. May be repeated.",
    )
    parser.add_argument("--output", default="preview.html", help="HTML file to write")
    parser.add_argument("--title", default="YouTube CC Preview")
    args = parser.parse_args()

    video_path = Path(args.video).expanduser().resolve()
    output_path = Path(args.output).expanduser().resolve()
    if not video_path.exists():
        raise SystemExit(f"Missing video file: {video_path}")
    if video_path.parent != output_path.parent:
        raise SystemExit("Write preview.html beside the video so relative playback works.")

    track_specs = list(args.track)
    if args.captions:
        track_specs.insert(0, f"Captions={args.captions}")
    if not track_specs:
        raise SystemExit("Provide a caption file or at least one --track LABEL=PATH")

    tracks: list[dict] = []
    for spec in track_specs:
        if "=" not in spec:
            raise SystemExit(f"Invalid --track value, expected LABEL=PATH: {spec}")
        label, raw_path = spec.split("=", 1)
        caption_path = Path(raw_path).expanduser().resolve()
        if not caption_path.exists():
            raise SystemExit(f"Missing caption file: {caption_path}")
        tracks.append({"label": label.strip() or caption_path.stem, "captions": parse_caption_file(caption_path)})

    output_path.write_text(build_html(video_path.name, tracks, args.title), encoding="utf-8")
    print(output_path)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
