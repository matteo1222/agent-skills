#!/usr/bin/env python3
"""Audit caption coverage against audio activity.

This script is intentionally dependency-light: it uses ffmpeg's deterministic
silence detection to find non-silent audio ranges, then compares those ranges
with caption timing. Non-silent audio is not guaranteed to be speech, but
uncovered regions are strong candidates for manual review or targeted ASR.
"""

from __future__ import annotations

import argparse
import dataclasses
import json
import re
import shutil
import subprocess
import sys
from pathlib import Path
from typing import Iterable


@dataclasses.dataclass(frozen=True)
class Interval:
    start: float
    end: float

    @property
    def duration(self) -> float:
        return max(0.0, self.end - self.start)


@dataclasses.dataclass(frozen=True)
class CaptionSegment:
    index: int
    start: float
    end: float
    text: str

    @property
    def duration(self) -> float:
        return max(0.0, self.end - self.start)


def require_tool(name: str) -> str:
    path = shutil.which(name)
    if not path:
        raise SystemExit(f"Missing required tool: {name}")
    return path


def run(cmd: list[str]) -> subprocess.CompletedProcess[str]:
    return subprocess.run(cmd, check=True, text=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)


def timestamp_to_seconds(value: str) -> float:
    match = re.fullmatch(r"(?:(\d{1,2}):)?(\d{2}):(\d{2})[,.](\d{3})", value.strip())
    if not match:
        raise ValueError(f"Invalid timestamp: {value}")
    hours_raw, minutes_raw, seconds_raw, millis_raw = match.groups()
    hours = int(hours_raw or 0)
    return hours * 3600 + int(minutes_raw) * 60 + int(seconds_raw) + int(millis_raw) / 1000


def seconds_to_timestamp(seconds: float) -> str:
    seconds = max(0.0, seconds)
    millis = int(round(seconds * 1000))
    hours, remainder = divmod(millis, 3_600_000)
    minutes, remainder = divmod(remainder, 60_000)
    secs, millis = divmod(remainder, 1000)
    return f"{hours:02d}:{minutes:02d}:{secs:02d}.{millis:03d}"


def parse_caption_json(path: Path) -> list[CaptionSegment]:
    payload = json.loads(path.read_text(encoding="utf-8"))
    raw_segments = payload.get("segments")
    if not isinstance(raw_segments, list):
        raise ValueError("JSON caption file must contain a segments array")

    segments: list[CaptionSegment] = []
    for fallback_index, raw_segment in enumerate(raw_segments, start=1):
        if not isinstance(raw_segment, dict):
            continue
        text = str(raw_segment.get("text", "")).strip()
        if not text:
            continue
        segments.append(
            CaptionSegment(
                index=int(raw_segment.get("index", fallback_index)),
                start=float(raw_segment["start"]),
                end=float(raw_segment["end"]),
                text=text,
            )
        )
    return segments


def parse_caption_text(path: Path) -> list[CaptionSegment]:
    text = path.read_text(encoding="utf-8-sig")
    text = re.sub(r"^WEBVTT.*?\n\n", "", text, flags=re.DOTALL)
    blocks = re.split(r"\n\s*\n", text.strip())
    segments: list[CaptionSegment] = []
    for block in blocks:
        lines = [line.strip("\ufeff") for line in block.splitlines() if line.strip()]
        if not lines:
            continue
        time_index = next((index for index, line in enumerate(lines) if "-->" in line), -1)
        if time_index == -1:
            continue
        start_raw, end_raw = [part.strip().split()[0] for part in lines[time_index].split("-->", 1)]
        caption_text = " ".join(line.strip() for line in lines[time_index + 1 :]).strip()
        if not caption_text:
            continue
        segments.append(
            CaptionSegment(
                index=len(segments) + 1,
                start=timestamp_to_seconds(start_raw),
                end=timestamp_to_seconds(end_raw),
                text=caption_text,
            )
        )
    return segments


def parse_captions(path: Path) -> list[CaptionSegment]:
    if path.suffix.lower() == ".json":
        segments = parse_caption_json(path)
    else:
        segments = parse_caption_text(path)
    return sorted(segments, key=lambda segment: (segment.start, segment.end, segment.index))


