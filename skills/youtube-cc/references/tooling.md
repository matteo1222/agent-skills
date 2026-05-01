# YouTube CC Tooling Notes

Research snapshot: 2026-05-01.

## Recommended Stack

1. `yt-dlp` for metadata, caption download, and audio extraction.
2. `faster-whisper` for the default local ASR path.
3. `whisper.cpp` as a fallback for Apple Silicon, CPU-only, or preinstalled `whisper-cli` workflows.

## Why This Stack

- `yt-dlp` supports downloading manual subtitles, auto-generated subtitles, language selection, subtitle formats, and audio extraction with ffmpeg.
- `faster-whisper` is a CTranslate2 implementation of Whisper, advertises much faster inference than OpenAI Whisper at similar accuracy, and supports VAD plus word/segment timestamps.
- `whisper.cpp` is lightweight C/C++, has Apple Silicon/Metal support, CPU-only support, and can output SRT/VTT/JSON from `whisper-cli`.

## Install Cheatsheet

macOS:

```bash
brew install yt-dlp ffmpeg
python3 -m pip install faster-whisper
```

If using whisper.cpp, install or build `whisper-cli`, download a model, then pass:

```bash
--backend whisper-cpp --whisper-cpp-model /path/to/ggml-model.bin
```

## Backend Selection

- `faster-whisper`, `model=small`: quick drafts, low memory.
- `faster-whisper`, `model=medium`: balanced quality/runtime.
- `faster-whisper`, `model=large-v3` or `turbo`: better quality when runtime and memory allow.
- `whisper.cpp`: use when Python packages are inconvenient or the user already has a compiled local binary and GGML model.

## Source Pointers

- yt-dlp README: subtitle options include `--write-subs`, `--write-auto-subs`, `--sub-format`, `--sub-langs`; post-processing includes `-x --extract-audio`.
- SYSTRAN faster-whisper README: CTranslate2 implementation, VAD, word timestamps, int8/float16 options, batched transcription.
- ggml-org whisper.cpp README and CLI README: Apple Silicon/CPU support and `whisper-cli` outputs including SRT, VTT, CSV, and JSON.
