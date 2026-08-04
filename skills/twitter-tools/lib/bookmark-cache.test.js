import assert from 'node:assert/strict';
import { mkdtempSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import test from 'node:test';

import { BookmarkCache } from './bookmark-cache.js';

function bookmark(id, text = `post ${id}`) {
  return {
    position: 0,
    url: `https://x.com/i/status/${id}`,
    post: { id: String(id), text, author_id: 'author' },
  };
}

function makeCache() {
  const directory = mkdtempSync(join(tmpdir(), 'twitter-bookmark-cache-'));
  const path = join(directory, 'bookmarks.sqlite3');
  return { cache: new BookmarkCache(path), path };
}

test('BookmarkCache persists a complete ordered snapshot with owner-only permissions', () => {
  const { cache, path } = makeCache();
  cache.merge(
    { id: 'user', username: 'me', name: 'Me' },
    {
      bookmarks: [bookmark('2'), bookmark('1')],
      authors: [{ id: 'author', username: 'writer' }],
    },
    { currentStateVerified: true, syncedAt: '2026-07-22T00:00:00.000Z' },
  );
  const snapshot = cache.snapshot('user');
  assert.deepEqual(snapshot.bookmarks.map((item) => item.post.id), ['2', '1']);
  assert.equal(snapshot.authors[0].username, 'writer');
  assert.equal(snapshot.stats.bookmarks, 2);
  assert.equal(snapshot.stats.currentStateVerified, true);
  assert.equal(statSync(path).mode & 0o777, 0o600);
  cache.close();
});

test('BookmarkCache incremental merge prepends fetched data and retains the old tail', () => {
  const { cache } = makeCache();
  const account = { id: 'user', username: 'me', name: 'Me' };
  cache.merge(
    account,
    { bookmarks: [bookmark('2'), bookmark('1')], authors: [] },
    { currentStateVerified: true, syncedAt: '2026-07-21T00:00:00.000Z' },
  );
  const merge = cache.merge(
    account,
    { bookmarks: [bookmark('3'), bookmark('2', 'updated')], authors: [] },
    { currentStateVerified: false, syncedAt: '2026-07-22T00:00:00.000Z' },
  );
  assert.deepEqual(cache.snapshot('user').bookmarks.map((item) => item.post.id), ['3', '2', '1']);
  assert.equal(cache.snapshot('user').bookmarks[1].post.text, 'updated');
  assert.equal(merge.newBookmarks, 1);
  assert.equal(merge.removedBookmarks, 0);
  assert.equal(merge.after, 3);
  assert.equal(cache.getStats('user').lastFullSyncAt, '2026-07-21T00:00:00.000Z');
  assert.equal(cache.getStats('user').currentStateVerified, false);
  cache.close();
});

test('BookmarkCache verified merge removes bookmarks no longer returned by X', () => {
  const { cache } = makeCache();
  const account = { id: 'user', username: 'me', name: 'Me' };
  cache.merge(
    account,
    { bookmarks: [bookmark('3'), bookmark('2'), bookmark('1')], authors: [] },
    { currentStateVerified: true, syncedAt: '2026-07-21T00:00:00.000Z' },
  );
  const merge = cache.merge(
    account,
    { bookmarks: [bookmark('3'), bookmark('1')], authors: [] },
    { currentStateVerified: true, syncedAt: '2026-07-22T00:00:00.000Z' },
  );
  assert.deepEqual(cache.snapshot('user').bookmarks.map((item) => item.post.id), ['3', '1']);
  assert.equal(merge.removedBookmarks, 1);
  assert.equal(merge.currentStateVerified, true);
  cache.close();
});

test('BookmarkCache survives reopening the database', () => {
  const { cache, path } = makeCache();
  cache.merge(
    { id: 'user', username: 'me' },
    { bookmarks: [bookmark('1')], authors: [] },
    { currentStateVerified: true },
  );
  cache.close();

  const reopened = new BookmarkCache(path);
  assert.equal(reopened.getBookmarkIds('user').has('1'), true);
  assert.equal(reopened.snapshot('user').bookmarks.length, 1);
  reopened.close();
});

test('BookmarkCache migrates legacy bookmark payloads into canonical posts', () => {
  const directory = mkdtempSync(join(tmpdir(), 'twitter-bookmark-legacy-'));
  const path = join(directory, 'bookmarks.sqlite3');
  const legacy = new DatabaseSync(path);
  legacy.exec(`
    CREATE TABLE accounts (
      user_id TEXT PRIMARY KEY,
      username TEXT,
      name TEXT,
      last_sync_at TEXT,
      last_full_sync_at TEXT,
      current_state_verified INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE bookmarks (
      user_id TEXT NOT NULL,
      post_id TEXT NOT NULL,
      ordinal INTEGER NOT NULL,
      url TEXT NOT NULL,
      post_json TEXT NOT NULL,
      first_seen_at TEXT NOT NULL,
      last_seen_at TEXT NOT NULL,
      PRIMARY KEY (user_id, post_id)
    );
    INSERT INTO accounts VALUES ('user', 'me', 'Me', '2026-07-22', '2026-07-22', 1);
    INSERT INTO bookmarks VALUES (
      'user', '1', 0, 'https://x.com/i/status/1', '{"id":"1","text":"legacy"}',
      '2026-07-22', '2026-07-22'
    );
  `);
  legacy.close();

  const cache = new BookmarkCache(path);
  assert.equal(cache.snapshot('user').bookmarks[0].post.text, 'legacy');
  const columns = cache.db.prepare('PRAGMA table_info(bookmarks)').all().map((column) => column.name);
  assert.equal(columns.includes('post_json'), false);
  assert.equal(cache.backupSnapshot().tweets.length, 1);
  cache.close();
});

test('BookmarkCache stores one canonical post shared by account bookmark edges', () => {
  const { cache } = makeCache();
  cache.merge(
    { id: 'one', username: 'one' },
    { bookmarks: [bookmark('1', 'shared')], authors: [] },
    { currentStateVerified: true, syncedAt: '2026-07-22T00:00:00.000Z' },
  );
  cache.merge(
    { id: 'two', username: 'two' },
    { bookmarks: [bookmark('1', 'shared')], authors: [] },
    { currentStateVerified: true, syncedAt: '2026-07-23T00:00:00.000Z' },
  );
  const backup = cache.backupSnapshot();
  assert.equal(backup.tweets.length, 1);
  assert.equal(backup.bookmarks.length, 2);
  cache.close();
});

test('BookmarkCache creates a bounded local brief with a text filter', () => {
  const { cache } = makeCache();
  cache.merge(
    { id: 'user', username: 'me' },
    { bookmarks: [bookmark('2', 'SQLite cache'), bookmark('1', 'Other topic')], authors: [] },
    { currentStateVerified: true },
  );
  const brief = cache.briefSnapshot({ query: 'sqlite', limit: 20 });
  assert.equal(brief.totalCached, 2);
  assert.deepEqual(brief.bookmarks.map((item) => item.post.id), ['2']);
  cache.close();
});