def media_duration(path: Path) -> float:
    require_tool("ffprobe")
    result = run(
        [
            "ffprobe",
            "-v",
            "error",
            "-show_entries",
            "format=duration",
            "-of",
            "json",
            str(path),
        ]
    )
    payload = json.loads(result.stdout)
    duration_raw = payload.get("format", {}).get("duration")
    if duration_raw is None:
        raise SystemExit(f"Could not determine media duration: {path}")
    return float(duration_raw)


def detect_silences(path: Path, *, noise: str, duration: float) -> list[Interval]:
    require_tool("ffmpeg")
    result = run(
        [
            "ffmpeg",
            "-hide_banner",
            "-nostats",
            "-i",
            str(path),
            "-af",
            f"silencedetect=noise={noise}:d={duration}",
            "-f",
            "null",
            "-",
        ]
    )
    silences: list[Interval] = []
    open_start: float | None = None
    for line in result.stderr.splitlines():
        start_match = re.search(r"silence_start:\s*([0-9.]+)", line)
        if start_match:
            open_start = float(start_match.group(1))
            continue
        end_match = re.search(r"silence_end:\s*([0-9.]+)", line)
        if end_match and open_start is not None:
            end = float(end_match.group(1))
            if end > open_start:
                silences.append(Interval(open_start, end))
            open_start = None
    if open_start is not None:
        silences.append(Interval(open_start, media_duration(path)))
    return merge_intervals(silences)


def merge_intervals(intervals: Iterable[Interval], *, gap_tolerance: float = 0.0) -> list[Interval]:
    sorted_intervals = sorted((interval for interval in intervals if interval.end > interval.start), key=lambda item: item.start)
    merged: list[Interval] = []
    for interval in sorted_intervals:
        if not merged or interval.start > merged[-1].end + gap_tolerance:
            merged.append(interval)
        else:
            merged[-1] = Interval(merged[-1].start, max(merged[-1].end, interval.end))
    return merged


def complement_intervals(intervals: list[Interval], *, start: float, end: float) -> list[Interval]:
    output: list[Interval] = []
    cursor = start
    for interval in merge_intervals(intervals):
        if interval.start > cursor:
            output.append(Interval(cursor, min(interval.start, end)))
        cursor = max(cursor, interval.end)
        if cursor >= end:
            break
    if cursor < end:
        output.append(Interval(cursor, end))
    return [interval for interval in output if interval.duration > 0]


def subtract_intervals(base: Interval, removals: list[Interval]) -> list[Interval]:
    chunks = [base]
    for removal in removals:
        next_chunks: list[Interval] = []
        for chunk in chunks:
            if removal.end <= chunk.start or removal.start >= chunk.end:
                next_chunks.append(chunk)
                continue
            if removal.start > chunk.start:
                next_chunks.append(Interval(chunk.start, min(removal.start, chunk.end)))
            if removal.end < chunk.end:
                next_chunks.append(Interval(max(removal.end, chunk.start), chunk.end))
        chunks = next_chunks
        if not chunks:
            break
    return chunks


def padded_caption_intervals(segments: list[CaptionSegment], padding: float, duration: float) -> list[Interval]:
    return merge_intervals(
        [
            Interval(max(0.0, segment.start - padding), min(duration, segment.end + padding))
            for segment in segments
            if segment.end > segment.start
        ]
    )


def interval_to_json(interval: Interval) -> dict:
    return {
        "start": round(interval.start, 3),
        "end": round(interval.end, 3),
        "duration": round(interval.duration, 3),
        "start_time": seconds_to_timestamp(interval.start),
        "end_time": seconds_to_timestamp(interval.end),
    }


def segment_to_json(segment: CaptionSegment) -> dict:
    return {
        "index": segment.index,
        "start": round(segment.start, 3),
        "end": round(segment.end, 3),
        "duration": round(segment.duration, 3),
        "start_time": seconds_to_timestamp(segment.start),
        "end_time": seconds_to_timestamp(segment.end),
        "text": segment.text,
    }


