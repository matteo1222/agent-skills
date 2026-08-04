import { chmodSync, mkdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

export const DEFAULT_BOOKMARK_CACHE_PATH = resolve(
  homedir(),
  '.cache',
  'twitter-tools',
  'private',
  'bookmarks.sqlite3',
);

export class BookmarkCache {
  constructor(path = DEFAULT_BOOKMARK_CACHE_PATH) {
    this.path = resolve(path);
    const cacheDirectory = dirname(this.path);
    mkdirSync(cacheDirectory, { recursive: true, mode: 0o700 });
    if (this.path === DEFAULT_BOOKMARK_CACHE_PATH) chmodSync(cacheDirectory, 0o700);
    this.db = new DatabaseSync(this.path);
    chmodSync(this.path, 0o600);
    this.db.exec(`
      PRAGMA journal_mode = WAL;
      PRAGMA synchronous = NORMAL;
      PRAGMA foreign_keys = ON;
      PRAGMA busy_timeout = 5000;

      CREATE TABLE IF NOT EXISTS accounts (
        user_id TEXT PRIMARY KEY,
        username TEXT,
        name TEXT,
        last_sync_at TEXT,
        last_full_sync_at TEXT,
        current_state_verified INTEGER NOT NULL DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS posts (
        post_id TEXT PRIMARY KEY,
        post_json TEXT NOT NULL,
        first_seen_at TEXT NOT NULL,
        last_seen_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS authors (
        user_id TEXT NOT NULL,
        author_id TEXT NOT NULL,
        author_json TEXT NOT NULL,
        last_seen_at TEXT NOT NULL,
        PRIMARY KEY (user_id, author_id),
        FOREIGN KEY (user_id) REFERENCES accounts(user_id) ON DELETE CASCADE
      );
    `);
    this.migrateBookmarksToCanonicalPosts();
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS bookmarks (
        user_id TEXT NOT NULL,
        post_id TEXT NOT NULL,
        ordinal INTEGER NOT NULL,
        url TEXT NOT NULL,
        first_seen_at TEXT NOT NULL,
        last_seen_at TEXT NOT NULL,
        PRIMARY KEY (user_id, post_id),
        FOREIGN KEY (user_id) REFERENCES accounts(user_id) ON DELETE CASCADE,
        FOREIGN KEY (post_id) REFERENCES posts(post_id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS bookmarks_user_order
        ON bookmarks(user_id, ordinal);
    `);
  }

  migrateBookmarksToCanonicalPosts() {
    const table = this.db.prepare(
      "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'bookmarks'",
    ).get();
    if (!table) return;
    const columns = this.db.prepare('PRAGMA table_info(bookmarks)').all();
    if (!columns.some((column) => column.name === 'post_json')) return;

    this.db.exec('BEGIN IMMEDIATE');
    try {
      this.db.exec(`
        INSERT OR IGNORE INTO posts (post_id, post_json, first_seen_at, last_seen_at)
        SELECT post_id, post_json, first_seen_at, last_seen_at
        FROM bookmarks
        ORDER BY last_seen_at DESC;

        CREATE TABLE bookmarks_canonical (
          user_id TEXT NOT NULL,
          post_id TEXT NOT NULL,
          ordinal INTEGER NOT NULL,
          url TEXT NOT NULL,
          first_seen_at TEXT NOT NULL,
          last_seen_at TEXT NOT NULL,
          PRIMARY KEY (user_id, post_id),
          FOREIGN KEY (user_id) REFERENCES accounts(user_id) ON DELETE CASCADE,
          FOREIGN KEY (post_id) REFERENCES posts(post_id) ON DELETE CASCADE
        );

        INSERT INTO bookmarks_canonical (
          user_id, post_id, ordinal, url, first_seen_at, last_seen_at
        )
        SELECT user_id, post_id, ordinal, url, first_seen_at, last_seen_at
        FROM bookmarks;

        DROP TABLE bookmarks;
        ALTER TABLE bookmarks_canonical RENAME TO bookmarks;
        CREATE INDEX bookmarks_user_order ON bookmarks(user_id, ordinal);
      `);
      this.db.exec('COMMIT');
    } catch (error) {
      this.db.exec('ROLLBACK');
      throw error;
    }
  }

  close() {
    this.db.close();
  }

  getBookmarkIds(userId) {
    const rows = this.db.prepare('SELECT post_id FROM bookmarks WHERE user_id = ?').all(String(userId));
    return new Set(rows.map((row) => String(row.post_id)));
  }

  getStats(userId) {
    const account = this.db.prepare(`
      SELECT user_id, username, name, last_sync_at, last_full_sync_at, current_state_verified
      FROM accounts
      WHERE user_id = ?
    `).get(String(userId));
    const count = Number(this.db.prepare(
      'SELECT COUNT(*) AS count FROM bookmarks WHERE user_id = ?',
    ).get(String(userId)).count);
    return {
      bookmarks: count,
      lastSyncAt: account?.last_sync_at || null,
      lastFullSyncAt: account?.last_full_sync_at || null,
      currentStateVerified: Boolean(account?.current_state_verified),
    };
  }

  listAccounts() {
    return this.db.prepare(`
      SELECT user_id, username, name, last_sync_at, last_full_sync_at, current_state_verified
      FROM accounts
      ORDER BY lower(COALESCE(username, user_id)), user_id
    `).all().map((row) => ({
      id: String(row.user_id),
      username: row.username || null,
      name: row.name || null,
      lastSyncAt: row.last_sync_at || null,
      lastFullSyncAt: row.last_full_sync_at || null,
      currentStateVerified: Boolean(row.current_state_verified),
    }));
  }

  resolveAccount(selector) {
    const accounts = this.listAccounts();
    if (accounts.length === 0) throw new Error('The bookmark cache has no accounts. Run sync first.');
    if (!selector) {
      if (accounts.length === 1) return accounts[0];
      throw new Error('The bookmark cache has multiple accounts. Pass --account <id-or-username>.');
    }
    const normalized = String(selector).replace(/^@/, '').toLowerCase();
    const account = accounts.find((candidate) => (
      candidate.id.toLowerCase() === normalized || candidate.username?.toLowerCase() === normalized
    ));
    if (!account) throw new Error(`No cached X account matches: ${selector}`);
    return account;
  }

  merge(account, result, { currentStateVerified, syncedAt = new Date().toISOString() }) {
    const userId = String(account.id);
    const existingRows = this.db.prepare(`
      SELECT post_id
      FROM bookmarks
      WHERE user_id = ?
      ORDER BY ordinal ASC
    `).all(userId);
    const existingIds = existingRows.map((row) => String(row.post_id));
    const existingSet = new Set(existingIds);
    const fetchedIds = [];
    const fetchedSet = new Set();
    for (const bookmark of result.bookmarks) {
      const postId = String(bookmark.post.id);
      if (!fetchedSet.has(postId)) {
        fetchedSet.add(postId);
        fetchedIds.push(postId);
      }
    }
    const orderedIds = currentStateVerified
      ? fetchedIds
      : [...fetchedIds, ...existingIds.filter((postId) => !fetchedSet.has(postId))];

    const upsertAccount = this.db.prepare(`
      INSERT INTO accounts (
        user_id, username, name, last_sync_at, last_full_sync_at, current_state_verified
      ) VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(user_id) DO UPDATE SET
        username = excluded.username,
        name = excluded.name,
        last_sync_at = excluded.last_sync_at,
        last_full_sync_at = COALESCE(excluded.last_full_sync_at, accounts.last_full_sync_at),
        current_state_verified = excluded.current_state_verified
    `);
    const upsertBookmark = this.db.prepare(`
      INSERT INTO bookmarks (
        user_id, post_id, ordinal, url, first_seen_at, last_seen_at
      ) VALUES (?, ?, 0, ?, ?, ?)
      ON CONFLICT(user_id, post_id) DO UPDATE SET
        url = excluded.url,
        last_seen_at = excluded.last_seen_at
    `);
    const upsertPost = this.db.prepare(`
      INSERT INTO posts (post_id, post_json, first_seen_at, last_seen_at)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(post_id) DO UPDATE SET
        post_json = excluded.post_json,
        first_seen_at = min(posts.first_seen_at, excluded.first_seen_at),
        last_seen_at = max(posts.last_seen_at, excluded.last_seen_at)
    `);
    const upsertAuthor = this.db.prepare(`
      INSERT INTO authors (user_id, author_id, author_json, last_seen_at)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(user_id, author_id) DO UPDATE SET
        author_json = excluded.author_json,
        last_seen_at = excluded.last_seen_at
    `);
    const deleteBookmark = this.db.prepare(
      'DELETE FROM bookmarks WHERE user_id = ? AND post_id = ?',
    );
    const setOrdinal = this.db.prepare(
      'UPDATE bookmarks SET ordinal = ? WHERE user_id = ? AND post_id = ?',
    );

    this.db.exec('BEGIN IMMEDIATE');
    try {
      upsertAccount.run(
        userId,
        account.username || null,
        account.name || null,
        syncedAt,
        currentStateVerified ? syncedAt : null,
        currentStateVerified ? 1 : 0,
      );
      for (const bookmark of result.bookmarks) {
        upsertPost.run(
          String(bookmark.post.id),
          JSON.stringify(bookmark.post),
          syncedAt,
          syncedAt,
        );
        upsertBookmark.run(
          userId,
          String(bookmark.post.id),
          bookmark.url,
          syncedAt,
          syncedAt,
        );
      }
      for (const author of result.authors || []) {
        if (author?.id) upsertAuthor.run(userId, String(author.id), JSON.stringify(author), syncedAt);
      }
      if (currentStateVerified) {
        for (const postId of existingIds) {
          if (!fetchedSet.has(postId)) deleteBookmark.run(userId, postId);
        }
      }
      orderedIds.forEach((postId, ordinal) => setOrdinal.run(ordinal, userId, postId));
      if (currentStateVerified) {
        this.db.exec(`
          DELETE FROM posts
          WHERE NOT EXISTS (
            SELECT 1 FROM bookmarks WHERE bookmarks.post_id = posts.post_id
          );
        `);
      }
      this.db.exec('COMMIT');
    } catch (error) {
      this.db.exec('ROLLBACK');
      throw error;
    }

    return {
      before: existingIds.length,
      fetched: fetchedIds.length,
      newBookmarks: fetchedIds.filter((postId) => !existingSet.has(postId)).length,
      removedBookmarks: currentStateVerified
        ? existingIds.filter((postId) => !fetchedSet.has(postId)).length
        : 0,
      after: orderedIds.length,
      currentStateVerified,
    };
  }

  snapshot(userId) {
    const key = String(userId);
    const bookmarkRows = this.db.prepare(`
      SELECT b.ordinal, b.url, p.post_json
      FROM bookmarks b
      JOIN posts p ON p.post_id = b.post_id
      WHERE b.user_id = ?
      ORDER BY b.ordinal ASC
    `).all(key);
    const authorRows = this.db.prepare(`
      SELECT author_json
      FROM authors
      WHERE user_id = ?
      ORDER BY author_id ASC
    `).all(key);
    return {
      bookmarks: bookmarkRows.map((row) => ({
        position: Number(row.ordinal),
        url: row.url,
        post: JSON.parse(row.post_json),
      })),
      authors: authorRows.map((row) => JSON.parse(row.author_json)),
      stats: this.getStats(key),
    };
  }

  backupSnapshot() {
    const accounts = this.listAccounts();
    const tweets = this.db.prepare(`
      SELECT p.post_id, p.post_json, p.first_seen_at, p.last_seen_at
      FROM posts p
      WHERE EXISTS (SELECT 1 FROM bookmarks b WHERE b.post_id = p.post_id)
      ORDER BY COALESCE(json_extract(p.post_json, '$.created_at'), ''), p.post_id
    `).all().map((row) => ({
      id: String(row.post_id),
      post: JSON.parse(row.post_json),
      firstSeenAt: row.first_seen_at,
      lastSeenAt: row.last_seen_at,
    }));
    const bookmarks = this.db.prepare(`
      SELECT user_id, post_id, ordinal, url, first_seen_at, last_seen_at
      FROM bookmarks
      ORDER BY user_id, ordinal, post_id
    `).all().map((row) => ({
      accountId: String(row.user_id),
      tweetId: String(row.post_id),
      position: Number(row.ordinal),
      url: row.url,
      firstSeenAt: row.first_seen_at,
      lastSeenAt: row.last_seen_at,
    }));
    const authors = this.db.prepare(`
      SELECT user_id, author_id, author_json, last_seen_at
      FROM authors
      ORDER BY user_id, author_id
    `).all().map((row) => ({
      accountId: String(row.user_id),
      authorId: String(row.author_id),
      author: JSON.parse(row.author_json),
      lastSeenAt: row.last_seen_at,
    }));
    return { accounts, tweets, bookmarks, authors };
  }

  briefSnapshot({ account: selector, query = '', limit = 20 } = {}) {
    const account = this.resolveAccount(selector);
    const snapshot = this.snapshot(account.id);
    const normalizedQuery = String(query).trim().toLowerCase();
    const bookmarks = snapshot.bookmarks.filter((bookmark) => {
      if (!normalizedQuery) return true;
      const post = bookmark.post || {};
      const text = post.note_tweet?.text
        || post.note_tweet?.note_tweet_results?.result?.text
        || post.text
        || '';
      return String(text).toLowerCase().includes(normalizedQuery);
    }).slice(0, limit).map((bookmark, position) => ({ ...bookmark, position }));
    return {
      account,
      authors: snapshot.authors,
      bookmarks,
      totalCached: snapshot.bookmarks.length,
      query: String(query).trim(),
    };
  }
}
