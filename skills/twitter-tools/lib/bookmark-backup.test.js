import assert from 'node:assert/strict';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import {
  BOOKMARK_BACKUP_FORMAT,
  buildBookmarkBackup,
  canonicalStringify,
  shardJsonl,
  validateBookmarkBackup,
  writeBookmarkBackup,
} from './bookmark-backup.js';

function snapshot() {
  return {
    accounts: [{
      id: 'user',
      username: 'me',
      name: 'Me',
      lastSyncAt: '2026-07-23T00:00:00.000Z',
      lastFullSyncAt: '2026-07-22T00:00:00.000Z',
      currentStateVerified: false,
    }],
    authors: [{
      accountId: 'user',
      authorId: 'author',
      author: { username: 'writer', id: 'author' },
      lastSeenAt: '2026-07-23T00:00:00.000Z',
    }],
    tweets: [
      {
        id: '2',
        post: { text: 'unknown date', id: '2' },
        firstSeenAt: '2026-07-23T00:00:00.000Z',
        lastSeenAt: '2026-07-23T00:00:00.000Z',
      },
      {
        id: '1',
        post: { text: 'dated', id: '1', created_at: '2025-06-01T00:00:00.000Z' },
        firstSeenAt: '2026-07-22T00:00:00.000Z',
        lastSeenAt: '2026-07-23T00:00:00.000Z',
      },
    ],
    bookmarks: [
      {
        accountId: 'user',
        tweetId: '1',
        position: 0,
        url: 'https://x.com/i/status/1',
        firstSeenAt: '2026-07-22T00:00:00.000Z',
        lastSeenAt: '2026-07-23T00:00:00.000Z',
      },
      {
        accountId: 'user',
        tweetId: '2',
        position: 1,
        url: 'https://x.com/i/status/2',
        firstSeenAt: '2026-07-23T00:00:00.000Z',
        lastSeenAt: '2026-07-23T00:00:00.000Z',
      },
    ],
  };
}

test('canonicalStringify sorts nested object keys', () => {
  assert.equal(
    canonicalStringify({ z: 1, a: { d: 2, b: 1 } }),
    '{"a":{"b":1,"d":2},"z":1}',
  );
});

test('buildBookmarkBackup normalizes tweets and bookmark edges into deterministic JSONL', () => {
  const first = buildBookmarkBackup(snapshot());
  const second = buildBookmarkBackup(snapshot());
  assert.deepEqual(first, second);
  assert.equal(first.manifest.format, BOOKMARK_BACKUP_FORMAT);
  assert.deepEqual(first.manifest.counts, { accounts: 1, authors: 1, bookmarks: 2, tweets: 2 });
  assert.deepEqual(first.files.map((file) => file.path), [
    'data/accounts.jsonl',
    'data/authors.jsonl',
    'data/collections/bookmarks.jsonl',
    'data/tweets/2025.jsonl',
    'data/tweets/unknown.jsonl',
  ]);
  const edge = JSON.parse(first.files.find((file) => (
    file.path === 'data/collections/bookmarks.jsonl'
  )).contents.split('\n')[0]);
  assert.equal(edge.tweetId, '1');
  assert.equal('post' in edge, false);
});

test('shardJsonl splits only between rows and names deterministic parts', () => {
  const parts = shardJsonl('data/tweets/2025.jsonl', [
    { id: '1', text: 'a'.repeat(30) },
    { id: '2', text: 'b'.repeat(30) },
  ], 60);
  assert.deepEqual(parts.map((part) => part.path), [
    'data/tweets/2025.part-0001.jsonl',
    'data/tweets/2025.part-0002.jsonl',
  ]);
  assert.deepEqual(parts.map((part) => part.rows), [1, 1]);
});

test('writeBookmarkBackup replaces only managed data and preserves sibling files', () => {
  const root = mkdtempSync(join(tmpdir(), 'twitter-bookmark-backup-'));
  writeFileSync(join(root, 'README.md'), 'private backup\n');
  const result = writeBookmarkBackup(root, snapshot());
  const manifest = JSON.parse(readFileSync(result.manifestPath, 'utf8'));
  assert.equal(manifest.counts.bookmarks, 2);
  assert.equal(existsSync(join(root, 'data', 'tweets', '2025.jsonl')), true);
  assert.equal(readFileSync(join(root, 'README.md'), 'utf8'), 'private backup\n');
  assert.equal(statSync(result.manifestPath).mode & 0o777, 0o600);
  assert.equal(validateBookmarkBackup(root).counts.tweets, 2);

  const changed = snapshot();
  changed.tweets = changed.tweets.filter((tweet) => tweet.id === '2');
  changed.bookmarks = changed.bookmarks.filter((bookmark) => bookmark.tweetId === '2');
  writeBookmarkBackup(root, changed);
  assert.equal(existsSync(join(root, 'data', 'tweets', '2025.jsonl')), false);
  assert.equal(existsSync(join(root, 'data', 'tweets', 'unknown.jsonl')), true);
});

test('validateBookmarkBackup detects changed JSONL content', () => {
  const root = mkdtempSync(join(tmpdir(), 'twitter-bookmark-corrupt-'));
  writeBookmarkBackup(root, snapshot());
  const tweetPath = join(root, 'data', 'tweets', '2025.jsonl');
  writeFileSync(tweetPath, `${readFileSync(tweetPath, 'utf8')}{}\n`);
  assert.throws(() => validateBookmarkBackup(root), /Backup validation failed/);
});

test('writeBookmarkBackup refuses to replace an unmanaged data directory', () => {
  const root = mkdtempSync(join(tmpdir(), 'twitter-bookmark-unmanaged-'));
  mkdirSync(join(root, 'data'));
  assert.throws(() => writeBookmarkBackup(root, snapshot()), /unmanaged data directory/);

  const manifestOnly = mkdtempSync(join(tmpdir(), 'twitter-bookmark-other-manifest-'));
  writeFileSync(join(manifestOnly, 'manifest.json'), '{"format":"another-tool"}\n');
  assert.throws(() => writeBookmarkBackup(manifestOnly, snapshot()), /another backup format/);
});
