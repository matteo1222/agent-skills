---
name: threads
description: Meta Threads API for reading and posting to Threads. Official API with OAuth authentication.
---

# Threads API Skill

Official Meta Threads API for reading posts, publishing content, and getting insights.

## API Status

✅ **Official API** - Released June 2024, actively maintained
- Free to use
- Requires Meta Developer App (different credentials from Facebook)
- OAuth 2.0 authentication

## Capabilities

### Read
- Fetch your own posts and content
- Get post insights (views, likes, replies, reposts, quotes)
- Search public posts by keyword + date range
- Retrieve replies to your posts
- Get follower demographics (age, gender, location)
- Fetch public profiles and their posts

### Write
- Publish text posts (single API call with `auto_publish_text`)
- Create posts with images, videos, GIFs, carousels
- Add polls to posts
- Add location tags
- Add topic tags (#hashtags)
- Schedule posts for later

### Manage
- Hide/unhide replies
- Restrict replies (followers only)
- Receive webhooks for mentions
- Track link clicks

## Setup

### 1. Create Meta Developer App

1. Go to [developers.facebook.com](https://developers.facebook.com/)
2. Create new app → Select "Other" → "Consumer"
3. Add "Threads API" product
4. Note: Threads App ID/Secret are **different** from regular Facebook App ID

### 2. Configure OAuth

Threads requires OAuth 2.0 (no direct API key access):

```
Redirect URL: https://your-domain.com/callback
Scopes: threads_basic, threads_content_publish, threads_manage_insights
```

### 3. Sample App

Meta provides an official sample app:
```bash
git clone https://github.com/fbsamples/threads_api
cd threads_api
npm install

# Create .env from .env.template
# Add your Threads App ID and Secret

npm start
```

**Note:** OAuth redirects require HTTPS. Use `mkcert` for local development.

## API Examples

### Publish a Text Post
```bash
# Single API call with auto_publish_text
curl -X POST "https://graph.threads.net/v1.0/me/threads" \
  -d "text=Hello from Threads API!" \
  -d "auto_publish_text=true" \
  -d "access_token=YOUR_TOKEN"
```

### Get Post Insights
```bash
curl "https://graph.threads.net/v1.0/{post_id}/insights" \
  -d "metric=views,likes,replies,reposts,quotes" \
  -d "access_token=YOUR_TOKEN"
```

### Search Public Posts
```bash
curl "https://graph.threads.net/v1.0/threads/search" \
  -d "q=AI+coding" \
  -d "since=2024-01-01" \
  -d "until=2024-12-31" \
  -d "access_token=YOUR_TOKEN"
```

### Fetch User's Posts
```bash
curl "https://graph.threads.net/v1.0/me/threads" \
  -d "access_token=YOUR_TOKEN"
```

## Rate Limits

- Search: 500 queries per rolling 7-day period
- Standard API calls: Subject to Meta's rate limiting

## Documentation

- Official Docs: https://developers.facebook.com/docs/threads
- Changelog: https://developers.facebook.com/docs/threads/changelog
- Sample App: https://github.com/fbsamples/threads_api

## TODO

<!-- 
TODO: Build a CLI wrapper for common Threads operations:
- threads-cli auth (OAuth flow)
- threads-cli post "message"
- threads-cli search "query"
- threads-cli insights <post_id>
- threads-cli feed <username>

May need browser automation for OAuth, then store token locally.
-->

## Notes

- Unofficial reverse-engineered libraries (threads-net, etc.) were shut down by Meta in 2023
- Only the official API is supported now
- Fediverse integration available but limited (can view via Mastodon clients)
