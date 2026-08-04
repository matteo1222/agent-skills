# `jawond/bird`: architecture and bookmark-export design

_Researched 2026-07-21 against the current default branch, `main`, at commit [`c0d08f3`](https://github.com/jawond/bird/tree/c0d08f32352fd8e0063d69c9b57760ff4c940b11). Only repository source/history and first-party specifications are used below._

## Executive recommendation

Add a GraphQL-backed `bird bookmarks export` command, but put the unstable X timeline parsing behind a small transport-neutral page interface and put serialization in pure functions. Ship **versioned JSON first**, Markdown second, and CSV only as a deliberately lossy analysis format. Add Netscape bookmark HTML later only if browser import is a real user need.

The compatible MVP should continue using the browser-cookie GraphQL transport because that is Bird's existing zero-developer-account model. The more durable follow-up is an official X API v2 source using an OAuth user access token with `bookmark.read`, `tweet.read`, and `users.read`; X officially documents `GET /2/users/{id}/bookmarks`, 1–100 results per page, `pagination_token`, field selection, and expansions. Keep both behind the same `BookmarkSource` so the export layer does not depend on either response shape. [X bookmark endpoint](https://docs.x.com/x-api/users/get-bookmarks), [OAuth scopes](https://docs.x.com/fundamentals/authentication/oauth-2-0/authorization-code).

Do not implement restore/import in the first change. Export is read-only and can be made complete and auditable; restore requires write scope, conflict/idempotency behavior, rate-limit handling, and decisions about deleted, protected, or inaccessible posts.

## How Bird works today

### Runtime architecture and entry points

Bird is a Node 20+ TypeScript CLI. The package exposes `dist/index.js` as the `bird` binary, runs development through `tsx src/index.ts`, and can compile a standalone executable with Bun. There is no web, desktop, or TUI entry point. [Package scripts and binary](https://github.com/jawond/bird/blob/c0d08f32352fd8e0063d69c9b57760ff4c940b11/package.json#L1-L38).

Almost all orchestration lives in the 971-line [`src/index.ts`](https://github.com/jawond/bird/blob/c0d08f32352fd8e0063d69c9b57760ff4c940b11/src/index.ts): Commander registers `tweet`, `reply`, `read`, `replies`, `thread`, `search`, `mentions`, `whoami`, and `check`, then calls `program.parse()`. [Command list in the README](https://github.com/jawond/bird/blob/c0d08f32352fd8e0063d69c9b57760ff4c940b11/README.md#L15-L26), [CLI parse boundary](https://github.com/jawond/bird/blob/c0d08f32352fd8e0063d69c9b57760ff4c940b11/src/index.ts#L916-L971).

Configuration is read synchronously from global `~/.config/bird/config.json5` and project `.birdrc.json5`; project values override global values. CLI flags and environment variables are then applied by individual command handlers. [Configuration loader](https://github.com/jawond/bird/blob/c0d08f32352fd8e0063d69c9b57760ff4c940b11/src/index.ts#L45-L79), [global auth/engine options](https://github.com/jawond/bird/blob/c0d08f32352fd8e0063d69c9b57760ff4c940b11/src/index.ts#L102-L147).

### X/Twitter data access

Bird has two engines:

1. `graphql`: [`TwitterClient`](https://github.com/jawond/bird/blob/c0d08f32352fd8e0063d69c9b57760ff4c940b11/src/lib/twitter-client.ts#L115-L212) calls X's internal `https://x.com/i/api/graphql` endpoints. It authenticates with the browser `auth_token` cookie and `ct0` CSRF value plus X's public web bearer token. Reads are GET requests; writes are POST requests. This is not the supported public X API and the README explicitly warns that it is aggressively rate-limited. [Headers and cookie session](https://github.com/jawond/bird/blob/c0d08f32352fd8e0063d69c9b57760ff4c940b11/src/lib/twitter-client.ts#L180-L193), [rate-limit warning](https://github.com/jawond/bird/blob/c0d08f32352fd8e0063d69c9b57760ff4c940b11/README.md#L91-L98).
2. `sweetistics`: [`SweetisticsClient`](https://github.com/jawond/bird/blob/c0d08f32352fd8e0063d69c9b57760ff4c940b11/src/lib/sweetistics-client.ts#L1-L76) sends a Sweetistics API key as a bearer token to REST/tRPC endpoints. Its search request explicitly selects a remote `postgres` source, so this is server-side storage, not a Bird-local database. [Sweetistics search](https://github.com/jawond/bird/blob/c0d08f32352fd8e0063d69c9b57760ff4c940b11/src/lib/sweetistics-client.ts#L188-L284).

`auto` selects Sweetistics whenever a key is present, otherwise GraphQL. Bookmark export cannot silently inherit that rule because the current Sweetistics client has no bookmark endpoint. The new command should either be GraphQL-only initially or use capability-aware routing and issue a clear error for unsupported engines. [Engine resolver](https://github.com/jawond/bird/blob/c0d08f32352fd8e0063d69c9b57760ff4c940b11/src/index.ts#L122-L147).

Internal GraphQL query IDs are stored in [`src/lib/query-ids.json`](https://github.com/jawond/bird/blob/c0d08f32352fd8e0063d69c9b57760ff4c940b11/src/lib/query-ids.json). [`scripts/update-query-ids.ts`](https://github.com/jawond/bird/blob/c0d08f32352fd8e0063d69c9b57760ff4c940b11/scripts/update-query-ids.ts#L10-L43) discovers X client bundles, extracts a fixed list of operations, and rewrites that JSON file. Bookmark support must add the actual current bookmark operation name to `TARGET_OPERATIONS` and add `https://x.com/i/bookmarks` to the discovery pages; a hard-coded query ID alone will rot.

### Local storage and model

Bird has **no application database, bookmark cache, import pipeline, or backup manifest**. Local persistence consists only of the two JSON5 config files. Cookie extraction copies Chrome or Firefox's cookie SQLite database into a temporary directory, reads `auth_token` and `ct0` with the system `sqlite3` command, and removes the temporary copy in `finally`. [Chrome temporary-copy lifecycle](https://github.com/jawond/bird/blob/c0d08f32352fd8e0063d69c9b57760ff4c940b11/src/lib/cookies.ts#L137-L215), [Firefox equivalent](https://github.com/jawond/bird/blob/c0d08f32352fd8e0063d69c9b57760ff4c940b11/src/lib/cookies.ts#L218-L285).

The in-memory GraphQL model is `TweetData`; Sweetistics duplicates nearly the same shape as `SweetisticsTweet`. Available normalized fields are:

- post ID and full text;
- author username and display name;
- post creation time;
- reply, repost, and like counts;
- conversation ID and direct parent post ID.

[GraphQL `TweetData`](https://github.com/jawond/bird/blob/c0d08f32352fd8e0063d69c9b57760ff4c940b11/src/lib/twitter-client.ts#L28-L82), [Sweetistics model](https://github.com/jawond/bird/blob/c0d08f32352fd8e0063d69c9b57760ff4c940b11/src/lib/sweetistics-client.ts#L15-L40).

The current mapper does **not** preserve author ID, entities/expanded links, quoted or reposted post references, language, edit history, note-tweet text, media, alt text, or the time the user created the bookmark. A canonical URL can be derived as `https://x.com/{username}/status/{id}`. [Current GraphQL mapper](https://github.com/jawond/bird/blob/c0d08f32352fd8e0063d69c9b57760ff4c940b11/src/lib/twitter-client.ts#L196-L212).

There is no bookmark import/export flow. Existing `--json` switches only print already-fetched `TweetData` to stdout, and search fetches one request without parsing a next-page cursor. Redirecting `bird search --json` is therefore neither a bookmark export nor a complete backup. [Read JSON output](https://github.com/jawond/bird/blob/c0d08f32352fd8e0063d69c9b57760ff4c940b11/src/index.ts#L442-L544), [single-page search](https://github.com/jawond/bird/blob/c0d08f32352fd8e0063d69c9b57760ff4c940b11/src/lib/twitter-client.ts#L546-L692).

## Proposed command and internal API

Recommended CLI:

```text
bird bookmarks export --output bookmarks.json
  --format json|markdown|csv|html
  --limit <n>                 # absent means all pages
  --page-size <1..100>
  --include-media-metadata
  --include-threads           # opt-in, bounded, off by default
  --force                     # required to replace a file
```

Use stdout only with an explicit `--output -`; keep progress and warnings on stderr so exported stdout remains parseable. Write named files atomically with owner-only permissions and refuse accidental overwrite unless `--force` is present. A failed or interrupted traversal must not replace the last complete backup.

### Exact source changes

| File | Change |
|---|---|
| `src/lib/bookmarks.ts` (new) | Define `BookmarkRecord`, `BookmarkPage`, `BookmarkSource`, pagination/deduplication, completion metadata, and the versioned export envelope. Keep transport responses out of this layer. |
| `src/lib/bookmark-export.ts` (new) | Pure `serializeBookmarksJson`, `serializeBookmarksMarkdown`, `serializeBookmarksCsv`, and later `serializeBookmarksHtml`; add atomic/permission-safe output as a small separate function. |
| [`src/lib/twitter-client.ts`](https://github.com/jawond/bird/blob/c0d08f32352fd8e0063d69c9b57760ff4c940b11/src/lib/twitter-client.ts) | Extend `GraphqlTweetResult` and `TweetData` for export fields; generalize `mapTweetResult`/timeline parsing; add `getBookmarksPage({ cursor, count })`; extract the bottom cursor; skip tombstones/promoted/module entries; return partial GraphQL errors rather than discarding valid posts. |
| [`src/lib/query-ids.json`](https://github.com/jawond/bird/blob/c0d08f32352fd8e0063d69c9b57760ff4c940b11/src/lib/query-ids.json) | Add the discovered bookmark operation ID. Do not invent a permanent fallback until it has been verified against a captured response. |
| [`scripts/update-query-ids.ts`](https://github.com/jawond/bird/blob/c0d08f32352fd8e0063d69c9b57760ff4c940b11/scripts/update-query-ids.ts#L10-L25) | Add the bookmark operation to `TARGET_OPERATIONS` and the bookmarks page to discovery. Add unit coverage for extraction so bundle-shape changes fail visibly. |
| `src/commands/bookmarks.ts` (new) | Register `bookmarks export`, resolve only a capable source, page until complete/limited, call a serializer, and keep data on stdout and status on stderr. |
| [`src/index.ts`](https://github.com/jawond/bird/blob/c0d08f32352fd8e0063d69c9b57760ff4c940b11/src/index.ts#L81-L120) | Register the new command and add help/config options only. Avoid adding another long inline action to the existing monolith. |
| [`README.md`](https://github.com/jawond/bird/blob/c0d08f32352fd8e0063d69c9b57760ff4c940b11/README.md) / `CHANGELOG.md` | Document privacy, completeness, engine limitations, formats, overwrite behavior, and examples. |

For a supported public-API follow-up, add `src/lib/x-api-client.ts` implementing the same `BookmarkSource`. It should call `/2/users/me`, then `/2/users/{id}/bookmarks`, request `attachments`, `author_id`, `conversation_id`, `created_at`, `entities`, `note_tweet`, `public_metrics`, `referenced_tweets`, and expand authors/media/referenced posts. The official endpoint returns `meta.next_token`, supports `max_results` from 1 through 100, and exposes author/media expansions. [Official request, pagination, and fields](https://docs.x.com/x-api/users/get-bookmarks).

## Export formats

### 1. JSON — default and canonical

Use a versioned UTF-8 JSON envelope, not a bare array:

```json
{
  "schemaVersion": 1,
  "exportedAt": "2026-07-21T00:00:00.000Z",
  "source": { "engine": "graphql", "accountId": "...", "complete": true, "pages": 12 },
  "bookmarks": []
}
```

JSON preserves nested authors, media, references, and future fields and is already Bird's machine-output convention. It is the only first-release format that should be called a backup. Follow [RFC 8259](https://www.rfc-editor.org/info/rfc8259/) and make ordering deterministic for reviewable diffs.

### 2. Markdown — human-readable companion

Emit one heading or list item per post with author, post URL, creation time, text, media links, and metrics. Use portable [CommonMark](https://spec.commonmark.org/current/) and escape user-controlled text so mentions, brackets, raw HTML, and code fences cannot alter document structure. Markdown is good for notes and search, but not for lossless restore.

### 3. CSV — optional, explicitly lossy

Use [RFC 4180](https://datatracker.ietf.org/doc/rfc4180/) quoting and a stable header such as `id,url,text,author_username,author_name,created_at,conversation_id,in_reply_to_id,reply_count,repost_count,like_count,media_urls`. Flatten arrays predictably and neutralize spreadsheet formula prefixes (`=`, `+`, `-`, `@`). CSV is for spreadsheets/analysis, not canonical backup.

### 4. HTML/Netscape bookmarks — later interoperability option

Chrome officially imports and exports bookmarks as HTML, and its portability schema identifies the Netscape Bookmarks File Format. [Chrome Help](https://support.google.com/chrome/answer/96816?hl=en), [Chrome portability schema](https://developers.google.com/data-portability/schema-reference/chrome?hl=en). This format maps each post to a browser link and therefore loses post structure, media metadata, metrics, and thread relationships. X does not expose a reliable `bookmarkedAt` value here, so do not fabricate `ADD_DATE`; use the post creation time only in visible text or omit the attribute. A rich standalone HTML archive is a separate format and must HTML-escape all post content.

## Pagination, media, threads, and completeness

- **Pagination:** loop until the bottom cursor/`next_token` is absent, the user limit is reached, or a repeated cursor is detected. Deduplicate by post ID across pages. Preserve source order, page count, requested limit, dropped-entry count, and `complete: false` plus an error if traversal stops early. The official API's `next_token`/`pagination_token` model is documented in its [bookmark reference](https://docs.x.com/x-api/users/get-bookmarks).
- **Bookmark time/order:** preserve the returned order, but do not label it chronological or synthesize a bookmark timestamp. Tweet IDs and tweet creation times do not identify when the user bookmarked them.
- **Media:** extend the model to store media key, type, URL/preview URL, dimensions, duration, alt text, and variants where returned. The official endpoint exposes these through `attachments.media_keys`, expansions, and selectable media fields. Do not download binary media by default; downloads are slower, may use expiring URLs, and greatly change backup size and privacy exposure. [Official media expansions/fields](https://docs.x.com/x-api/users/get-bookmarks).
- **Long posts and links:** prefer note-tweet text when present and retain both original and expanded URL/entity metadata. The current `legacy.full_text`-only mapper can truncate or lose semantics.
- **Threads:** always export `conversationId` and reply/reference IDs when known. Do not recursively fetch threads by default: that creates N+1 traffic, triggers GraphQL rate limits, exports posts the user did not bookmark, and may encounter protected/deleted content. An opt-in `--include-threads` should cap concurrency, deduplicate shared conversations, label the bookmarked post, and mark every thread as complete/partial independently. Bird's current thread helper only filters and sorts the conversation material returned by one TweetDetail response; it does not prove the entire conversation was fetched. [Current thread helper](https://github.com/jawond/bird/blob/c0d08f32352fd8e0063d69c9b57760ff4c940b11/src/lib/twitter-client.ts#L819-L854).
- **Unavailable entries:** preserve a minimal tombstone containing source entry ID/reason when possible. Deleted, withheld, protected, or malformed posts should increment a manifest counter rather than disappear silently.

## Privacy and authentication risks

X states that bookmarks are private and visible only to the user who created them. An export is therefore sensitive personal-interest data, and it may contain protected-account posts. [X Bookmarks introduction](https://docs.x.com/x-api/posts/bookmarks/introduction).

Required controls:

- never serialize cookies, CSRF values, bearer tokens, request headers, raw API responses, config values, or credential-source paths;
- never print tokens, even prefixes, from the export flow; Bird's existing `check` command currently prints the first ten characters of each cookie and should not be copied. [Current `check` output](https://github.com/jawond/bird/blob/c0d08f32352fd8e0063d69c9b57760ff4c940b11/src/index.ts#L916-L961);
- create exports owner-readable/writable only, use an atomic temporary file in the destination directory, and refuse overwrite without `--force`;
- keep status/errors on stderr and private data on the selected output stream;
- escape Markdown/HTML and defend CSV consumers from formula injection;
- do not send bookmark contents to Sweetistics or any other remote service merely because `auto` selected it;
- for the official API path, request the minimum scopes. `bookmark.read` reads bookmarks, while `bookmark.write` is for adding/removing and is unnecessary for export. [Official scope definitions](https://docs.x.com/fundamentals/authentication/oauth-2-0/authorization-code).

The internal GraphQL path carries operational risk beyond privacy: query IDs and response shapes can rotate, cookies are high-privilege session credentials, and the project itself warns about 429 responses. A supported OAuth source should ultimately be preferred where setup and X API cost/access are acceptable.

## Test plan

Add deterministic fixtures; do not make live X or Sweetistics calls in CI.

1. **GraphQL page parsing — `tests/twitter-client.test.ts`:** one and multiple pages; bottom cursor extraction; repeated cursor; duplicate posts; module/promoted entries; tombstones; partial `errors` plus usable data; missing author/text; note tweets; quoted/reposted references; photos/video/GIF and alt text; 401/403/429/5xx/network failures.
2. **Paginator — `tests/bookmarks.test.ts` (new):** no limit, exact limit, mid-page limit, zero results, stable source order, deduplication, incomplete manifest on failure, abort signal, and no infinite loop on cursor reuse.
3. **Serializers — `tests/bookmark-export.test.ts` (new):** golden JSON schema/version; deterministic dates/newlines; CSV quotes/newlines/formula prefixes; Markdown link/code/raw-HTML escaping; HTML entity/attribute escaping; missing optional fields; Unicode and emoji; multiple media/reference values.
4. **Filesystem output:** owner-only permissions, overwrite refusal, `--force`, atomic success, cleanup after failure, symlink/destination errors, and no replacement of the previous complete backup on interruption.
5. **CLI boundary:** extract/register the command with injected clients and streams, then test stdout versus stderr, explicit `--output -`, format inference/override, unsupported Sweetistics engine, count validation, exit codes, and help text. The current `tests/cli.test.ts` covers only `extractTweetId`, while `src/index.ts` is excluded from coverage. [CLI test](https://github.com/jawond/bird/blob/c0d08f32352fd8e0063d69c9b57760ff4c940b11/tests/cli.test.ts), [Vitest coverage exclusion](https://github.com/jawond/bird/blob/c0d08f32352fd8e0063d69c9b57760ff4c940b11/vitest.config.ts#L3-L13).
6. **Query-ID updater:** factor bundle extraction into an importable pure function and test discovery of the bookmark operation plus preservation of the previous ID when discovery fails.
7. **Official API source, when added:** `/2/users/me`, fields/expansions, `meta.next_token`, partial errors, token redaction, scope errors, and rate-limit response handling.

Baseline verification on the pinned commit: `pnpm test` passed all 44 tests and `pnpm run build` passed. `pnpm run lint` failed on pre-existing formatting in `src/index.ts`, `src/lib/sweetistics-client.ts`, and two test files plus an assignment-in-expression lint finding in `tests/twitter-client.test.ts`; a bookmark change should not treat the current lint command as a clean baseline.

## Delivery sequence

1. Land the transport-neutral record/page interface, GraphQL page parser, complete pagination, versioned JSON, atomic file output, and tests.
2. Add Markdown and CSV serializers.
3. Extend rich fields/media metadata and optional bounded thread capture.
4. Add the supported X API v2 OAuth source behind the same interface.
5. Add Netscape HTML only in response to browser-import demand; consider restore/import as a separate, explicitly write-authorized project.

This sequence keeps the first feature small, private by default, and testable while leaving a clean path away from X's rotating internal GraphQL contract.
