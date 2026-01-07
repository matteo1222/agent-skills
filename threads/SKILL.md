---
name: threads
description: Meta Threads API for reading and posting to Threads. Uses threads-cli with OAuth authentication.
---

# Threads API Skill

Official Meta Threads API via `threads-cli` for posting, reading, and getting insights.

## Installation

```bash
cd ~/threads-cli && npm link
# OR
npm install -g @pomatez/threads-cli
```

## Setup (One-Time)

### 1. Create Meta Developer App

1. Go to [developers.facebook.com](https://developers.facebook.com/)
2. Create app → "Other" → "Consumer"
3. Add "Threads API" product
4. Note: Threads App ID/Secret are **different** from Facebook App ID

### 2. Authenticate

**With browser (interactive):**
```bash
threads-cli auth --app-id YOUR_APP_ID --app-secret YOUR_APP_SECRET
# Opens browser, authorizes, saves token
```

**Headless (manual flow):**
```bash
threads-cli auth --app-id YOUR_APP_ID --app-secret YOUR_APP_SECRET --manual
# Prints URL, you visit it, paste code back:
threads-cli auth:callback --code THE_CODE_FROM_URL
```

**With environment variables:**
```bash
export THREADS_APP_ID=your_app_id
export THREADS_APP_SECRET=your_app_secret
threads-cli auth
```

### 3. Verify

```bash
threads-cli status   # Check auth status
threads-cli me       # Get your profile
```

## Commands

### Post

```bash
threads-cli post "Hello from the CLI!"
threads-cli post "Check this out" --json
```

### Read

```bash
threads-cli me              # Your profile
threads-cli feed            # Your recent posts
threads-cli feed -n 20      # Last 20 posts
threads-cli feed --json     # JSON output
```

### Insights

```bash
threads-cli insights <postId>
threads-cli insights <postId> --json
```

### Status

```bash
threads-cli status          # Check config and auth
```

## Data Storage

- `~/.threads-cli/config.json` - App credentials
- `~/.threads-cli/tokens.json` - OAuth tokens

## Output Formats

- Default: Human-readable
- `--json`: Machine-readable JSON

## API Capabilities

### Available via CLI
- ✅ Post text threads
- ✅ Get your profile
- ✅ List your threads
- ✅ Get post insights (views, likes, replies, reposts, quotes)

### Available via API (TODO in CLI)
- Polls, images, videos, GIFs, carousels
- Location tags, topic tags
- Search public posts
- Reply management
- Scheduled posts
- Webhooks

## Source

- CLI: `/home/matthewlutw/threads-cli`
- Official API Docs: https://developers.facebook.com/docs/threads
- Sample App: https://github.com/fbsamples/threads_api

## Notes

- Tokens are long-lived (~60 days) but may need refresh
- Rate limits apply (500 searches per 7 days, etc.)
- Unofficial libraries were shut down by Meta in 2023
