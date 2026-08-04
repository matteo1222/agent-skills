---
name: twitter-tools
description: Fetch and archive public Twitter/X posts, articles, and videos, or preview, incrementally cache, count, back up, and render private X bookmarks through the official OAuth API and SQLite. Use when saving X material to a knowledge base, checking a few bookmark results, avoiding repeat bookmark reads, inspecting bookmark totals, creating deterministic JSONL bookmark backups, generating bounded Markdown briefs, reading X articles, or downloading post media.
---

# Twitter Tools

Use the unauthenticated syndication tools for individual public posts. Use `twitter-bookmarks.js` and the official X API when private bookmark access is required.

## Install

```bash
cd skills/twitter-tools
npm link
```

The bookmark exporter uses Node's built-in SQLite driver and requires Node 22.5 or newer, with no package dependencies. Run files directly, or use `npm link` to expose their package commands locally. Install the separate `yt-dlp` executable only when the video fallback is needed.

## Export bookmarks

### Configure X

Configure an OAuth 2.0 public/native app in the X Developer Console:

- Set the callback URL exactly to `http://127.0.0.1:8787/oauth/callback`.
- Enable OAuth 2.0 with PKCE.
- Authorize `tweet.read`, `users.read`, `bookmark.read`, and `offline.access`.
- Use the app's Client ID. Do not pass or store a Client Secret; PKCE does not need one.

Keep the Client ID outside the repository:

```bash
export X_CLIENT_ID='YOUR_CLIENT_ID'
```

### Inspect, sync, and export

Sync writes only to the private SQLite cache. Back up or render the cached data afterward without spending more X API credits:

```bash
twitter-bookmarks --dry-run
twitter-bookmarks preview --limit 5
twitter-bookmarks count
twitter-bookmarks sync
twitter-bookmarks sync --full
twitter-bookmarks backup --output ./evergreen/references/x-bookmarks
twitter-bookmarks validate --output ./evergreen/references/x-bookmarks
twitter-bookmarks brief --query "local first" --limit 20
twitter-bookmarks brief --query "agents" --output ./research/x-agents.md
```

Alternatively, invoke the bundled file directly:

```bash
node /path/to/skills/twitter-tools/twitter-bookmarks.js backup \
  --output /path/to/knowledge/evergreen/references/x-bookmarks
```

Use `preview --limit N` to retrieve and print 1–100 bookmarks from the first page without writing files. Add `--json` for machine-readable post objects or `--include-authors` when author names are worth the possible extra User-resource cost.

Use `count` only when a no-write live count is genuinely needed. X returns a per-page `result_count`, not a collection-wide count, so exact counting must retrieve every page. Running `count` before a first or `--full` sync repeats those reads. An incremental cached sync usually reads fewer resources, but its local count may retain old removals until the next full reconciliation.

### SQLite cache

Cache data in the private directory `~/.cache/twitter-tools/private/bookmarks.sqlite3` by default. Override this with `--cache <path>` or `X_BOOKMARKS_CACHE`. SQLite is canonical: each post payload is stored once in `posts`, while `bookmarks` contains lightweight account-to-post membership edges and ordering.

On the first cached sync:

1. Seed SQLite from an existing `bookmarks.json` for the same authenticated account when available, avoiding a second paid historical download.
2. Otherwise fetch every page and establish a complete baseline.

On later syncs, start at the newest page and stop after receiving a page whose bookmark IDs are all already cached. Merge new posts ahead of the cached tail. X exposes no reliable `since_id` for bookmarks, so incremental sync still pays for the overlapping page(s); it avoids rereading the remaining historical tail rather than eliminating all repeat reads.

Incremental sync does not discover an old bookmark removed from X after it has fallen beyond the fetched boundary. Periodically run the following to scan every page and remove stale cache rows:

```bash
twitter-bookmarks sync --full
```

The sync summary reports whether the run reached the end and fully reconciled removals. Keep the SQLite database owner-only and outside Git. Existing databases that stored `post_json` on every bookmark row migrate automatically to the normalized `posts` table when opened.

Use these lifecycle commands when needed:

```bash
twitter-bookmarks login
twitter-bookmarks status
twitter-bookmarks logout
```

