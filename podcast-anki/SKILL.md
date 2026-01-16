---
name: podcast-anki
description: Convert podcasts to transcriptions and generate Anki flashcards for deep learning
tools: [transcribe, generate-cards, export]
---

# Podcast to Anki

Convert any podcast into comprehensive Anki flashcards for deep understanding.

## Pipeline

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Podcast   │ ──▶ │  Download   │ ──▶ │ Transcribe  │ ──▶ │ Generate    │
│  URL/File   │     │   Audio     │     │  (Whisper)  │     │ Anki Cards  │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
                                                                   │
                                              ┌────────────────────┘
                                              ▼
                                        ┌─────────────┐
                                        │  Export     │
                                        │  .apkg/.txt │
                                        └─────────────┘
```

## Supported Sources

| Source | How to Get Audio |
|--------|------------------|
| **YouTube** | yt-dlp (audio extract) |
| **Spotify** | spotdl or spotify-dl |
| **Apple Podcasts** | Direct RSS feed URL |
| **Any Podcast** | RSS feed → audio URL |
| **Direct URL** | curl/wget |
| **Local file** | Direct path |

## Prerequisites

```bash
# Audio download
pip install yt-dlp spotdl

# Transcription (Groq Whisper - fast & cheap)
export GROQ_API_KEY="your-key"

# Or local Whisper
pip install openai-whisper

# Card generation (Claude/GPT)
export ANTHROPIC_API_KEY="your-key"

# Anki export
pip install genanki
```

## Usage

### Basic Usage

```bash
# From YouTube
node podcast-anki.js --url "https://youtube.com/watch?v=xxx" --lang en

# From Spotify
node podcast-anki.js --url "https://open.spotify.com/episode/xxx" --lang en

# From local file
node podcast-anki.js --file "podcast.mp3" --lang ja

# Japanese learning mode
node podcast-anki.js --url "https://youtube.com/watch?v=xxx" --lang ja --mode japanese
```

### Options

| Option | Description |
|--------|-------------|
| `--url <url>` | Podcast/video URL |
| `--file <path>` | Local audio file |
| `--lang <code>` | Language (en, ja, zh, etc.) |
| `--mode <type>` | Card mode: `concepts`, `vocab`, `japanese`, `qa` |
| `--output <path>` | Output file path |
| `--chunks` | Split into chunks for long podcasts |

## Card Generation Modes

### 1. Concepts Mode (Default)
For understanding complex topics:
```
Front: What is [concept]?
Back: [Explanation from podcast]

Front: Why does [X happen]?
Back: [Reason explained in podcast]

Front: How does [process] work?
Back: [Step-by-step from podcast]
```

### 2. Vocabulary Mode
For learning new terms:
```
Front: [Term]
Back: Definition: [...]
       Context: "[quote from podcast]"
       Example: [...]
```

### 3. Japanese Mode
For Japanese learning:
```
Front: [Japanese sentence from podcast]
Back: Reading: [furigana]
      Meaning: [English translation]
      Grammar: [Key grammar point]
      
Front: [Vocabulary word]
Back: 読み方: [reading]
      意味: [meaning]
      例文: [example sentence from podcast]
```

### 4. Q&A Mode
Question-answer pairs:
```
Front: [Question about content]
Back: [Answer based on podcast]
```

## Output Formats

### Anki Package (.apkg)
Ready to import directly into Anki.

### Tab-separated (.txt)
```
Front<tab>Back
Question 1<tab>Answer 1
Question 2<tab>Answer 2
```
Import into Anki: File → Import → Tab separated

### JSON
```json
{
  "cards": [
    {"front": "...", "back": "...", "tags": ["podcast", "topic"]},
    ...
  ]
}
```

## Example Workflow

### Learning from Japanese Podcast

```bash
# 1. Download & transcribe Japanese podcast
node podcast-anki.js \
  --url "https://www.youtube.com/watch?v=JAPANESE_VIDEO" \
  --lang ja \
  --mode japanese \
  --output japanese-lesson.txt

# 2. Import to Anki
# File → Import → Select japanese-lesson.txt
```

### Understanding Tech Podcast

```bash
# 1. Process Huberman Lab episode
node podcast-anki.js \
  --url "https://www.youtube.com/watch?v=HUBERMAN_EP" \
  --lang en \
  --mode concepts \
  --output huberman-sleep.apkg

# 2. Direct import .apkg to Anki
```

## Card Quality Tips

The AI generates cards following these principles:

1. **One fact per card** - Atomic knowledge
2. **Clear questions** - Unambiguous front side
3. **Concise answers** - Easy to review
4. **Context preserved** - Include relevant quotes
5. **Tags added** - Topic, source, difficulty

## Pricing Estimate

| Step | Service | Cost |
|------|---------|------|
| Download | yt-dlp/spotdl | FREE |
| Transcribe (1hr) | Groq Whisper | ~$0.05 |
| Generate cards | Claude | ~$0.10-0.30 |
| **Total (1hr podcast)** | | **~$0.15-0.35** |

## API Keys Needed

```bash
# Groq (fast Whisper transcription)
export GROQ_API_KEY="..."
# Get at: https://console.groq.com/

# Claude (card generation)
export ANTHROPIC_API_KEY="..."
# Or use local LLM with ollama
```

