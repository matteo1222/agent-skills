#!/usr/bin/env python3
"""Create SRT/VTT/JSON captions from a YouTube URL."""

from __future__ import annotations

import argparse
import dataclasses
import datetime as dt
import json
import re
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path
from typing import Iterable


@dataclasses.dataclass
class CaptionSegment:
    index: int
    start: float
    end: float
    text: str


def require_tool(name: str) -> str:
    path = shutil.which(name)
    if not path:
        raise SystemExit(f"Missing required tool: {name}")
    return path


def run(cmd: list[str], *, cwd: Path | None = None, capture: bool = True) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        cmd,
        cwd=str(cwd) if cwd else None,
        check=True,
        text=True,
        stdout=subprocess.PIPE if capture else None,
        stderr=subprocess.PIPE if capture else None,
    )


def slugify(value: str, fallback: str = "youtube-video") -> str:
    value = re.sub(r"[^\w\s.-]", "", value, flags=re.UNICODE)
    value = re.sub(r"\s+", "-", value.strip())
    value = value.strip(".-_")
    return value[:120] or fallback


def fetch_info(url: str) -> dict:
    require_tool("yt-dlp")
    result = run(["yt-dlp", "-J", "--no-playlist", "--no-warnings", url])
    return json.loads(result.stdout)


def split_patterns(value: str) -> list[str]:
    return [item.strip() for item in value.split(",") if item.strip()]


def matches_language(pattern: str, language: str) -> bool:
    if pattern == "all":
        return language != "live_chat"
    if pattern.startswith("-"):
        return False
    return language == pattern or re.fullmatch(pattern, language) is not None


def excluded(patterns: Iterable[str], language: str) -> bool:
    return any(pattern.startswith("-") and matches_language(pattern[1:], language) for pattern in patterns)


def choose_caption(info: dict, caption_langs: str) -> tuple[str, str] | None:
    patterns = split_patterns(caption_langs)
    sources = [
        ("manual", info.get("subtitles") or {}),
        ("auto", info.get("automatic_captions") or {}),
    ]
    for source_name, captions in sources:
        languages = sorted(language for language in captions if language != "live_chat")
        for pattern in patterns:
            if pattern.startswith("-"):
                continue
            for language in languages:
                if excluded(patterns, language):
                    continue
                if matches_language(pattern, language):
                    return source_name, language
    return None


def base_name(info: dict) -> str:
    video_id = info.get("id") or "video"
    title = info.get("title") or video_id
    return slugify(f"{title}-{video_id}")


def download_existing_caption(url: str, output_dir: Path, base: str, source: str, language: str) -> Path:
    require_tool("ffmpeg")
    before = {path.resolve() for path in output_dir.glob(f"{base}*")}
    cmd = [
        "yt-dlp",
        "--skip-download",
        "--no-playlist",
        "--no-warnings",
        "--sub-langs",
        language,
        "--sub-format",
        "srt/vtt/best",
        "--convert-subs",
        "srt",
        "-o",
        str(output_dir / f"{base}.%(ext)s"),
    ]
    cmd.append("--write-subs" if source == "manual" else "--write-auto-subs")
    cmd.append(url)
    run(cmd, capture=False)
    candidates = [
        path
        for path in output_dir.glob(f"{base}*.srt")
        if path.resolve() not in before or path.name == f"{base}.{language}.srt"
    ]
    if not candidates:
        raise RuntimeError(f"yt-dlp did not produce an SRT caption for {language}")
    return max(candidates, key=lambda path: path.stat().st_mtime)


def download_audio(url: str, work_dir: Path, base: str) -> Path:
    require_tool("ffmpeg")
    before = {path.resolve() for path in work_dir.glob(f"{base}*")}
    cmd = [
        "yt-dlp",
        "--no-playlist",
        "--no-warnings",
        "-f",
        "bestaudio/best",
        "-x",
        "--audio-format",
        "m4a",
        "--audio-quality",
        "0",
        "-o",
        str(work_dir / f"{base}.%(ext)s"),
        url,
    ]
    run(cmd, capture=False)
    candidates = [path for path in work_dir.glob(f"{base}.*") if path.resolve() not in before]
    audio_candidates = [path for path in candidates if path.suffix.lower() in {".m4a", ".mp3", ".opus", ".wav", ".flac"}]
    if not audio_candidates:
        raise RuntimeError("yt-dlp did not produce an audio file")
    return max(audio_candidates, key=lambda path: path.stat().st_mtime)


def seconds_to_timestamp(seconds: float, *, srt: bool) -> str:
    seconds = max(0, seconds)
    millis = int(round(seconds * 1000))
    hours, remainder = divmod(millis, 3_600_000)
    minutes, remainder = divmod(remainder, 60_000)
    secs, millis = divmod(remainder, 1000)
    separator = "," if srt else "."
    return f"{hours:02d}:{minutes:02d}:{secs:02d}{separator}{millis:03d}"