def nearby_caption_text(segments: list[CaptionSegment], time: float, *, before: bool) -> str | None:
    candidates = [segment for segment in segments if segment.end <= time] if before else [segment for segment in segments if segment.start >= time]
    if not candidates:
        return None
    segment = max(candidates, key=lambda item: item.end) if before else min(candidates, key=lambda item: item.start)
    return f"#{segment.index} {seconds_to_timestamp(segment.start)} {segment.text}"


def build_report(args: argparse.Namespace) -> dict:
    media_path = Path(args.media).expanduser().resolve()
    captions_path = Path(args.captions).expanduser().resolve()
    if not media_path.exists():
        raise SystemExit(f"Missing media file: {media_path}")
    if not captions_path.exists():
        raise SystemExit(f"Missing caption file: {captions_path}")

    duration = media_duration(media_path)
    captions = parse_captions(captions_path)
    if not captions:
        raise SystemExit(f"No caption segments parsed from: {captions_path}")

    invalid_captions = [segment for segment in captions if segment.end <= segment.start]
    caption_overlaps = []
    for previous, current in zip(captions, captions[1:]):
        overlap = previous.end - current.start
        if overlap > args.overlap_tolerance:
            caption_overlaps.append(
                {
                    "previous": segment_to_json(previous),
                    "current": segment_to_json(current),
                    "overlap": round(overlap, 3),
                }
            )

    silences = detect_silences(media_path, noise=args.noise, duration=args.silence_duration)
    activity = [
        interval
        for interval in complement_intervals(silences, start=0.0, end=duration)
        if interval.duration >= args.min_activity
    ]
    caption_coverage = padded_caption_intervals(captions, args.caption_padding, duration)

    uncovered_activity: list[dict] = []
    for active_interval in activity:
        uncovered_chunks = subtract_intervals(active_interval, caption_coverage)
        for chunk in uncovered_chunks:
            if chunk.duration < args.min_uncovered:
                continue
            uncovered_activity.append(
                {
                    **interval_to_json(chunk),
                    "previous_caption": nearby_caption_text(captions, chunk.start, before=True),
                    "next_caption": nearby_caption_text(captions, chunk.end, before=False),
                }
            )

    caption_gaps = []
    for previous, current in zip(captions, captions[1:]):
        gap = current.start - previous.end
        if gap >= args.min_gap:
            caption_gaps.append(
                {
                    "after_index": previous.index,
                    "before_index": current.index,
                    "start": round(previous.end, 3),
                    "end": round(current.start, 3),
                    "duration": round(gap, 3),
                    "start_time": seconds_to_timestamp(previous.end),
                    "end_time": seconds_to_timestamp(current.start),
                    "next_text": current.text,
                }
            )

    first_activity_before_caption = []
    if activity and captions:
        first_caption_start = captions[0].start
        for active_interval in activity:
            if active_interval.start >= first_caption_start:
                break
            chunk = Interval(active_interval.start, min(active_interval.end, first_caption_start))
            if chunk.duration >= args.min_uncovered:
                first_activity_before_caption.append(interval_to_json(chunk))

    long_captions = [segment_to_json(segment) for segment in captions if segment.duration > args.max_caption_duration]

    return {
        "metadata": {
            "media": str(media_path),
            "captions": str(captions_path),
            "media_duration": round(duration, 3),
            "media_duration_time": seconds_to_timestamp(duration),
            "caption_segments": len(captions),
            "silence_detector": {
                "tool": "ffmpeg silencedetect",
                "noise": args.noise,
                "silence_duration": args.silence_duration,
                "min_activity": args.min_activity,
                "caption_padding": args.caption_padding,
                "min_uncovered": args.min_uncovered,
            },
        },
        "summary": {
            "uncovered_activity_count": len(uncovered_activity),
            "caption_gap_count": len(caption_gaps),
            "long_caption_count": len(long_captions),
            "invalid_caption_count": len(invalid_captions),
            "caption_overlap_count": len(caption_overlaps),
            "first_activity_before_caption_count": len(first_activity_before_caption),
        },
        "findings": {
            "uncovered_activity": uncovered_activity,
            "caption_gaps": caption_gaps,
            "long_captions": long_captions,
            "invalid_captions": [segment_to_json(segment) for segment in invalid_captions],
            "caption_overlaps": caption_overlaps,
            "first_activity_before_first_caption": first_activity_before_caption,
        },
    }