The first authenticated command opens X in the browser. Store access and refresh tokens in macOS Keychain under service `knowledge.x-bookmarks.oauth`; never print them or write them into the archive. Reuse the same Keychain item as the standalone knowledge-repository copy of this exporter.

### Deterministic backup format

`twitter-bookmarks backup` is local-only and never reads X or Keychain. It writes owner-only, deterministic JSONL shards:

```text
manifest.json
data/accounts.jsonl
data/authors.jsonl
data/tweets/YYYY.jsonl
data/tweets/unknown.jsonl
data/collections/bookmarks.jsonl
```

Tweet payloads are stored once in yearly shards. Bookmark files contain only account ID, tweet ID, order, URL, and observation timestamps. A logical JSONL file larger than 48 MiB is split at row boundaries into deterministic `.part-0001.jsonl` files.

The manifest contains the backup format and schema versions, the stable SQLite snapshot time, row counts, per-file byte and row counts, SHA-256 hashes, and a whole-backup hash. Export rewrites only `manifest.json` and the managed `data/` directory. It refuses to replace an existing `data/` directory that is not accompanied by a matching managed manifest, so always use a dedicated backup directory.

Backup validates the completed staged snapshot before installing it. Recheck a copied or Git-restored backup without opening SQLite:

```bash
twitter-bookmarks validate --output ./evergreen/references/x-bookmarks
```

The command preserves post IDs and text plus useful official API fields such as creation time, author ID, conversation ID, attachments, entities, language, long-form `note_tweet`, sensitivity, public metrics, and referenced posts when X returns them. It does not download media files.

### Markdown briefs

Generate Markdown only when it is useful instead of maintaining one enormous generated file or one file per bookmark:

```bash
twitter-bookmarks brief --limit 20
twitter-bookmarks brief --query "SQLite" --limit 20
twitter-bookmarks brief --query "agent memory" --output ./research/agent-memory.md
```

`brief` searches cached bookmark text case-insensitively, renders at most 100 results, and writes to stdout unless `--output <file>` is supplied. When multiple cached X accounts exist, select one with `--account <id-or-username>`. It is local-only and makes no X request.

Enable author expansion only when needed:

```bash
twitter-bookmarks sync --include-authors
```

This may return separately billable User resources. The command prints an approximate base Owned Read estimate; verify current pricing in the official X pricing documentation.

## Fetch a public post

```bash
./twitter-tweet.js <post-id-or-url> [--force] [--raw]
```

Return formatted JSON by default. Use `--raw` for the syndication response and `--force` to bypass the local cache.

## Fetch an X article

```bash
./twitter-article.js <post-url> [--raw] [--json] [--force]
```

Use this for X Articles or long posts when the syndication response contains only a short link. Fetch rendered Markdown through Jina Reader and strip images by default.

## Download video

```bash
./twitter-video.js <post-url> [-o output.mp4] [--ytdlp]
```

Use `--ytdlp` for content that the normal path cannot retrieve.

## Archive one public post

```bash
./twitter-archive.js <post-url> [--dir ./archive] [--force]
```

Save raw and formatted JSON, media files, and archive metadata. Reuse an existing archive unless `--force` is given.

## Understand the data paths

Cache unauthenticated public post data under `~/.cache/twitter-tools/`:

```text
~/.cache/twitter-tools/
├── tweets/<id>.json
└── archives/<id>/
    ├── tweet.json
    ├── tweet_formatted.json
    ├── media_*
    └── metadata.json
```

Keep private bookmark tokens in Keychain. Bookmark content lives in the owner-only SQLite cache and in any backup or brief path you explicitly select; keep all of those locations private.

## Troubleshoot

- If OAuth reports a redirect error, match the callback URL character-for-character in X and the CLI.
- If bookmark access is denied, reauthorize after confirming all four read scopes.
- If the Keychain item is stale, run `twitter-bookmarks logout --force`, then `twitter-bookmarks login`.
- If a public post is unavailable, check whether it was deleted or protected and retry with `--force`.
- If video download fails, retry with `--ytdlp` and ensure `yt-dlp` is installed.