def timestamp_to_seconds(value: str) -> float:
    match = re.fullmatch(r"(\d{2}):(\d{2}):(\d{2})[,.](\d{3})", value.strip())
    if not match:
        raise ValueError(f"Invalid timestamp: {value}")
    hours, minutes, seconds, millis = (int(part) for part in match.groups())
    return hours * 3600 + minutes * 60 + seconds + millis / 1000


def parse_srt(path: Path) -> list[CaptionSegment]:
    text = path.read_text(encoding="utf-8-sig")
    blocks = re.split(r"\n\s*\n", text.strip())
    segments: list[CaptionSegment] = []
    for block in blocks:
        lines = [line.strip("\ufeff") for line in block.splitlines() if line.strip()]
        if len(lines) < 2:
            continue
        time_line_index = 1 if re.fullmatch(r"\d+", lines[0]) else 0
        if time_line_index >= len(lines) or "-->" not in lines[time_line_index]:
            continue
        start_raw, end_raw = [part.strip().split()[0] for part in lines[time_line_index].split("-->", 1)]
        caption_text = " ".join(line.strip() for line in lines[time_line_index + 1 :]).strip()
        if caption_text:
            segments.append(
                CaptionSegment(
                    index=len(segments) + 1,
                    start=timestamp_to_seconds(start_raw),
                    end=timestamp_to_seconds(end_raw),
                    text=caption_text,
                )
            )
    return segments


def write_srt(path: Path, segments: list[CaptionSegment]) -> None:
    chunks = []
    for index, segment in enumerate(segments, start=1):
        chunks.append(
            "\n".join(
                [
                    str(index),
                    f"{seconds_to_timestamp(segment.start, srt=True)} --> {seconds_to_timestamp(segment.end, srt=True)}",
                    segment.text,
                ]
            )
        )
    path.write_text("\n\n".join(chunks) + "\n", encoding="utf-8")


def write_vtt(path: Path, segments: list[CaptionSegment]) -> None:
    chunks = ["WEBVTT\n"]
    for segment in segments:
        chunks.append(
            "\n".join(
                [
                    f"{seconds_to_timestamp(segment.start, srt=False)} --> {seconds_to_timestamp(segment.end, srt=False)}",
                    segment.text,
                ]
            )
        )
    path.write_text("\n\n".join(chunks) + "\n", encoding="utf-8")


def write_json(path: Path, segments: list[CaptionSegment], metadata: dict) -> None:
    payload = {
        "metadata": metadata,
        "segments": [dataclasses.asdict(segment) for segment in segments],
    }
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def transcribe_faster_whisper(audio_path: Path, args: argparse.Namespace) -> tuple[list[CaptionSegment], dict]:
    try:
        from faster_whisper import WhisperModel
    except ImportError as error:
        raise SystemExit("Missing faster-whisper. Install with: python3 -m pip install faster-whisper") from error

    model = WhisperModel(args.model, device=args.device, compute_type=args.compute_type)
    language = None if args.asr_language == "auto" else args.asr_language
    segments_iter, info = model.transcribe(
        str(audio_path),
        beam_size=args.beam_size,
        language=language,
        task=args.task,
        vad_filter=not args.no_vad,
        condition_on_previous_text=args.condition_on_previous_text,
    )
    segments = [
        CaptionSegment(index=index, start=segment.start, end=segment.end, text=segment.text.strip())
        for index, segment in enumerate(segments_iter, start=1)
        if segment.text.strip()
    ]
    return segments, {
        "backend": "faster-whisper",
        "model": args.model,
        "language": getattr(info, "language", None),
        "language_probability": getattr(info, "language_probability", None),
    }


def transcribe_whisper_cpp(audio_path: Path, work_dir: Path, output_base: Path, args: argparse.Namespace) -> tuple[list[CaptionSegment], dict]:
    require_tool("whisper-cli")
    require_tool("ffmpeg")
    if not args.whisper_cpp_model:
        raise SystemExit("--whisper-cpp-model is required when --backend whisper-cpp")
    wav_path = work_dir / f"{output_base.name}.wav"
    run(
        [
            "ffmpeg",
            "-y",
            "-i",
            str(audio_path),
            "-ar",
            "16000",
            "-ac",
            "1",
            "-c:a",
            "pcm_s16le",
            str(wav_path),
        ],
        capture=False,
    )
    cmd = [
        "whisper-cli",
        "-m",
        args.whisper_cpp_model,
        "-f",
        str(wav_path),
        "-osrt",
        "-of",
        str(output_base),
        "-np",
    ]
    if args.asr_language != "auto":
        cmd.extend(["-l", args.asr_language])
    if args.task == "translate":
        cmd.append("--translate")
    run(cmd, capture=False)
    srt_path = output_base.with_suffix(".srt")
    if not srt_path.exists():
        raise RuntimeError("whisper-cli did not produce an SRT file")
    return parse_srt(srt_path), {
        "backend": "whisper.cpp",
        "model": args.whisper_cpp_model,
        "language": args.asr_language,
    }


