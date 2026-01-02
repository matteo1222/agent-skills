---
name: twitter-tools
description: Fetch tweets and download Twitter/X videos without API key
---

# Twitter Tools

Fetch tweet data and download videos from Twitter/X using the syndication API. No API key or authentication required.

## Installation

```bash
cd twitter-tools
npm install
```

## Commands

### Fetch Tweet

Retrieve tweet data including text, metrics, and media URLs.

```bash
./twitter-tweet.js <tweet-id-or-url> [options]
```

**Options:**
- `--force` - Bypass cache and fetch fresh data
- `--raw` - Output raw API response instead of formatted

**Examples:**
```bash
# By tweet ID
./twitter-tweet.js 1629307668568633344

# By URL (twitter.com or x.com)
./twitter-tweet.js https://twitter.com/elonmusk/status/1629307668568633344

# Force refresh
./twitter-tweet.js 1629307668568633344 --force

# Get raw API response
./twitter-tweet.js 1629307668568633344 --raw
```

**Output:** JSON with tweet text, user info, metrics, and media URLs.

### Download Video

Download video from a tweet.

```bash
./twitter-video.js <tweet-url> [options]
```

**Options:**
- `-o, --output` - Output file path (default: `video_<id>.mp4`)
- `--ytdlp` - Force use of yt-dlp (for age-restricted content)

**Examples:**
```bash
# Download to default filename
./twitter-video.js https://twitter.com/user/status/1234567890

# Custom output path
./twitter-video.js 1234567890 -o my_video.mp4

# Force yt-dlp for restricted content
./twitter-video.js https://x.com/user/status/1234567890 --ytdlp
```

### Archive Tweet

Archive a tweet with all media files (idempotent).

```bash
./twitter-archive.js <tweet-url> [options]
```

**Options:**
- `--dir` - Custom output directory
- `--force` - Re-archive even if already exists

**Examples:**
```bash
# Archive to default location (~/.cache/twitter-tools/archives/<id>)
./twitter-archive.js https://twitter.com/user/status/1234567890

# Archive to custom directory
./twitter-archive.js 1234567890 --dir ./my-archive

# Force re-archive
./twitter-archive.js https://x.com/user/status/1234567890 --force
```

**Archive includes:**
- `tweet.json` - Raw API response
- `tweet_formatted.json` - Formatted tweet data
- `media_*.jpg/png` - Images
- `media_*.mp4` - Videos
- `metadata.json` - Archive metadata

## Cache

Tweet data and archives are cached in `~/.cache/twitter-tools/`:

```
~/.cache/twitter-tools/
├── tweets/           # Cached tweet JSON
│   └── <id>.json
└── archives/         # Full tweet archives
    └── <id>/
        ├── tweet.json
        ├── tweet_formatted.json
        ├── media_0.jpg
        ├── media_1.mp4
        └── metadata.json
```

## How It Works

This tool uses Twitter's **Syndication API** - the same undocumented API that powers embedded tweets. Key benefits:

- **No API key required** - Public endpoint, no authentication
- **No account risk** - You're not logging in, so no suspension risk
- **Free** - No rate limit costs

### Limitations

- Cannot search tweets - must know the tweet ID/URL
- Cannot fetch user timelines
- Some tweets may not be available (deleted, protected, etc.)
- Rate limits apply (but are generous for normal use)

## Troubleshooting

### "Tweet not found" error
- The tweet may be deleted or from a protected account
- Double-check the tweet ID/URL

### Video download fails
- Try the `--ytdlp` flag for age-restricted content
- Ensure yt-dlp is installed: `pip install yt-dlp`

### Empty response
- The syndication API occasionally returns empty responses
- Wait a moment and try again with `--force`
