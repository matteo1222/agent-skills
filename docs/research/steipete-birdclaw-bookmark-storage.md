# BirdClaw bookmark storage and export architecture

_Researched 2026-07-22 against `steipete/birdclaw` `main` at commit [`3c173a7`](https://github.com/steipete/birdclaw/tree/3c173a7e706a35087d7fa14cad198bef03119108). Only first-party repository source, documentation, and commit history are used below._

## Conclusion

BirdClaw uses a hybrid design that avoids both problematic extremes:

- it does **not** create one file per bookmark;
- it does **not** use one huge JSON document as its operational database;
- SQLite is the fast local store and search index;
- deterministic, normalized JSONL shards are the portable/Git backup;
- Markdown is generated on demand for a particular research task;
- downloaded media lives in a separate deduplicated filesystem cache.

This is the right direction for `twitter-tools`. Keep SQLite canonical, make large exports explicit, and use sharded JSONL rather than regenerating a monolithic JSON file or thousands of Markdown files after every sync. Retain periodic full reconciliation because BirdClaw's current incremental bookmark path appears not to reconcile removed bookmarks.

## Canonical model: one tweet, separate bookmark membership

BirdClaw's default database is `~/.birdclaw/birdclaw.sqlite`; media is stored separately under `~/.birdclaw/media`. One SQLite database can contain multiple accounts. [README: local paths and storage](https://github.com/steipete/birdclaw/blob/3c173a7e706a35087d7fa14cad198bef03119108/README.md#L115-L150)

Tweet content is normalized into one canonical `tweets` row keyed by tweet ID. A bookmark is represented separately in `tweet_collections`, keyed by `(account_id, tweet_id, kind)`, with collection time, source, raw JSON, and update time. This means the same tweet body is not duplicated when it appears in home, likes, bookmarks, or several accounts. [SQLite schema](https://github.com/steipete/birdclaw/blob/3c173a7e706a35087d7fa14cad198bef03119108/src/lib/db.ts#L115-L195), [README: canonical rows and account edges](https://github.com/steipete/birdclaw/blob/3c173a7e706a35087d7fa14cad198bef03119108/README.md#L395-L408)

Ingestion runs transactionally. Tweets are upserted by tweet ID, collection membership is upserted by the compound account/tweet/kind key, and the tweet FTS row is refreshed in the same write. [Tweet repository](https://github.com/steipete/birdclaw/blob/3c173a7e706a35087d7fa14cad198bef03119108/src/lib/tweet-repository.ts#L45-L187)

## Incremental sync and API-cost control

BirdClaw has two distinct layers of cost control:

1. Live responses are cached in SQLite. A normal repeated command can reuse a fresh cached payload; `--refresh` deliberately bypasses it.
2. `sync bookmarks --early-stop` paginates until a fetched page consists entirely of bookmark edges already in `tweet_collections`. Existing IDs on partially new pages are filtered before persistence.

The default collection cache TTL is two minutes. Without `--all` or an explicit page cap, early-stop traversal is capped at ten pages. [Collection sync implementation](https://github.com/steipete/birdclaw/blob/3c173a7e706a35087d7fa14cad198bef03119108/src/lib/timeline-collections-live.ts#L36-L39), [page deduplication and saturation](https://github.com/steipete/birdclaw/blob/3c173a7e706a35087d7fa14cad198bef03119108/src/lib/timeline-collections-live.ts#L115-L279), [sync documentation](https://github.com/steipete/birdclaw/blob/3c173a7e706a35087d7fa14cad198bef03119108/docs/sync.md#L24-L38)

This deliberately does not use a tweet-ID `since_id`. The feature's implementing commit explains that X orders bookmarks by the bookmarked tweet's creation time, not the time the user bookmarked it. A newly bookmarked old tweet may therefore be deep in the feed. The commit describes page saturation as a practical response to expensive repeated scans. [Early-stop implementation commit](https://github.com/steipete/birdclaw/commit/f90cb71e258cdb00ab61dc38060eb0c0fdf6791e)

### Completeness caveat

The live bookmark code currently upserts returned tweet and collection rows. I found no corresponding removal reconciliation after a complete live bookmark traversal. The scheduled job's before/after counts are also local SQLite counts, not an exact total supplied by the X endpoint. Consequently, BirdClaw's local bookmark count should be read as accumulated known bookmark edges rather than a guaranteed exact mirror after unbookmarking. This is an inference from the current live ingest and job code. [Collection live ingest](https://github.com/steipete/birdclaw/blob/3c173a7e706a35087d7fa14cad198bef03119108/src/lib/timeline-collections-live.ts#L115-L279), [scheduled bookmark counts](https://github.com/steipete/birdclaw/blob/3c173a7e706a35087d7fa14cad198bef03119108/src/lib/bookmark-sync-job.ts#L102-L115)

Page saturation also has a theoretical blind spot: a newly bookmarked old tweet can occur after a page containing only known bookmarks. A periodic exhaustive scan remains necessary when exactness matters.

## Portable backup: deterministic JSONL shards

BirdClaw does not recommend committing the SQLite file because WAL/SHM churn, FTS shadow tables, and transient caches create opaque, noisy Git diffs. Instead, it exports deterministic JSONL with a manifest. [Backup design and rationale](https://github.com/steipete/birdclaw/blob/3c173a7e706a35087d7fa14cad198bef03119108/docs/backup.md#L8-L56), [why not commit SQLite](https://github.com/steipete/birdclaw/blob/3c173a7e706a35087d7fa14cad198bef03119108/docs/backup.md#L150-L157)

Relevant layout:

```text
manifest.json
data/tweets/2024.jsonl
data/tweets/2025.jsonl
data/tweets/unknown.jsonl
data/collections/bookmarks.jsonl
```

Each line of the yearly tweet shards contains one canonical tweet row. Each line of `data/collections/bookmarks.jsonl` contains one account-scoped bookmark edge. Bookmark entries therefore reference tweet IDs rather than duplicating the full tweet payload in a file per bookmark. [Bookmark backup codec](https://github.com/steipete/birdclaw/blob/3c173a7e706a35087d7fa14cad198bef03119108/src/lib/backup-table-codecs.ts#L717-L755)

The output is deterministically sorted. `manifest.json` records each shard's byte count, row count, and SHA hash. A logical shard larger than 48 MiB is split into numbered parts such as `.part-0001.jsonl`, keeping ordinary Git hosting usable without Git LFS. Import validates the manifest and merge-upserts portable rows, while `--replace` is reserved for exact restoration. [Backup documentation](https://github.com/steipete/birdclaw/blob/3c173a7e706a35087d7fa14cad198bef03119108/docs/backup.md#L43-L110)

## Human-readable output and media

BirdClaw treats Markdown as a derived research artifact, not its source of truth. `birdclaw research` queries local bookmarked tweets, expands threads from local data where possible, and writes one focused Markdown brief containing selected threads, links, and handles. It does not generate one Markdown note for every bookmark. [Research workflow](https://github.com/steipete/birdclaw/blob/3c173a7e706a35087d7fa14cad198bef03119108/docs/research.md#L6-L39)

Media metadata stays associated with the tweet, while downloaded bytes go to a separate cache. Existing files are skipped, partial downloads use temporary files, and archive-extracted media can be reused. This avoids bloating the database or text backup with binary payloads. [Media storage and fetch behavior](https://github.com/steipete/birdclaw/blob/3c173a7e706a35087d7fa14cad198bef03119108/docs/media.md#L8-L49)

Tweet text is indexed with SQLite FTS5. Bookmark search is a local query constrained by the bookmark collection edge, so search does not require another X request. [Local search](https://github.com/steipete/birdclaw/blob/3c173a7e706a35087d7fa14cad198bef03119108/docs/search.md#L6-L17)

## Recommended adaptation for `twitter-tools`

1. Keep `bookmarks.sqlite3` as the canonical operational store.
2. Stop regenerating the full `bookmarks.json` and `bookmarks.md` during normal sync. Make export an explicit command.
3. Add a deterministic JSONL backup mode:
   - canonical tweets in `tweets/YYYY.jsonl`;
   - bookmark membership in `collections/bookmarks.jsonl`;
   - a manifest with schema version, account, row counts, byte counts, and hashes;
   - deterministic part files once a shard reaches a defined size.
4. Generate Markdown on demand as a filtered brief or as explicitly selected notes. Do not create thousands of generated bookmark files.
5. Keep media binaries outside SQLite and outside the text backup; store stable metadata and local cache paths in the database.
6. Keep fast incremental sync for routine use, but retain `sync --full` for periodic removal reconciliation and to catch old-tweet bookmarks that saturation can miss.

The most valuable idea to borrow is not merely “use SQLite.” It is the separation between canonical tweet content, account-specific collection membership, portable deterministic backup, derived human notes, and binary media. That boundary keeps each representation suited to its actual job.
