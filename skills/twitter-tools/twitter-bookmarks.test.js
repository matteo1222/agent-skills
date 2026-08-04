import assert from 'node:assert/strict';
import { chmodSync, mkdtempSync, readFileSync, statSync, symlinkSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import {
  atomicWrite,
  buildAuthorizeUrl,
  buildBookmarksUrl,
  collectBookmarks,
  loadArchiveSeed,
  parseArgs,
  serializeBrief,
  serializeMarkdown,
  serializePreview,
} from './twitter-bookmarks.js';

test('parseArgs uses script-friendly defaults and environment values', () => {
  const options = parseArgs(['sync', '--include-authors', '--json'], {
    X_CLIENT_ID: 'client-123',
    X_BOOKMARKS_OUTPUT: '/tmp/output',
  });
  assert.equal(options.command, 'sync');
  assert.equal(options.clientId, 'client-123');
  assert.equal(options.includeAuthors, true);
  assert.equal(options.json, true);
  assert.equal(options.outputDir, '/tmp/output');
});

test('parseArgs rejects unknown options', () => {
  assert.throws(() => parseArgs(['--wat'], {}), /Unknown option/);
});

test('parseArgs makes help independent from unrelated options', () => {
  const options = parseArgs(['backup', '--help', '--not-a-real-option'], {});
  assert.equal(options.help, true);
});

test('parseArgs accepts count as a read-only archive command', () => {
  const options = parseArgs(['count'], { X_CLIENT_ID: 'client-123' });
  assert.equal(options.command, 'count');
});

test('parseArgs gives preview a small default and validates explicit limits', () => {
  assert.equal(parseArgs(['preview'], { X_CLIENT_ID: 'client-123' }).limit, 5);
  assert.equal(parseArgs(['preview', '--limit', '2'], { X_CLIENT_ID: 'client-123' }).limit, 2);
  assert.throws(() => parseArgs(['preview', '--limit', '0'], {}), /integer from 1 to 100/);
  assert.throws(() => parseArgs(['preview', '--limit', '101'], {}), /integer from 1 to 100/);
  assert.throws(() => parseArgs(['sync', '--limit', '2'], {}), /only valid with preview or brief/);
});

test('parseArgs supports local backup and bounded brief commands', () => {
  const backup = parseArgs(['backup', '--output', '/tmp/backup'], {});
  assert.equal(backup.command, 'backup');
  assert.equal(backup.outputDir, '/tmp/backup');
  assert.equal(backup.clientId, '');

  const brief = parseArgs(['brief', '--query', 'agents', '--limit', '12', '--output', '/tmp/agents.md'], {});
  assert.equal(brief.command, 'brief');
  assert.equal(brief.query, 'agents');
  assert.equal(brief.limit, 12);
  assert.equal(brief.outputFile, '/tmp/agents.md');
  assert.throws(() => parseArgs(['sync', '--query', 'agents'], {}), /only valid with the brief/);

  const validate = parseArgs(['validate', '--output', '/tmp/backup'], {});
  assert.equal(validate.command, 'validate');
  assert.equal(validate.outputDir, '/tmp/backup');
});

test('parseArgs accepts cache configuration and keeps full reconciliation sync-only', () => {
  const options = parseArgs(['sync', '--full', '--cache', '/tmp/bookmarks.sqlite3'], {
    X_CLIENT_ID: 'client-123',
  });
  assert.equal(options.full, true);
  assert.equal(options.cachePath, '/tmp/bookmarks.sqlite3');
  assert.throws(() => parseArgs(['preview', '--full'], {}), /only valid with the sync/);
});

test('buildAuthorizeUrl requests minimal read scopes and S256 PKCE', () => {
  const url = buildAuthorizeUrl({
    clientId: 'client',
    callback: 'http://127.0.0.1:8787/oauth/callback',
    state: 'state-value',
    codeChallenge: 'challenge-value',
  });
  assert.equal(url.origin, 'https://x.com');
  assert.equal(url.searchParams.get('response_type'), 'code');
  assert.equal(url.searchParams.get('scope'), 'tweet.read users.read bookmark.read offline.access');
  assert.equal(url.searchParams.get('code_challenge_method'), 'S256');
  assert.equal(url.searchParams.get('state'), 'state-value');
});

test('buildBookmarksUrl uses maximum page size and makes authors opt-in', () => {
  const minimal = buildBookmarksUrl('42', { paginationToken: 'next' });
  assert.equal(minimal.searchParams.get('max_results'), '100');
  assert.equal(minimal.searchParams.get('pagination_token'), 'next');
  assert.equal(minimal.searchParams.has('expansions'), false);

  const rich = buildBookmarksUrl('42', { includeAuthors: true });
  assert.equal(rich.searchParams.get('expansions'), 'author_id');
  assert.equal(rich.searchParams.get('user.fields'), 'id,name,username');

  const preview = buildBookmarksUrl('42', { maxResults: 3 });
  assert.equal(preview.searchParams.get('max_results'), '3');
});

test('collectBookmarks paginates, preserves order, and deduplicates posts and authors', async () => {
  const pages = [
    {
      data: [{ id: '1', text: 'one', author_id: 'a' }, { id: '2', text: 'two', author_id: 'b' }],
      includes: { users: [{ id: 'a', username: 'alpha' }] },
      meta: { next_token: 'cursor-2' },
    },
    {
      data: [{ id: '2', text: 'duplicate' }, { id: '3', text: 'three', author_id: 'a' }],
      includes: { users: [{ id: 'a', username: 'alpha' }] },
      errors: [{ detail: 'partial warning' }],
      meta: {},
    },
  ];
  const requested = [];
  const result = await collectBookmarks({
    userId: 'user',
    includeAuthors: true,
    requestPage: async (url) => {
      requested.push(url);
      return pages.shift();
    },
  });
  assert.deepEqual(result.bookmarks.map((bookmark) => bookmark.post.id), ['1', '2', '3']);
  assert.equal(result.bookmarks[2].position, 2);
  assert.equal(result.authors.length, 1);
  assert.equal(result.warnings.length, 1);
  assert.equal(result.pages, 2);
  assert.equal(requested[1].searchParams.get('pagination_token'), 'cursor-2');
});

test('collectBookmarks rejects a repeated pagination token', async () => {
  await assert.rejects(
    collectBookmarks({
      userId: 'user',
      requestPage: async () => ({ data: [], meta: { next_token: 'same' } }),
    }),
    /repeated pagination token/,
  );
});

test('collectBookmarks stops at a preview limit without requesting another page', async () => {
  let requests = 0;
  const result = await collectBookmarks({
    userId: 'user',
    limit: 2,
    requestPage: async (url) => {
      requests += 1;
      assert.equal(url.searchParams.get('max_results'), '2');
      return {
        data: [{ id: '1', text: 'one' }, { id: '2', text: 'two' }],
        meta: { next_token: 'unused-next-page' },
      };
    },
  });
  assert.equal(requests, 1);
  assert.deepEqual(result.bookmarks.map((bookmark) => bookmark.post.id), ['1', '2']);
});

test('collectBookmarks stops after an all-cached page during incremental sync', async () => {
  const pages = [
    {
      data: [{ id: '3' }, { id: '2' }],
      meta: { next_token: 'second' },
    },
    {
      data: [{ id: '2' }, { id: '1' }],
      meta: { next_token: 'old-tail' },
    },
  ];
  const result = await collectBookmarks({
    userId: 'user',
    knownIds: new Set(['1', '2']),
    stopAtKnownPage: true,
    requestPage: async () => pages.shift(),
  });
  assert.deepEqual(result.bookmarks.map((bookmark) => bookmark.post.id), ['3', '2', '1']);
  assert.equal(result.pages, 2);
  assert.equal(result.resourcesRead, 4);
  assert.equal(result.newBookmarks, 1);
  assert.equal(result.reachedEnd, false);
  assert.equal(result.stopReason, 'cache-boundary');
});

test('collectBookmarks marks an all-cached final page as fully reconciled', async () => {
  const result = await collectBookmarks({
    userId: 'user',
    knownIds: new Set(['1']),
    stopAtKnownPage: true,
    requestPage: async () => ({ data: [{ id: '1' }], meta: {} }),
  });
  assert.equal(result.reachedEnd, true);
  assert.equal(result.stopReason, 'end');
});

test('serializeMarkdown uses blockquotes so post markup remains source text', () => {
  const markdown = serializeMarkdown({
    exportedAt: '2026-07-22T10:00:00.000Z',
    source: { complete: true, currentStateVerified: true },
    account: { id: 'u', username: 'me' },
    authors: [{ id: 'a', name: 'Author', username: 'author' }],
    bookmarks: [{
      position: 0,
      url: 'https://x.com/i/status/1',
      post: { id: '1', author_id: 'a', created_at: 'today', text: '# heading\nsecond line' },
    }],
  });
  assert.match(markdown, /Author \(@author\)/);
  assert.match(markdown, /> # heading\n> second line/);
});

test('serializeBrief is bounded derived Markdown and identifies local-only rendering', () => {
  const markdown = serializeBrief({
    renderedAt: '2026-07-23T10:00:00.000Z',
    query: 'sqlite',
    totalCached: 100,
    account: { id: 'u', username: 'me' },
    authors: [],
    bookmarks: [{
      position: 0,
      url: 'https://x.com/i/status/1',
      post: { id: '1', text: '# local', created_at: 'today' },
    }],
  });
  assert.match(markdown, /# X bookmarks: sqlite/);
  assert.match(markdown, /Rendered 1 of 100 cached bookmarks/);
  assert.match(markdown, /did not call X/);
  assert.match(markdown, /> # local/);
});

test('serializePreview reports no writes and keeps post markup quoted', () => {
  const markdown = serializePreview({
    account: { username: 'me' },
    authors: [],
    items: [{
      position: 0,
      url: 'https://x.com/i/status/1',
      post: { id: '1', author_id: 'a', created_at: 'today', text: '# heading' },
    }],
    estimatedOwnedReadCostUsd: 0.001,
  });
  assert.match(markdown, /Returned 1 bookmark\. No archive files were written\./);
  assert.match(markdown, /> # heading/);
});

test('loadArchiveSeed imports a matching paid archive and rejects another account', () => {
  const directory = mkdtempSync(join(tmpdir(), 'x-bookmarks-seed-'));
  writeFileSync(join(directory, 'bookmarks.json'), JSON.stringify({
    exportedAt: '2026-07-21T00:00:00.000Z',
    account: { id: 'user' },
    authors: [],
    bookmarks: [{ position: 0, url: 'https://x.com/i/status/1', post: { id: '1' } }],
  }));
  const seed = loadArchiveSeed(directory, 'user');
  assert.equal(seed.bookmarks[0].post.id, '1');
  assert.equal(seed.syncedAt, '2026-07-21T00:00:00.000Z');
  assert.throws(() => loadArchiveSeed(directory, 'someone-else'), /different X account/);
});

test('atomicWrite replaces a file and restricts it to the owner', () => {
  const directory = mkdtempSync(join(tmpdir(), 'x-bookmarks-test-'));
  const path = join(directory, 'archive.json');
  atomicWrite(path, 'first\n');
  chmodSync(path, 0o644);
  atomicWrite(path, 'second\n');
  assert.equal(readFileSync(path, 'utf8'), 'second\n');
  assert.equal(statSync(path).mode & 0o777, 0o600);
});

test('CLI executes main when launched through an npm-style symlink', () => {
  const directory = mkdtempSync(join(tmpdir(), 'twitter-bookmarks-bin-'));
  const command = join(directory, 'twitter-bookmarks');
  symlinkSync(new URL('./twitter-bookmarks.js', import.meta.url), command);
  const result = spawnSync(process.execPath, [command, '--help'], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Usage:\n  twitter-bookmarks/);
});