def print_text_report(report: dict) -> None:
    metadata = report["metadata"]
    summary = report["summary"]
    findings = report["findings"]
    print("Caption coverage audit")
    print(f"Media: {metadata['media']}")
    print(f"Captions: {metadata['captions']}")
    print(f"Duration: {metadata['media_duration_time']} ({metadata['media_duration']}s)")
    print(f"Segments: {metadata['caption_segments']}")
    print("")
    print("Summary")
    for key, value in summary.items():
        print(f"  {key}: {value}")

    sections = [
        ("Possible missed speech / uncovered audio activity", findings["uncovered_activity"]),
        ("Long caption gaps", findings["caption_gaps"]),
        ("Long captions", findings["long_captions"]),
        ("Audio activity before first caption", findings["first_activity_before_first_caption"]),
        ("Invalid captions", findings["invalid_captions"]),
        ("Caption overlaps", findings["caption_overlaps"]),
    ]
    for title, items in sections:
        print("")
        print(title)
        if not items:
            print("  none")
            continue
        for item in items:
            if "start_time" in item and "end_time" in item:
                line = f"  {item['start_time']} - {item['end_time']} ({item['duration']}s)"
                if "index" in item:
                    line += f" caption #{item['index']}"
                if "after_index" in item:
                    line += f" after #{item['after_index']} before #{item['before_index']}"
                print(line)
                if item.get("text"):
                    print(f"    text: {item['text']}")
                if item.get("next_text"):
                    print(f"    next: {item['next_text']}")
                if item.get("previous_caption"):
                    print(f"    prev: {item['previous_caption']}")
                if item.get("next_caption"):
                    print(f"    next: {item['next_caption']}")
            elif "previous" in item and "current" in item:
                print(f"  overlap {item['overlap']}s: #{item['previous']['index']} -> #{item['current']['index']}")


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Audit caption coverage against non-silent audio activity.")
    parser.add_argument("media", help="Audio or video file to inspect")
    parser.add_argument("captions", help="Caption JSON, SRT, or VTT file")
    parser.add_argument("--noise", default="-35dB", help="ffmpeg silencedetect noise threshold, e.g. -35dB")
    parser.add_argument("--silence-duration", type=float, default=0.6, help="Minimum silence duration for silencedetect")
    parser.add_argument("--min-activity", type=float, default=0.75, help="Ignore non-silent regions shorter than this")
    parser.add_argument("--caption-padding", type=float, default=0.25, help="Pad caption intervals during coverage comparison")
    parser.add_argument("--min-uncovered", type=float, default=2.0, help="Report uncovered activity at least this long")
    parser.add_argument("--min-gap", type=float, default=6.0, help="Report caption gaps at least this long")
    parser.add_argument("--max-caption-duration", type=float, default=8.0, help="Report captions longer than this")
    parser.add_argument("--overlap-tolerance", type=float, default=0.05, help="Allowed caption overlap before reporting")
    parser.add_argument("--format", choices=["text", "json"], default="text")
    parser.add_argument("--output", help="Write the report to this path")
    return parser


def main() -> int:
    args = build_parser().parse_args()
    try:
        report = build_report(args)
    except subprocess.CalledProcessError as error:
        if error.stderr:
            print(error.stderr, file=sys.stderr)
        raise SystemExit(error.returncode) from error

    if args.format == "json":
        rendered = json.dumps(report, ensure_ascii=False, indent=2) + "\n"
    else:
        from io import StringIO

        buffer = StringIO()
        stdout = sys.stdout
        try:
            sys.stdout = buffer
            print_text_report(report)
        finally:
            sys.stdout = stdout
        rendered = buffer.getvalue()

    if args.output:
        Path(args.output).expanduser().resolve().write_text(rendered, encoding="utf-8")
    else:
        print(rendered, end="")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