def emit_outputs(output_dir: Path, base: str, segments: list[CaptionSegment], metadata: dict, fmt: str) -> dict[str, str]:
    output_base = output_dir / base
    written: dict[str, str] = {}
    if fmt in {"srt", "all"}:
        srt_path = output_base.with_suffix(".srt")
        write_srt(srt_path, segments)
        written["srt"] = str(srt_path)
    if fmt in {"vtt", "all"}:
        vtt_path = output_base.with_suffix(".vtt")
        write_vtt(vtt_path, segments)
        written["vtt"] = str(vtt_path)
    json_path = output_base.with_suffix(".json")
    write_json(json_path, segments, metadata)
    written["json"] = str(json_path)
    return written


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Create timestamped captions from a YouTube URL.")
    parser.add_argument("url", help="YouTube URL")
    parser.add_argument("--output-dir", default="youtube-cc-output", help="Directory for generated captions")
    parser.add_argument("--caption-langs", default="en.*,zh.*", help='yt-dlp language patterns, e.g. "zh.*,en.*"')
    parser.add_argument("--format", choices=["srt", "vtt", "all"], default="all", help="Caption format to write")
    parser.add_argument("--mode", choices=["prefer-existing", "existing-only", "transcribe"], default="prefer-existing")
    parser.add_argument("--backend", choices=["faster-whisper", "whisper-cpp"], default="faster-whisper")
    parser.add_argument("--model", default="small", help="faster-whisper model name or local model path")
    parser.add_argument("--device", default="auto", help="faster-whisper device: auto, cpu, cuda")
    parser.add_argument("--compute-type", default="default", help="faster-whisper compute type, e.g. default, int8, float16")
    parser.add_argument("--asr-language", default="auto", help="Spoken language for ASR, e.g. auto, en, zh, ja")
    parser.add_argument("--task", choices=["transcribe", "translate"], default="transcribe")
    parser.add_argument("--beam-size", type=int, default=5)
    parser.add_argument("--no-vad", action="store_true", help="Disable faster-whisper VAD")
    parser.add_argument("--condition-on-previous-text", action="store_true", help="Enable Whisper previous-text conditioning")
    parser.add_argument("--whisper-cpp-model", help="Path to ggml model for whisper-cli")
    parser.add_argument("--keep-audio", action="store_true", help="Copy downloaded audio into the output directory")
    return parser


def main() -> int:
    args = build_parser().parse_args()
    output_dir = Path(args.output_dir).expanduser().resolve()
    output_dir.mkdir(parents=True, exist_ok=True)

    info = fetch_info(args.url)
    base = base_name(info)
    metadata = {
        "source_url": args.url,
        "video_id": info.get("id"),
        "title": info.get("title"),
        "created_at": dt.datetime.now(dt.UTC).isoformat(),
        "mode": args.mode,
    }

    segments: list[CaptionSegment]
    if args.mode != "transcribe":
        choice = choose_caption(info, args.caption_langs)
        if choice:
            source, language = choice
            srt_path = download_existing_caption(args.url, output_dir, base, source, language)
            segments = parse_srt(srt_path)
            metadata.update({"source": f"youtube-{source}-caption", "caption_language": language})
        elif args.mode == "existing-only":
            raise SystemExit("No matching YouTube captions found. Try --mode transcribe.")
        else:
            with tempfile.TemporaryDirectory(prefix=f"{base}.", dir=str(output_dir)) as temp_name:
                work_dir = Path(temp_name)
                audio_path = download_audio(args.url, work_dir, base)
                if args.keep_audio:
                    kept_audio = output_dir / f"{base}{audio_path.suffix}"
                    shutil.copy2(audio_path, kept_audio)
                    metadata["audio_path"] = str(kept_audio)

                if args.backend == "faster-whisper":
                    segments, asr_metadata = transcribe_faster_whisper(audio_path, args)
                else:
                    segments, asr_metadata = transcribe_whisper_cpp(audio_path, work_dir, output_dir / base, args)
            metadata.update({"source": "local-asr", **asr_metadata})
    else:
        with tempfile.TemporaryDirectory(prefix=f"{base}.", dir=str(output_dir)) as temp_name:
            work_dir = Path(temp_name)
            audio_path = download_audio(args.url, work_dir, base)
            if args.keep_audio:
                kept_audio = output_dir / f"{base}{audio_path.suffix}"
                shutil.copy2(audio_path, kept_audio)
                metadata["audio_path"] = str(kept_audio)

            if args.backend == "faster-whisper":
                segments, asr_metadata = transcribe_faster_whisper(audio_path, args)
            else:
                segments, asr_metadata = transcribe_whisper_cpp(audio_path, work_dir, output_dir / base, args)
        metadata.update({"source": "local-asr", **asr_metadata})

    written = emit_outputs(output_dir, base, segments, metadata, args.format)
    print(json.dumps({"status": "ok", "outputs": written, "metadata": metadata}, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except subprocess.CalledProcessError as error:
        if error.stderr:
            print(error.stderr, file=sys.stderr)
        raise SystemExit(error.returncode)
