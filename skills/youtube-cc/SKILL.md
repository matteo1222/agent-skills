---
name: youtube-cc
description: Create, translate, preview, and validate timed caption/subtitle files from YouTube videos. Use when Codex needs to generate YouTube CC, subtitles, 字幕, translated subtitles, SRT, VTT, or timestamped transcript JSON from a YouTube URL by reusing existing captions with yt-dlp or transcribing downloaded audio locally with faster-whisper or whisper.cpp.
---

# YouTube CC

Create timed YouTube caption files from a video URL. Prefer existing YouTube captions first; use local ASR only when captions are missing, low quality, or the user asks for a fresh transcription. Treat ASR output as a draft: verify, correct obvious mistakes, ask the user to resolve uncertain terms, then render final or translated captions.

## Quick Start

```bash
python3 {baseDir}/scripts/youtube_cc.py "https://www.youtube.com/watch?v=VIDEO_ID" --format all
```

Useful variants:

```bash
# Prefer Chinese captions if present, then English.
python3 {baseDir}/scripts/youtube_cc.py URL --caption-langs "zh.*,en.*" --format all

# Force local transcription instead of downloading existing captions.
python3 {baseDir}/scripts/youtube_cc.py URL --mode transcribe --backend faster-whisper --model small --format srt

# Use whisper.cpp when a local whisper-cli model is already installed.
python3 {baseDir}/scripts/youtube_cc.py URL --mode transcribe --backend whisper-cpp --whisper-cpp-model /path/to/ggml-model.bin

# Create a preview page that renders captions itself, so browser CC controls are not required.
python3 {baseDir}/scripts/make_preview.py video.mp4 captions.vtt --output preview.html

# Compare raw, corrected, and translated caption tracks in one preview.
python3 {baseDir}/scripts/make_preview.py video.mp4 --track "Raw ASR=raw.vtt" --track "Proofread zh=corrected.vtt" --track "English=translated.en.vtt" --output preview.html

# Render translated JSON created by the agent back to SRT/VTT.
python3 {baseDir}/scripts/render_captions.py translated.en.json --format all
```

## Workflow

1. Resolve the YouTube URL with `yt-dlp -J` and identify available manual and automatic captions.
2. If `--mode prefer-existing`, download the best matching manual caption first, then auto caption, using `--write-subs` or `--write-auto-subs`.
3. If no acceptable caption exists, extract audio with `yt-dlp -x` and transcribe locally.
4. Proofread and correct the source caption JSON before final output. Normalize repeated names, places, brands, technical terms, and homophones.
5. If any term is vague, ambiguous, or not safely inferable, ask the user with a compact decision list before applying that correction.
6. If the user asked for translated captions, confirm the target language first. Translate the corrected source segments yourself as the AI agent while preserving `index`, `start`, and `end`.
7. Emit the requested caption files:
   - `.srt` for YouTube upload and broad editor support
   - `.vtt` for web preview and HTML video
   - `.json` for structured `{start, end, text}` review/editing
8. For preview, prefer `scripts/make_preview.py`; it embeds caption text in the page and renders an always-visible overlay instead of depending on native browser subtitle controls.
9. If the user wants to publish captions, guide them through YouTube Studio upload or the YouTube Data API. They must own or have edit access to the channel/video.

## Tool Choices

- Use `faster-whisper` as the default ASR backend. It is fast, Python-friendly, supports VAD, and returns segment timestamps directly.
- Use `whisper.cpp` when the machine already has `whisper-cli` plus a local GGML model, especially on Apple Silicon or CPU-only setups.
- Use existing YouTube captions when the user mainly needs a caption file, because manual captions usually beat ASR and auto captions are already timed.
- For translation to arbitrary target languages, the agent should translate `segments[].text` from the generated JSON in batches and then render the translated JSON with `scripts/render_captions.py`. Whisper's built-in `--task translate` is only suitable for English translation, not arbitrary target languages.

Read `references/tooling.md` only when choosing installs, models, backend tradeoffs, or troubleshooting missing tools.

## Requirements

Check tools before running:

```bash
command -v yt-dlp
command -v ffmpeg
python3 -c 'import faster_whisper'
```

For local ASR, install one backend:

```bash
python3 -m pip install faster-whisper
```

or provide a working `whisper-cli` plus a `ggml-*.bin` model path.

No translation API or local translator is required by default. Translation is performed by the AI agent using the generated JSON as the timing scaffold.

## Agent Review And Correction

Always run a correction pass before calling captions final, especially for local ASR.

1. Review the generated `.json` and preview page. Look for:
   - repeated entities with inconsistent spellings
   - place names, shop names, product names, people, brands, and technical terms
   - homophones that fit poorly in context
   - wrong script choice, such as Simplified Chinese mixed into Traditional Chinese output
   - long segments that hide missed speech or music/silence hallucinations
   - unexpected caption gaps during visible talking or voiceover
2. Web-search proper nouns when they are not already confirmed by the video title, description, on-screen text, or another reliable local source. Search exact candidate strings plus location/context words. Use search especially for restaurants, shops, temples, cafes, streets, people, brands, and technical terms. Record the source URL or source label in `metadata.corrections_applied` when a web result confirms the correction.
3. Apply obvious corrections directly when context or web search makes them safe. Examples: a video title says `北后寺`, so repeated `北後四`/`北厚市` should be corrected to `北后寺`; `Barnstay`/`Brain's Day` should become `Barn Stay` when the title or web results confirm it; `一鍋小食` should become `一酤小食` when web results confirm the Yilan bistro; `你好雞排` should become `您好雞排` when food delivery/search results confirm the shop.
4. Keep a glossary while reviewing. Use it consistently across source captions and translations.
5. Audit suspicious gaps before upgrading the whole model:
   - If a section has audible/visible speech but no caption, extract a short window around the gap.
   - Re-run ASR on that window with the same model and `--no-vad` or direct `vad_filter=False`.
   - Compare with the VAD-on output. VAD-off often recovers quiet speech at transitions, but can hallucinate during music or B-roll, so only merge lines that match audible speech.
   - Use a larger model (`medium` or `large-v3`) when the recovered text exists but wording/proper nouns are poor, or when the small model repeatedly misses speech even with targeted no-VAD windows.
   - Record recovered-gap notes in metadata.
6. When web search or gap re-transcription does not clearly resolve a term, stop and ask the user. Use this format:

   ```markdown
   I found a few ambiguous caption terms. Which should I use?

   | # | Time | Current text | My best guess | Why unsure |
   |---|------|--------------|---------------|------------|
   | 1 | 01:10 | 一鍋小食 | ? | Could be a restaurant name; ASR may be guessing the characters. |
   | 2 | 03:28 | 什麼什麼專家 | ? | Needs exact term if this matters for publication. |
   ```

7. After the user answers, create a corrected JSON sibling such as `captions.corrected.json`:
   - preserve every segment's `index`, `start`, and `end`
   - update only `text` unless timing is clearly wrong
   - add `metadata.review_status`, `metadata.corrections_applied`, and `metadata.unresolved_terms`
8. Render corrected captions:

   ```bash
   python3 {baseDir}/scripts/render_captions.py captions.corrected.json --format all
   ```

## Agent Translation

When the user asks for translated captions:

1. Ask for the target language if the user did not provide it.
2. Generate and correct source captions first. Do not translate raw ASR when obvious or unresolved source mistakes remain.
3. Read the corrected `.json` and create a translated JSON sibling:
   - Preserve `metadata`.
   - Add `metadata.translation_target` and `metadata.translation_source`.
   - Preserve every segment's `index`, `start`, and `end`.
   - Replace only `segments[].text` with the translation.
4. For long videos, translate in batches of 25-50 segments to preserve consistency and reduce mistakes. Reuse the reviewed glossary for names, places, brands, and technical terms.
5. Render the translated JSON:

   ```bash
   python3 {baseDir}/scripts/render_captions.py translated.en.json --format all
   ```

6. Preview the translated `.vtt` or `.srt` with `make_preview.py` and spot-check sync and meaning.

## Upload To YouTube

