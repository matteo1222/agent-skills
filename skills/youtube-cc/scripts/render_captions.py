#!/usr/bin/env python3
"""Render SRT/VTT files from a caption JSON file."""

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path


def slugify(value: str, fallback: str = "captions") -> str:
    value = re.sub(r"[^\w\s.-]", "", value, flags=re.UNICODE)
    value = re.sub(r"\s+", "-", value.strip())
    value = value.strip(".-_")
    return value[:120] or fallback


def seconds_to_timestamp(seconds: float, *, srt: bool) -> str:
    seconds = max(0, seconds)
    millis = int(round(seconds * 1000))
    hours, remainder = divmod(millis, 3_600_000)
    minutes, remainder = divmod(remainder, 60_000)
    secs, millis = divmod(remainder, 1000)
    separator = "," if srt else "."
    return f"{hours:02d}:{minutes:02d}:{secs:02d}{separator}{millis:03d}"


def write_srt(path: Path, segments: list[dict]) -> None:
    blocks = []
    for index, segment in enumerate(segments, start=1):
        blocks.append(
            "\n".join(
                [
                    str(index),
                    f"{seconds_to_timestamp(float(segment['start']), srt=True)} --> {seconds_to_timestamp(float(segment['end']), srt=True)}",
                    str(segment["text"]).strip(),
                ]
            )
        )
    path.write_text("\n\n".join(blocks) + "\n", encoding="utf-8")


def write_vtt(path: Path, segments: list[dict]) -> None:
    blocks = ["WEBVTT\n"]
    for segment in segments:
        blocks.append(
            "\n".join(
                [
                    f"{seconds_to_timestamp(float(segment['start']), srt=False)} --> {seconds_to_timestamp(float(segment['end']), srt=False)}",
                    str(segment["text"]).strip(),
                ]
            )
        )
    path.write_text("\n\n".join(blocks) + "\n", encoding="utf-8")


def main() -> int:
    parser = argparse.ArgumentParser(description="Render SRT/VTT from caption JSON.")
    parser.add_argument("caption_json", help="JSON file with metadata and segments")
    parser.add_argument("--output-dir", help="Directory for rendered files")
    parser.add_argument("--output-base", help="Base filename without extension")
    parser.add_argument("--format", choices=["srt", "vtt", "all"], default="all")
    args = parser.parse_args()

    json_path = Path(args.caption_json).expanduser().resolve()
    payload = json.loads(json_path.read_text(encoding="utf-8"))
    segments = payload.get("segments")
    if not isinstance(segments, list):
        raise SystemExit("caption_json must contain a segments array")
    output_dir = Path(args.output_dir).expanduser().resolve() if args.output_dir else json_path.parent
    output_dir.mkdir(parents=True, exist_ok=True)
    output_base = args.output_base or slugify(json_path.stem)
    output_path = output_dir / output_base

    written: dict[str, str] = {}
    if args.format in {"srt", "all"}:
        srt_path = output_path.parent / f"{output_path.name}.srt"
        write_srt(srt_path, segments)
        written["srt"] = str(srt_path)
    if args.format in {"vtt", "all"}:
        vtt_path = output_path.parent / f"{output_path.name}.vtt"
        write_vtt(vtt_path, segments)
        written["vtt"] = str(vtt_path)

    print(json.dumps({"status": "ok", "outputs": written}, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
