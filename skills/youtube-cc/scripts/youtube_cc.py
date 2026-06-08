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


def contains_cjk(value: str) -> bool:
    return re.search(r"[\u3040-\u30ff\u3400-\u9fff]", value) is not None


def join_caption_words(words: list[str], *, language: str | None) -> str:
    if language in {"zh", "ja", "yue"} or any(contains_cjk(word) for word in words):
        return "".join(words).strip()
    return " ".join(words).strip()


def split_whisperx_word_segments(
    raw_words: list[dict],
    *,
    language: str | None,
    max_duration: float,
    max_chars: int,
) -> list[CaptionSegment]:
    segments: list[CaptionSegment] = []
    chunk_words: list[str] = []
    chunk_start: float | None = None
    chunk_end: float | None = None

    def flush() -> None:
        nonlocal chunk_words, chunk_start, chunk_end
        if chunk_start is None or chunk_end is None or not chunk_words:
            return
        text = join_caption_words(chunk_words, language=language)
        if text:
            segments.append(CaptionSegment(index=len(segments) + 1, start=chunk_start, end=chunk_end, text=text))
        chunk_words = []
        chunk_start = None
        chunk_end = None

    for raw_word in raw_words:
        if not isinstance(raw_word, dict):
            continue
        word = str(raw_word.get("word", "")).strip()
        start = raw_word.get("start")
        end = raw_word.get("end")
        if not word or start is None or end is None:
            continue
        word_start = float(start)
        word_end = float(end)
        if word_end <= word_start:
            continue

        candidate_words = [*chunk_words, word]
        candidate_text = join_caption_words(candidate_words, language=language)
        candidate_start = chunk_start if chunk_start is not None else word_start
        candidate_duration = word_end - candidate_start
        if chunk_words and (candidate_duration > max_duration or len(candidate_text) > max_chars):
            flush()

        if chunk_start is None:
            chunk_start = word_start
        chunk_words.append(word)
        chunk_end = word_end
    flush()
    return segments


def parse_whisperx_json(path: Path, args: argparse.Namespace) -> tuple[list[CaptionSegment], dict]:
    payload = json.loads(path.read_text(encoding="utf-8"))
    language = payload.get("language")
    word_segments = payload.get("word_segments")
    if isinstance(word_segments, list):
        segments = split_whisperx_word_segments(
            word_segments,
            language=language,
            max_duration=args.max_segment_duration,
            max_chars=args.max_segment_chars,
        )
        if segments:
            return segments, {
                "language": language,
                "whisperx_json": str(path),
                "whisperx_segment_source": "word_segments",
                "max_segment_duration": args.max_segment_duration,
                "max_segment_chars": args.max_segment_chars,
            }

    raw_segments = payload.get("segments")
    if not isinstance(raw_segments, list):
        raise RuntimeError(f"WhisperX JSON did not contain a segments array: {path}")

    segments: list[CaptionSegment] = []
    for raw_segment in raw_segments:
        if not isinstance(raw_segment, dict):
            continue
        text = str(raw_segment.get("text", "")).strip()
        start = raw_segment.get("start")
        end = raw_segment.get("end")
        if not text or start is None or end is None:
            continue
        segments.append(
            CaptionSegment(
                index=len(segments) + 1,
                start=float(start),
                end=float(end),
                text=text,
            )
        )
    return segments, {
        "language": language,
        "whisperx_json": str(path),
        "whisperx_segment_source": "segments",
    }


def transcribe_whisperx(audio_path: Path, work_dir: Path, args: argparse.Namespace) -> tuple[list[CaptionSegment], dict]:
    if not shutil.which("whisperx"):
        raise SystemExit("Missing whisperx. Run with: uv run --with whisperx --with yt-dlp python scripts/youtube_cc.py ...")
    require_tool("ffmpeg")
    output_dir = work_dir / "whisperx"
    output_dir.mkdir(parents=True, exist_ok=True)

    cmd = [
        "whisperx",
        str(audio_path),
        "--model",
        args.model,
        "--device",
        args.device,
        "--compute_type",
        args.compute_type,
        "--batch_size",
        str(args.whisperx_batch_size),
        "--task",
        args.task,
        "--output_dir",
        str(output_dir),
        "--output_format",
        "json",
        "--vad_method",
        args.whisperx_vad_method,
        "--segment_resolution",
        args.whisperx_segment_resolution,
        "--beam_size",
        str(args.beam_size),
    ]
    if args.asr_language != "auto":
        cmd.extend(["--language", args.asr_language])
    if args.whisperx_align_model:
        cmd.extend(["--align_model", args.whisperx_align_model])
    if args.condition_on_previous_text:
        cmd.extend(["--condition_on_previous_text", "True"])
    if args.whisperx_model_dir:
        cmd.extend(["--model_dir", args.whisperx_model_dir])

    run(cmd, capture=False)
    json_path = output_dir / f"{audio_path.stem}.json"
    if not json_path.exists():
        candidates = sorted(output_dir.glob("*.json"), key=lambda path: path.stat().st_mtime)
        if not candidates:
            raise RuntimeError("WhisperX did not produce a JSON transcript")
        json_path = candidates[-1]

    segments, metadata = parse_whisperx_json(json_path, args)
    return segments, {
        "backend": "whisperx",
        "model": args.model,
        "vad_method": args.whisperx_vad_method,
        "segment_resolution": args.whisperx_segment_resolution,
        "align_model": args.whisperx_align_model,
        **metadata,
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
    parser.add_argument("--backend", choices=["whisperx", "faster-whisper", "whisper-cpp"], default="whisperx")
    parser.add_argument("--model", default="small", help="ASR model name or local model path")
    parser.add_argument("--device", default="cpu", help="ASR device: cpu, cuda, or auto for faster-whisper")
    parser.add_argument("--compute-type", default="int8", help="ASR compute type, e.g. default, int8, float16")
    parser.add_argument("--asr-language", default="auto", help="Spoken language for ASR, e.g. auto, en, zh, ja")
    parser.add_argument("--task", choices=["transcribe", "translate"], default="transcribe")
    parser.add_argument("--beam-size", type=int, default=5)
    parser.add_argument("--max-segment-duration", type=float, default=6.0, help="Maximum generated caption duration in seconds")
    parser.add_argument("--max-segment-chars", type=int, default=42, help="Maximum generated caption text length before splitting")
    parser.add_argument("--no-vad", action="store_true", help="Disable faster-whisper VAD")
    parser.add_argument("--condition-on-previous-text", action="store_true", help="Enable Whisper previous-text conditioning")
    parser.add_argument("--whisperx-batch-size", type=int, default=8, help="WhisperX batch size")
    parser.add_argument("--whisperx-vad-method", choices=["silero", "pyannote"], default="silero", help="WhisperX VAD method")
    parser.add_argument(
        "--whisperx-segment-resolution",
        choices=["sentence", "chunk"],
        default="sentence",
        help="WhisperX caption segment resolution",
    )
    parser.add_argument("--whisperx-align-model", help="Optional WhisperX alignment model override")
    parser.add_argument("--whisperx-model-dir", help="Optional WhisperX model cache directory")
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

                if args.backend == "whisperx":
                    segments, asr_metadata = transcribe_whisperx(audio_path, work_dir, args)
                elif args.backend == "faster-whisper":
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

            if args.backend == "whisperx":
                segments, asr_metadata = transcribe_whisperx(audio_path, work_dir, args)
            elif args.backend == "faster-whisper":
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