Use `.srt` for the default upload path. YouTube also supports `.vtt`, but `.srt` is the simplest and most broadly reliable caption format.

Manual upload in YouTube Studio:

1. Sign in to YouTube Studio.
2. Open `Subtitles` from the left menu.
3. Select the video.
4. Click `ADD LANGUAGE` and select the caption language.
5. Under `Subtitles`, click `ADD`.
6. Choose `Upload file`.
7. Select `With timing` because this skill generates timed `.srt`/`.vtt` files.
8. Choose the caption file and save/publish.

For this skill's common outputs:

- Source Traditional Chinese: upload `captions.corrected.zh-Hant.srt` as `Chinese (Traditional)`.
- English translation: upload `captions.translated.en.srt` as `English`.
- If the video already has a track for the same language/name, edit/replace it in Studio or use a distinct track name.

Automated upload is possible with the YouTube Data API `captions.insert`, but only when the user has OAuth credentials and permission for the target video. The API requires `snippet.videoId`, `snippet.language`, `snippet.name`, media upload of the caption file, and costs 400 quota units per insert. Do not attempt API upload unless the user explicitly asks and provides/authorizes credentials.

Official references:

- YouTube Help: `https://support.google.com/youtube/answer/2734796`
- Supported caption file formats: `https://support.google.com/youtube/answer/2734698`
- YouTube Data API captions.insert: `https://developers.google.com/youtube/v3/docs/captions/insert`

## Quality Notes

- Verify captions in a player before calling the job done. At minimum, spot-check first speech, one middle section, and one late section for sync and proper nouns.
- Do not silently guess uncertain names or terms. If the correction affects meaning, branding, place names, medical/legal/technical language, or a title-card entity, ask the user.
- Use web search to verify proper nouns before asking the user, but do not overfit to a weak search result. If multiple plausible spellings remain, show the evidence and ask.
- Ask for the desired language when it is ambiguous. Use `--caption-langs "zh.*,en.*"` for Chinese-first caption discovery.
- Ask for the target language when the user says "translate" without naming one. Use natural names such as `English`, `Japanese`, `Traditional Chinese`, or locale tags such as `zh-Hant`.
- Use `--asr-language zh` or `--asr-language en` when the spoken language is known; otherwise leave auto-detection on.
- Use `--model medium` or `--model large-v3` for publish-quality captions when runtime is acceptable. Use `small` for quick drafts.
- For long videos, inspect the `.json` output for repeated phrases or obvious hallucinations before treating the caption file as final.

## Verification

When the user asks to test or validate the captions:

1. Download a local preview copy of the video, using a current `yt-dlp` if the system install gets YouTube `403` errors.

   ```bash
   uv run --with yt-dlp yt-dlp URL -f "bestvideo[height<=720]+bestaudio/best[height<=720]/best" --merge-output-format mp4 -o "video.%(ext)s"
   ```

2. Create a self-rendering browser preview. This avoids browser-native caption controls hiding the subtitles.

   ```bash
   python3 {baseDir}/scripts/make_preview.py video.mp4 captions.vtt --output preview.html
   ```

   To compare versions:

   ```bash
   python3 {baseDir}/scripts/make_preview.py video.mp4 --track "Raw ASR=raw.vtt" --track "Proofread zh=corrected.vtt" --track "English=translated.en.vtt" --output preview.html
   ```

3. For quick review, create short hard-subtitled clips so the user can just press play:

   ```bash
   ffmpeg -y -ss 39 -t 20 -i video.mp4 -vf subtitles=captions.srt -c:v libx264 -c:a aac sample-0039.mp4
   ffmpeg -y -ss 300 -t 20 -i video.mp4 -vf subtitles=captions.srt -c:v libx264 -c:a aac sample-0500.mp4
   ffmpeg -y -ss 600 -t 20 -i video.mp4 -vf subtitles=captions.srt -c:v libx264 -c:a aac sample-1000.mp4
   ```

4. Report quality honestly: distinguish rendering/sync success from transcript accuracy. ASR drafts often need cleanup for place names, brand names, homophones, and quiet speech.
