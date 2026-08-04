#!/usr/bin/env node

import { createHash, randomBytes } from 'node:crypto';
import { once } from 'node:events';
import {
  closeSync,
  existsSync,
  fsyncSync,
  mkdirSync,
  openSync,
  readFileSync,
  realpathSync,
  renameSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import { createServer } from 'node:http';
import { basename, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn, spawnSync } from 'node:child_process';

import { validateBookmarkBackup, writeBookmarkBackup } from './lib/bookmark-backup.js';
import { BookmarkCache, DEFAULT_BOOKMARK_CACHE_PATH } from './lib/bookmark-cache.js';

const DEFAULT_OUTPUT_DIR = resolve(process.cwd(), 'evergreen', 'references', 'x-bookmarks');
const DEFAULT_CALLBACK = 'http://127.0.0.1:8787/oauth/callback';
const KEYCHAIN_SERVICE = 'knowledge.x-bookmarks.oauth';
const AUTH_ENDPOINT = 'https://x.com/i/oauth2/authorize';
const TOKEN_ENDPOINT = 'https://api.x.com/2/oauth2/token';
const REVOKE_ENDPOINT = 'https://api.x.com/2/oauth2/revoke';
const API_BASE = 'https://api.x.com/2';
const OAUTH_SCOPES = ['tweet.read', 'users.read', 'bookmark.read', 'offline.access'];
const BOOKMARK_FIELDS = [
  'attachments',
  'author_id',
  'conversation_id',
  'created_at',
  'edit_history_tweet_ids',
  'entities',
  'lang',
  'note_tweet',
  'possibly_sensitive',
  'public_metrics',
  'referenced_tweets',
];

class CliError extends Error {
  constructor(message, exitCode = 1) {
    super(message);
    this.exitCode = exitCode;
  }
}

function valueAfterEquals(argument) {
  const index = argument.indexOf('=');
  return index === -1 ? undefined : argument.slice(index + 1);
}

export function parseArgs(argv, env = process.env) {
  const options = {
    command: 'sync',
    clientId: env.X_CLIENT_ID || '',
    callback: env.X_BOOKMARKS_CALLBACK || DEFAULT_CALLBACK,
    outputDir: env.X_BOOKMARKS_OUTPUT || DEFAULT_OUTPUT_DIR,
    cachePath: env.X_BOOKMARKS_CACHE || DEFAULT_BOOKMARK_CACHE_PATH,
    limit: undefined,
    includeAuthors: false,
    dryRun: false,
    json: false,
    quiet: false,
    force: false,
    full: false,
    account: '',
    query: '',
    outputProvided: false,
    outputFile: null,
    help: false,
  };
  const commands = new Set([
    'sync',
    'backup',
    'validate',
    'brief',
    'preview',
    'count',
    'login',
    'status',
    'logout',
    'help',
  ]);
  if (argv.includes('-h') || argv.includes('--help') || argv[0] === 'help') {
    options.help = true;
    options.outputDir = resolve(options.outputDir);
    options.cachePath = resolve(options.cachePath);
    return options;
  }
  let commandSeen = false;

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (!argument.startsWith('-')) {
      if (commandSeen || !commands.has(argument)) {
        throw new CliError(`Unexpected argument: ${argument}`, 2);
      }
      options.command = argument;
      options.help ||= argument === 'help';
      commandSeen = true;
      continue;
    }

    const takeValue = (name) => {
      const inline = valueAfterEquals(argument);
      if (inline !== undefined) return inline;
      const next = argv[index + 1];
      if (!next || next.startsWith('-')) throw new CliError(`${name} requires a value`, 2);
      index += 1;
      return next;
    };

    if (argument === '-h' || argument === '--help') options.help = true;
    else if (argument === '--dry-run' || argument === '-n') options.dryRun = true;
    else if (argument === '--json') options.json = true;
    else if (argument === '--quiet' || argument === '-q') options.quiet = true;
    else if (argument === '--force' || argument === '-f') options.force = true;
    else if (argument === '--full') options.full = true;
    else if (argument === '--include-authors') options.includeAuthors = true;
    else if (argument === '--account' || argument.startsWith('--account=')) {
      options.account = takeValue('--account');
    }
    else if (argument === '--query' || argument.startsWith('--query=')) {
      options.query = takeValue('--query');
    }
    else if (argument === '--limit' || argument === '-l' || argument.startsWith('--limit=')) {
      options.limit = Number(takeValue('--limit'));
    }
    else if (argument === '--client-id' || argument.startsWith('--client-id=')) {
      options.clientId = takeValue('--client-id');
    } else if (argument === '--callback' || argument.startsWith('--callback=')) {
      options.callback = takeValue('--callback');
    } else if (argument === '--output' || argument === '-o' || argument.startsWith('--output=')) {
      options.outputDir = takeValue('--output');
      options.outputProvided = true;
    } else if (argument === '--cache' || argument.startsWith('--cache=')) {
      options.cachePath = takeValue('--cache');
    } else {
      throw new CliError(`Unknown option: ${argument}`, 2);
    }
  }

  if (options.command === 'preview') options.limit ??= 5;
  else if (options.command === 'brief') options.limit ??= 20;
  else if (options.limit !== undefined) throw new CliError('--limit is only valid with preview or brief.', 2);
  if (options.limit !== undefined && (!Number.isInteger(options.limit) || options.limit < 1 || options.limit > 100)) {
    throw new CliError('--limit must be an integer from 1 to 100.', 2);
  }
  if (options.full && options.command !== 'sync') throw new CliError('--full is only valid with the sync command.', 2);
  if (options.query && options.command !== 'brief') throw new CliError('--query is only valid with the brief command.', 2);
  if (options.account && options.command !== 'brief') throw new CliError('--account is only valid with the brief command.', 2);
  if (options.command === 'brief') {
    options.outputFile = options.outputProvided ? resolve(options.outputDir) : null;
  }
  options.outputDir = resolve(options.outputDir);
  options.cachePath = resolve(options.cachePath);
  return options;
}

export function helpText() {
  return `Sync private X bookmarks into SQLite, then back up or render them locally.

Usage:
  twitter-bookmarks [sync] --client-id <id> [options]
  twitter-bookmarks backup [--output <dir>] [--cache <path>]
  twitter-bookmarks validate [--output <dir>]
  twitter-bookmarks brief [--query <text>] [--limit <1-100>] [--output <file>]
  twitter-bookmarks preview [--limit <1-100>] --client-id <id>
  twitter-bookmarks count --client-id <id>
  twitter-bookmarks login --client-id <id>
  twitter-bookmarks status --client-id <id>
  twitter-bookmarks logout --client-id <id> [--force]

Commands:
  sync       Fetch bookmarks into the canonical SQLite cache (default; no export files)
  backup     Export cached data locally as deterministic, sharded JSONL plus a manifest
  validate   Verify every JSONL row, byte count, row count, SHA-256, and backup hash
  brief      Render up to 20 cached bookmarks as Markdown; optionally filter with --query
  preview    Fetch and print a small first page without writing files (default limit: 5)
  count      Fetch all pages and report the exact unique count without writing files
  login      Complete OAuth 2.0 PKCE login and store the token set in macOS Keychain
  status     Show local token and SQLite cache metadata without secrets or X calls
  logout     Revoke the token when possible and remove it from macOS Keychain

Options:
  --client-id <id>       X OAuth 2.0 Client ID (or X_CLIENT_ID)
  --callback <url>       Exact registered callback URL (default: ${DEFAULT_CALLBACK})
  -o, --output <path>    Backup directory, brief file, or legacy seed directory
  --cache <path>         SQLite cache (default: ~/.cache/twitter-tools/private/bookmarks.sqlite3)
  --account <id|handle>  Cached account for brief when SQLite contains multiple accounts
  --query <text>         Case-insensitive bookmark text filter for brief
  -l, --limit <1-100>    Preview limit (default: 5) or brief limit (default: 20)
  --include-authors      Expand author profiles; may add billable User resources
  --full                 Scan every page and reconcile removed bookmarks during sync
  -n, --dry-run          Validate and print the plan without Keychain, browser, API, or file writes
  --json                 Print the final command summary as JSON
  -q, --quiet            Hide progress messages
  -f, --force            Skip logout confirmation or force a fresh login
  -h, --help             Show this help

Examples:
  X_CLIENT_ID=abc twitter-bookmarks --dry-run
  X_CLIENT_ID=abc twitter-bookmarks preview --limit 5
  X_CLIENT_ID=abc twitter-bookmarks preview --limit 5 --json
  X_CLIENT_ID=abc twitter-bookmarks count
  X_CLIENT_ID=abc twitter-bookmarks sync
  X_CLIENT_ID=abc twitter-bookmarks sync --full
  twitter-bookmarks backup --output ./evergreen/references/x-bookmarks
  twitter-bookmarks validate --output ./evergreen/references/x-bookmarks
  twitter-bookmarks brief --query "local first" --limit 20
  twitter-bookmarks brief --query "agents" --output ./research/x-agents.md

Note:
  X exposes a per-page result_count, not a collection-wide count. The count command must
  read every bookmark page; an incremental cached sync can read less. Running count before
  a first or full sync repeats those reads.
  Sync uses SQLite to stop after an all-cached page. Use sync --full periodically to detect
  old bookmarks removed from X and reconcile the cache exactly.
  Backup, validate, and brief are local-only: they never read X or Keychain. Backup owns only
  manifest.json and data/ inside its dedicated output directory.
`;
}

function validateOptions(options) {
  if (options.command === 'backup' || options.command === 'validate' || options.command === 'brief') return null;
  if (!options.clientId) throw new CliError('Missing X Client ID. Pass --client-id or set X_CLIENT_ID.', 2);
  let callback;
  try {
    callback = new URL(options.callback);
  } catch {
    throw new CliError(`Invalid callback URL: ${options.callback}`, 2);
  }
  if (callback.protocol !== 'http:' || callback.hostname !== '127.0.0.1' || !callback.port) {
    throw new CliError('The callback must be an http://127.0.0.1:<port>/... loopback URL.', 2);
  }
  if (process.platform !== 'darwin' && !options.dryRun) {
    throw new CliError('This token-store implementation currently requires macOS Keychain.', 2);
  }
  return callback;
}

function log(options, message) {
  if (!options.quiet) process.stderr.write(`${message}\n`);
}

function keychainResult(args) {
  return spawnSync('/usr/bin/security', args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

export function readTokenSet(clientId) {
  const result = keychainResult(['find-generic-password', '-a', clientId, '-s', KEYCHAIN_SERVICE, '-w']);
  if (result.status !== 0) {
    if (result.status === 44 || /could not be found/i.test(result.stderr || '')) return null;
    throw new CliError(`Could not read OAuth tokens from Keychain: ${(result.stderr || '').trim() || 'unknown error'}`);
  }
  try {
    return JSON.parse(result.stdout.trim());
  } catch {
    throw new CliError('The stored X OAuth token set is malformed. Run logout, then login again.');
  }
}

export function writeTokenSet(clientId, tokenSet) {
  const serialized = JSON.stringify(tokenSet);
  const result = keychainResult([
    'add-generic-password',
    '-a', clientId,
    '-s', KEYCHAIN_SERVICE,
    '-l', 'Knowledge X Bookmarks OAuth',
    '-j', 'OAuth tokens for the personal X bookmarks source archive',
    '-T', '',
    '-U',
    '-w', serialized,
  ]);
  if (result.status !== 0) {
    throw new CliError(`Could not store OAuth tokens in Keychain: ${(result.stderr || '').trim() || 'unknown error'}`);
  }
}

export function deleteTokenSet(clientId) {
  const result = keychainResult(['delete-generic-password', '-a', clientId, '-s', KEYCHAIN_SERVICE]);
  if (result.status !== 0 && result.status !== 44 && !/could not be found/i.test(result.stderr || '')) {
    throw new CliError(`Could not delete OAuth tokens from Keychain: ${(result.stderr || '').trim() || 'unknown error'}`);
  }
}

function base64Url(buffer) {
  return Buffer.from(buffer).toString('base64url');
}

export function buildAuthorizeUrl({ clientId, callback, state, codeChallenge }) {
  const url = new URL(AUTH_ENDPOINT);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('redirect_uri', callback);
  url.searchParams.set('scope', OAUTH_SCOPES.join(' '));
  url.searchParams.set('state', state);
  url.searchParams.set('code_challenge', codeChallenge);
  url.searchParams.set('code_challenge_method', 'S256');
  return url;
}

async function fetchWithTimeout(url, init = {}, timeoutMs = 30_000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(new Error(`Request timed out after ${timeoutMs}ms`)), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

async function parseResponse(response) {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    throw new CliError(`X returned a non-JSON response (HTTP ${response.status}).`);
  }
}

async function tokenRequest(form) {
  const response = await fetchWithTimeout(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(form),
  });
  const body = await parseResponse(response);
  if (!response.ok || !body.access_token) {
    const detail = body.error_description || body.error || `HTTP ${response.status}`;
    throw new CliError(`X OAuth token exchange failed: ${detail}`);
  }
  return body;
}

function normalizeTokenResponse(body, previous, options) {
  return {
    access_token: body.access_token,
    refresh_token: body.refresh_token || previous?.refresh_token,
    token_type: body.token_type || 'bearer',
    scope: body.scope || previous?.scope || OAUTH_SCOPES.join(' '),
    expires_at: Date.now() + Number(body.expires_in || 7200) * 1000,
    client_id: options.clientId,
    redirect_uri: options.callback,
    user: previous?.user,
    updated_at: new Date().toISOString(),
  };
}

async function waitForOAuthCallback(callbackUrl, expectedState, options) {
  const callback = new URL(callbackUrl);
  let settle;
  const callbackPromise = new Promise((resolvePromise, rejectPromise) => {
    settle = { resolve: resolvePromise, reject: rejectPromise };
  });
  const server = createServer((request, response) => {
    const requestUrl = new URL(request.url || '/', callback.origin);
    if (requestUrl.pathname !== callback.pathname) {
      response.writeHead(404).end('Not found');
      return;
    }
    const state = requestUrl.searchParams.get('state');
    const code = requestUrl.searchParams.get('code');
    const error = requestUrl.searchParams.get('error');
    if (state !== expectedState) {
      response.writeHead(400, { 'content-type': 'text/plain; charset=utf-8' }).end('State mismatch. Return to the terminal.');
      settle.reject(new CliError('OAuth state mismatch; authorization was rejected.'));
      return;
    }
    if (error || !code) {
      response.writeHead(400, { 'content-type': 'text/plain; charset=utf-8' }).end('Authorization was not completed. Return to the terminal.');
      settle.reject(new CliError(`X authorization failed: ${error || 'missing authorization code'}`));
      return;
    }
    response.writeHead(200, { 'content-type': 'text/plain; charset=utf-8' }).end('X authorization complete. You can close this tab.');
    settle.resolve(code);
  });
  server.listen(Number(callback.port), callback.hostname);
  await once(server, 'listening');
  log(options, `Waiting for X authorization at ${callbackUrl}`);

  const timer = setTimeout(() => settle.reject(new CliError('Timed out waiting for X authorization.')), 5 * 60_000);
  try {
    return await callbackPromise;
  } finally {
    clearTimeout(timer);
    server.close();
  }
}

async function login(options) {
  const callback = validateOptions(options);
  const state = base64Url(randomBytes(32));
  const codeVerifier = base64Url(randomBytes(64));
  const codeChallenge = base64Url(createHash('sha256').update(codeVerifier).digest());
  const authorizeUrl = buildAuthorizeUrl({
    clientId: options.clientId,
    callback: options.callback,
    state,
    codeChallenge,
  });

  const callbackPromise = waitForOAuthCallback(callback.toString(), state, options);
  const opener = spawn('/usr/bin/open', [authorizeUrl.toString()], { detached: true, stdio: 'ignore' });
  opener.on('error', () => log(options, `Open this URL in a browser:\n${authorizeUrl}`));
  opener.unref();
  log(options, 'Opening X authorization in your browser…');

  const code = await callbackPromise;
  const body = await tokenRequest({
    code,
    grant_type: 'authorization_code',
    client_id: options.clientId,
    redirect_uri: options.callback,
    code_verifier: codeVerifier,
  });
  const tokens = normalizeTokenResponse(body, null, options);
  writeTokenSet(options.clientId, tokens);
  log(options, 'Stored the OAuth token set in macOS Keychain.');
  return tokens;
}

async function refreshTokens(tokens, options) {
  if (!tokens.refresh_token) throw new CliError('No refresh token is stored. Run login again.');
  const body = await tokenRequest({
    refresh_token: tokens.refresh_token,
    grant_type: 'refresh_token',
    client_id: options.clientId,
  });
  const next = normalizeTokenResponse(body, tokens, options);
  writeTokenSet(options.clientId, next);
  return next;
}

function sleep(ms) {
  return new Promise((resolvePromise) => setTimeout(resolvePromise, ms));
}

function retryDelayFrom(response, attempt) {
  const reset = Number(response.headers.get('x-rate-limit-reset')) * 1000;
  if (response.status === 429 && Number.isFinite(reset) && reset > Date.now()) {
    return Math.min(reset - Date.now() + 1_000, 15 * 60_000);
  }
  return Math.min(1_000 * 2 ** attempt, 30_000);
}

function createSession(initialTokens, options) {
  return {
    tokens: initialTokens,
    async ensureFresh() {
      if (Number(this.tokens.expires_at || 0) <= Date.now() + 60_000) {
        log(options, 'Refreshing X access token…');
        this.tokens = await refreshTokens(this.tokens, options);
      }
    },
    async requestJson(url) {
      let refreshedAfterUnauthorized = false;
      for (let attempt = 0; attempt < 6; attempt += 1) {
        await this.ensureFresh();
        let response;
        try {
          response = await fetchWithTimeout(url, {
            headers: { authorization: `Bearer ${this.tokens.access_token}` },
          });
        } catch (error) {
          if (attempt >= 5) throw new CliError(`X request failed: ${error instanceof Error ? error.message : String(error)}`);
          const delay = Math.min(1_000 * 2 ** attempt, 30_000);
          log(options, `Network error; retrying in ${Math.ceil(delay / 1000)}s…`);
          await sleep(delay);
          continue;
        }

        if (response.status === 401 && !refreshedAfterUnauthorized && this.tokens.refresh_token) {
          refreshedAfterUnauthorized = true;
          this.tokens = await refreshTokens(this.tokens, options);
          continue;
        }
        if (response.status === 429 || response.status >= 500) {
          if (attempt >= 5) {
            const body = await parseResponse(response);
            throw new CliError(`X request failed after retries: ${body.detail || body.title || `HTTP ${response.status}`}`);
          }
          const delay = retryDelayFrom(response, attempt);
          log(options, `X returned HTTP ${response.status}; retrying in ${Math.ceil(delay / 1000)}s…`);
          await sleep(delay);
          continue;
        }

        const body = await parseResponse(response);
        if (!response.ok) {
          const detail = body.detail || body.title || body.error_description || `HTTP ${response.status}`;
          throw new CliError(`X API request failed: ${detail}`);
        }
        return body;
      }
      throw new CliError('X API request exhausted its retry budget.');
    },
  };
}

export function buildBookmarksUrl(userId, { paginationToken, includeAuthors = false, maxResults = 100 } = {}) {
  const url = new URL(`${API_BASE}/users/${encodeURIComponent(userId)}/bookmarks`);
  url.searchParams.set('max_results', String(maxResults));
  url.searchParams.set('tweet.fields', BOOKMARK_FIELDS.join(','));
  if (paginationToken) url.searchParams.set('pagination_token', paginationToken);
  if (includeAuthors) {
    url.searchParams.set('expansions', 'author_id');
    url.searchParams.set('user.fields', 'id,name,username');
  }
  return url;
}

export async function collectBookmarks({
  userId,
  includeAuthors,
  limit = Infinity,
  knownIds = new Set(),
  stopAtKnownPage = false,
  requestPage,
  onPage = () => {},
}) {
  const bookmarks = [];
  const authors = new Map();
  const warnings = [];
  const seenPostIds = new Set();
  const seenTokens = new Set();
  let paginationToken;
  let pages = 0;
  let resourcesRead = 0;
  let newBookmarks = 0;
  let reachedEnd = false;
  let stopReason = 'end';

  while (true) {
    const maxResults = Math.min(100, limit - bookmarks.length);
    const url = buildBookmarksUrl(userId, { paginationToken, includeAuthors, maxResults });
    const body = await requestPage(url);
    pages += 1;
    if (body.errors) warnings.push(...body.errors);
    const pagePosts = Array.isArray(body.data) ? body.data : [];
    resourcesRead += pagePosts.length;
    if (!Array.isArray(body.data) && body.errors?.length) {
      throw new CliError(`Bookmark page ${pages} returned errors without data.`);
    }
    let pageNewBookmarks = 0;
    for (const post of pagePosts) {
      if (bookmarks.length >= limit) break;
      if (!post?.id || seenPostIds.has(String(post.id))) continue;
      const postId = String(post.id);
      seenPostIds.add(postId);
      if (!knownIds.has(postId)) {
        newBookmarks += 1;
        pageNewBookmarks += 1;
      }
      bookmarks.push({
        position: bookmarks.length,
        url: `https://x.com/i/status/${post.id}`,
        post,
      });
    }
    for (const author of body.includes?.users || []) {
      if (author?.id) authors.set(String(author.id), author);
    }
    onPage({ pages, pageCount: pagePosts.length, pageNewBookmarks, total: bookmarks.length });

    const nextToken = body.meta?.next_token;
    if (bookmarks.length >= limit) {
      reachedEnd = !nextToken;
      stopReason = reachedEnd ? 'end' : 'limit';
      break;
    }
    if (!nextToken) {
      reachedEnd = true;
      stopReason = 'end';
      break;
    }
    if (stopAtKnownPage && pagePosts.length > 0 && pageNewBookmarks === 0) {
      stopReason = 'cache-boundary';
      break;
    }
    if (seenTokens.has(nextToken)) throw new CliError(`X returned a repeated pagination token on page ${pages}.`);
    seenTokens.add(nextToken);
    paginationToken = nextToken;
  }

  return {
    bookmarks,
    authors: [...authors.values()],
    warnings,
    pages,
    resourcesRead,
    newBookmarks,
    reachedEnd,
    stopReason,
  };
}

function longText(post) {
  return post?.note_tweet?.text || post?.note_tweet?.note_tweet_results?.result?.text || post?.text || '';
}

function markdownBlockquote(value) {
  return String(value || '')
    .replaceAll('\r\n', '\n')
    .replaceAll('\r', '\n')
    .split('\n')
    .map((line) => `> ${line}`)
    .join('\n');
}

export function serializeMarkdown(archive) {
  const authorById = new Map((archive.authors || []).map((author) => [String(author.id), author]));
  const lines = [
    '---',
    'tags: [x, bookmarks, source-archive]',
    `updated: ${archive.exportedAt.slice(0, 10)}`,
    `source: https://api.x.com/2/users/${archive.account.id}/bookmarks`,
    `account: "@${String(archive.account.username || '').replaceAll('"', '\\"')}"`,
    `count: ${archive.bookmarks.length}`,
    `complete: ${Boolean(archive.source.complete)}`,
    `current_state_verified: ${Boolean(archive.source.currentStateVerified)}`,
    '---',
    '',
    '# X bookmarks source archive',
    '',
    `Rendered ${archive.bookmarks.length} cached bookmarks for @${archive.account.username} on ${archive.exportedAt}.`,
    '',
    'This is a generated source capture. Curate durable ideas into separate reference or evergreen notes rather than editing this file.',
    '',
  ];

  for (const bookmark of archive.bookmarks) {
    const post = bookmark.post;
    const author = authorById.get(String(post.author_id));
    const authorLabel = author ? `${author.name} (@${author.username})` : `X user ID ${post.author_id || 'unknown'}`;
    lines.push(
      `## ${bookmark.position + 1}. ${post.id}`,
      '',
      `- **Source:** ${bookmark.url}`,
      `- **Author:** ${authorLabel}`,
      `- **Created:** ${post.created_at || 'unknown'}`,
      '',
      markdownBlockquote(longText(post)),
      '',
    );
  }
  return `${lines.join('\n').trimEnd()}\n`;
}

export function serializeBrief(brief) {
  const authorById = new Map((brief.authors || []).map((author) => [String(author.id), author]));
  const title = brief.query ? `X bookmarks: ${brief.query}` : 'Recent X bookmarks';
  const lines = [
    '---',
    'tags: [x, bookmarks, research-brief]',
    `updated: ${brief.renderedAt.slice(0, 10)}`,
    `account: "@${String(brief.account.username || '').replaceAll('"', '\\"')}"`,
    `cached_count: ${brief.totalCached}`,
    `returned: ${brief.bookmarks.length}`,
    ...(brief.query ? [`query: ${JSON.stringify(brief.query)}`] : []),
    '---',
    '',
    `# ${title}`,
    '',
    `Rendered ${brief.bookmarks.length} of ${brief.totalCached} cached bookmarks for @${brief.account.username || brief.account.id}.`,
    'This derived brief was generated entirely from local SQLite and did not call X.',
    '',
  ];
  for (const bookmark of brief.bookmarks) {
    const post = bookmark.post;
    const author = authorById.get(String(post.author_id));
    const authorLabel = author ? `${author.name} (@${author.username})` : `X user ID ${post.author_id || 'unknown'}`;
    lines.push(
      `## ${bookmark.position + 1}. ${post.id}`,
      '',
      `- **Source:** ${bookmark.url}`,
      `- **Author:** ${authorLabel}`,
      `- **Created:** ${post.created_at || 'unknown'}`,
      '',
      markdownBlockquote(longText(post)),
      '',
    );
  }
  return `${lines.join('\n').trimEnd()}\n`;
}

export function serializePreview(preview) {
  const authorById = new Map((preview.authors || []).map((author) => [String(author.id), author]));
  const lines = [
    `# X bookmark preview for @${preview.account.username}`,
    '',
    `Returned ${preview.items.length} bookmark${preview.items.length === 1 ? '' : 's'}. No archive files were written.`,
    '',
  ];
  for (const bookmark of preview.items) {
    const post = bookmark.post;
    const author = authorById.get(String(post.author_id));
    const authorLabel = author ? `${author.name} (@${author.username})` : `X user ID ${post.author_id || 'unknown'}`;
    lines.push(
      `## ${bookmark.position + 1}. ${post.id}`,
      '',
      `- **Source:** ${bookmark.url}`,
      `- **Author:** ${authorLabel}`,
      `- **Created:** ${post.created_at || 'unknown'}`,
      '',
      markdownBlockquote(longText(post)),
      '',
    );
  }
  lines.push(`Approximate base Owned Read cost: $${preview.estimatedOwnedReadCostUsd.toFixed(3)}`, '');
  return lines.join('\n');
}

export function atomicWrite(path, contents, mode = 0o600) {
  mkdirSync(dirname(path), { recursive: true, mode: 0o700 });
  const temporary = resolve(dirname(path), `.${basename(path)}.${process.pid}.${randomBytes(6).toString('hex')}.tmp`);
  let descriptor;
  try {
    descriptor = openSync(temporary, 'wx', mode);
    writeFileSync(descriptor, contents, 'utf8');
    fsyncSync(descriptor);
    closeSync(descriptor);
    descriptor = undefined;
    renameSync(temporary, path);
  } catch (error) {
    if (descriptor !== undefined) closeSync(descriptor);
    try { unlinkSync(temporary); } catch {}
    throw error;
  }
}

export function loadArchiveSeed(outputDir, userId) {
  const path = resolve(outputDir, 'bookmarks.json');
  if (!existsSync(path)) return null;
  let archive;
  try {
    archive = JSON.parse(readFileSync(path, 'utf8'));
  } catch (error) {
    throw new CliError(`Could not parse the existing bookmark archive at ${path}: ${error.message}`);
  }
  if (String(archive.account?.id || '') !== String(userId)) {
    throw new CliError(`Existing bookmark archive belongs to a different X account: ${path}`);
  }
  if (!Array.isArray(archive.bookmarks) || archive.bookmarks.some((item) => !item?.post?.id)) {
    throw new CliError(`Existing bookmark archive has an unsupported bookmarks structure: ${path}`);
  }
  if (archive.source?.complete === false) {
    throw new CliError(`Existing bookmark archive is marked incomplete and cannot safely seed SQLite: ${path}`);
  }
  return {
    path,
    syncedAt: archive.source?.lastFullSyncAt || archive.exportedAt || new Date().toISOString(),
    bookmarks: archive.bookmarks,
    authors: Array.isArray(archive.authors) ? archive.authors : [],
  };
}

async function bookmarkContext(options, tokenSet) {
  const session = createSession(tokenSet, options);
  let account = session.tokens.user;
  if (!account?.id) {
    log(options, 'Resolving the authenticated X account…');
    const meResponse = await session.requestJson(`${API_BASE}/users/me?user.fields=id,name,username`);
    if (!meResponse.data?.id) throw new CliError('X did not return an authenticated user ID.');
    account = meResponse.data;
    session.tokens.user = account;
    writeTokenSet(options.clientId, session.tokens);
  } else {
    log(options, `Using the authenticated account saved with this token: @${account.username || account.id}`);
  }
  return { session, account };
}

async function fetchBookmarkCollection(options, tokenSet, cache = null) {
  const { session, account } = await bookmarkContext(options, tokenSet);
  if (cache && cache.getBookmarkIds(account.id).size === 0) {
    const seed = loadArchiveSeed(options.outputDir, account.id);
    if (seed) {
      cache.merge(account, { bookmarks: seed.bookmarks, authors: seed.authors }, {
        currentStateVerified: true,
        syncedAt: seed.syncedAt,
      });
      log(options, `Seeded SQLite with ${seed.bookmarks.length} bookmarks from ${seed.path}.`);
    }
  }
  const knownIds = cache && !options.full ? cache.getBookmarkIds(account.id) : new Set();
  const incremental = Boolean(cache && knownIds.size > 0 && !options.full);
  log(
    options,
    incremental
      ? `Incremental sync for @${account.username}; ${knownIds.size} bookmark IDs are cached.`
      : `Fetching all bookmarks for @${account.username} in pages of 100…`,
  );
  if (options.includeAuthors) {
    log(options, 'Author expansions are enabled; X may bill returned User resources separately.');
  }
  const result = await collectBookmarks({
    userId: account.id,
    includeAuthors: options.includeAuthors,
    knownIds,
    stopAtKnownPage: incremental,
    requestPage: (url) => session.requestJson(url),
    onPage: ({ pages, pageCount, pageNewBookmarks, total }) => log(
      options,
      `Page ${pages}: ${pageCount} returned, ${pageNewBookmarks} not cached, ${total} selected`,
    ),
  });
  if (result.reachedEnd) {
    log(options, `Reached the end after ${result.pages} pages; current X state can be reconciled exactly.`);
  } else {
    log(options, `Stopped at an all-cached page after ${result.pages} pages; the old cached tail was not downloaded again.`);
  }
  return { account, result, cachedBefore: knownIds.size };
}

function ownedReadEstimate(bookmarkCount) {
  return Number((bookmarkCount * 0.001).toFixed(3));
}

async function previewBookmarks(options, tokenSet) {
  const { session, account } = await bookmarkContext(options, tokenSet);
  log(options, `Fetching up to ${options.limit} bookmarks for @${account.username}…`);
  if (options.includeAuthors) {
    log(options, 'Author expansions are enabled; X may bill returned User resources separately.');
  }
  const result = await collectBookmarks({
    userId: account.id,
    includeAuthors: options.includeAuthors,
    limit: options.limit,
    requestPage: (url) => session.requestJson(url),
    onPage: ({ pageCount, total }) => log(options, `Preview page: ${pageCount} returned, ${total} unique selected`),
  });
  return {
    ok: true,
    mode: 'preview',
    account,
    limit: options.limit,
    returned: result.bookmarks.length,
    warnings: result.warnings,
    authors: result.authors,
    items: result.bookmarks,
    estimatedOwnedReadCostUsd: ownedReadEstimate(result.resourcesRead),
  };
}

async function countBookmarks(options, tokenSet) {
  const { account, result } = await fetchBookmarkCollection(options, tokenSet);
  return {
    ok: true,
    mode: 'count',
    account: `@${account.username}`,
    bookmarks: result.bookmarks.length,
    pages: result.pages,
    warnings: result.warnings.length,
    resourcesRead: result.resourcesRead,
    estimatedOwnedReadCostUsd: ownedReadEstimate(result.resourcesRead),
  };
}

async function syncBookmarks(options, tokenSet) {
  const cache = new BookmarkCache(options.cachePath);
  try {
    const { account, result, cachedBefore } = await fetchBookmarkCollection(options, tokenSet, cache);
    const exportedAt = new Date().toISOString();
    const merge = cache.merge(account, result, {
      currentStateVerified: result.reachedEnd,
      syncedAt: exportedAt,
    });
    const snapshot = cache.snapshot(account.id);
    return {
      ok: true,
      mode: 'sync',
      account: `@${account.username}`,
      bookmarks: snapshot.bookmarks.length,
      fetched: result.bookmarks.length,
      resourcesRead: result.resourcesRead,
      newBookmarks: merge.newBookmarks,
      removedBookmarks: merge.removedBookmarks,
      pages: result.pages,
      currentStateVerified: result.reachedEnd,
      warnings: result.warnings.length,
      cachePath: cache.path,
      cachedBefore,
      estimatedOwnedReadCostUsd: ownedReadEstimate(result.resourcesRead),
    };
  } finally {
    cache.close();
  }
}

function requireExistingCache(options) {
  if (!existsSync(options.cachePath)) {
    throw new CliError(`Bookmark cache not found at ${options.cachePath}. Run sync first.`);
  }
}

function backupBookmarks(options) {
  requireExistingCache(options);
  const cache = new BookmarkCache(options.cachePath);
  try {
    const snapshot = cache.backupSnapshot();
    if (snapshot.accounts.length === 0) throw new CliError('The bookmark cache has no accounts. Run sync first.');
    const result = writeBookmarkBackup(options.outputDir, snapshot);
    return {
      ok: true,
      mode: 'backup',
      cachePath: cache.path,
      ...result,
    };
  } finally {
    cache.close();
  }
}

function validateBackup(options) {
  const result = validateBookmarkBackup(options.outputDir);
  return {
    ok: true,
    mode: 'validate',
    ...result,
  };
}

function briefBookmarks(options) {
  requireExistingCache(options);
  const cache = new BookmarkCache(options.cachePath);
  try {
    const snapshot = cache.briefSnapshot({
      account: options.account,
      query: options.query,
      limit: options.limit,
    });
    const renderedAt = new Date().toISOString();
    const markdown = serializeBrief({ ...snapshot, renderedAt });
    if (options.outputFile) atomicWrite(options.outputFile, markdown);
    return {
      ok: true,
      mode: 'brief',
      account: `@${snapshot.account.username || snapshot.account.id}`,
      query: snapshot.query || null,
      returned: snapshot.bookmarks.length,
      totalCached: snapshot.totalCached,
      outputPath: options.outputFile,
      items: snapshot.bookmarks,
      markdown: options.outputFile ? undefined : markdown,
    };
  } finally {
    cache.close();
  }
}

async function revokeToken(tokens, clientId) {
  if (!tokens?.access_token) return;
  try {
    await fetchWithTimeout(REVOKE_ENDPOINT, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ token: tokens.refresh_token || tokens.access_token, client_id: clientId }),
    });
  } catch {
    // Local deletion still proceeds; the user can revoke the app in X settings.
  }
}

async function confirmLogout(options) {
  if (options.force) return true;
  if (!process.stdin.isTTY) throw new CliError('logout requires --force when stdin is not interactive.', 2);
  process.stderr.write('Revoke the X token and delete it from Keychain? [y/N] ');
  process.stdin.setEncoding('utf8');
  const answerPromise = once(process.stdin, 'data');
  const [answer] = await answerPromise;
  return /^y(es)?\s*$/i.test(answer);
}

function outputSummary(options, summary) {
  if (options.json) process.stdout.write(`${JSON.stringify(summary)}\n`);
  else if (summary.ok && summary.mode === 'backup') {
    process.stdout.write(
      `Backed up ${summary.counts.bookmarks} bookmark edge${summary.counts.bookmarks === 1 ? '' : 's'} ` +
      `and ${summary.counts.tweets} canonical tweet${summary.counts.tweets === 1 ? '' : 's'}.\n` +
      `Manifest: ${summary.manifestPath}\n` +
      `Data: ${summary.dataPath}\n` +
      `Files: ${summary.files}; SHA-256: ${summary.backupHash}\n` +
      'No X API resources were read.\n',
    );
  }
  else if (summary.ok && summary.mode === 'validate') {
    process.stdout.write(
      `Validated ${summary.files} JSONL files with ${summary.counts.bookmarks} bookmark ` +
      `edge${summary.counts.bookmarks === 1 ? '' : 's'} and ${summary.counts.tweets} canonical ` +
      `tweet${summary.counts.tweets === 1 ? '' : 's'}.\n` +
      `Manifest: ${summary.manifestPath}\n` +
      `SHA-256: ${summary.backupHash}\n`,
    );
  }
  else if (summary.ok && summary.mode === 'brief') {
    if (summary.outputPath) {
      process.stdout.write(
        `Wrote ${summary.returned} of ${summary.totalCached} cached bookmarks to ${summary.outputPath}.\n` +
        'No X API resources were read.\n',
      );
    } else {
      process.stdout.write(summary.markdown);
    }
  }
  else if (summary.ok && summary.mode === 'preview') {
    process.stdout.write(serializePreview(summary));
  }
  else if (summary.ok && summary.mode === 'count') {
    process.stdout.write(
      `Found exactly ${summary.bookmarks} unique bookmarks for ${summary.account} in ${summary.pages} pages.\n` +
      'No archive files were written.\n' +
      `API resources read: ${summary.resourcesRead}.\n` +
      `Approximate base Owned Read cost: $${summary.estimatedOwnedReadCostUsd.toFixed(3)}\n`,
    );
  }
  else if (summary.ok) {
    process.stdout.write(
      `Cached ${summary.bookmarks} bookmarks for ${summary.account}.\n` +
      `This sync read ${summary.resourcesRead} API resources in ${summary.pages} pages; ` +
      `${summary.newBookmarks} new and ${summary.removedBookmarks} removed.\n` +
      `SQLite: ${summary.cachePath}\n` +
      (summary.currentStateVerified
        ? 'Current X state was fully reconciled.\n'
        : 'Incremental sync stopped at the cached boundary; use sync --full to reconcile removals.\n') +
      'No export files were written; run twitter-bookmarks backup when you need a portable snapshot.\n' +
      `Approximate base Owned Read cost: $${summary.estimatedOwnedReadCostUsd.toFixed(3)}\n`,
    );
  } else {
    process.stdout.write(`${summary.message}\n`);
  }
}

export async function main(argv = process.argv.slice(2), env = process.env) {
  const options = parseArgs(argv, env);
  if (options.help) {
    process.stdout.write(helpText());
    return 0;
  }
  validateOptions(options);

  if (options.dryRun) {
    outputSummary(options, {
      ok: false,
      message:
        `Dry run: command=${options.command}, callback=${options.callback}, output=${options.outputDir}, ` +
        `cache=${options.cachePath}, full=${options.full}, ` +
        `includeAuthors=${options.includeAuthors}${options.limit ? `, limit=${options.limit}` : ''}` +
        `${options.query ? `, query=${JSON.stringify(options.query)}` : ''}. ` +
        'No Keychain, browser, API, or file operations performed.',
    });
    return 0;
  }

  if (options.command === 'backup') {
    outputSummary(options, backupBookmarks(options));
    return 0;
  }

  if (options.command === 'validate') {
    outputSummary(options, validateBackup(options));
    return 0;
  }

  if (options.command === 'brief') {
    outputSummary(options, briefBookmarks(options));
    return 0;
  }

  if (options.command === 'logout') {
    const existing = readTokenSet(options.clientId);
    if (!(await confirmLogout(options))) {
      outputSummary(options, { ok: false, message: 'Logout cancelled.' });
      return 0;
    }
    await revokeToken(existing, options.clientId);
    deleteTokenSet(options.clientId);
    outputSummary(options, { ok: false, message: 'Revoked X authorization when possible and removed local Keychain tokens.' });
    return 0;
  }

  let tokens = options.force ? null : readTokenSet(options.clientId);
  if (options.command === 'status') {
    if (!tokens) outputSummary(options, { ok: false, message: 'No X OAuth token set is stored for this Client ID.' });
    else {
      const expiresAt = new Date(Number(tokens.expires_at || 0)).toISOString();
      let cacheMessage = `Cache: not created at ${options.cachePath}.`;
      if (tokens.user?.id && existsSync(options.cachePath)) {
        const cache = new BookmarkCache(options.cachePath);
        try {
          const stats = cache.getStats(tokens.user.id);
          cacheMessage =
            `Cache: ${stats.bookmarks} bookmarks at ${options.cachePath}; ` +
            `last sync=${stats.lastSyncAt || 'never'}; last full sync=${stats.lastFullSyncAt || 'never'}.`;
        } finally {
          cache.close();
        }
      }
      outputSummary(options, {
        ok: false,
        message:
          `Stored OAuth token for ${tokens.user?.username ? `@${tokens.user.username}` : 'an unverified account'}; ` +
          `expires ${expiresAt}; refresh token=${tokens.refresh_token ? 'present' : 'missing'}.\n${cacheMessage}`,
      });
    }
    return 0;
  }

  if (!tokens) tokens = await login(options);
  if (options.command === 'login') {
    outputSummary(options, { ok: false, message: 'X OAuth login completed and tokens were stored in macOS Keychain.' });
    return 0;
  }

  if (options.command === 'preview') {
    const summary = await previewBookmarks(options, tokens);
    outputSummary(options, summary);
    return 0;
  }

  if (options.command === 'count') {
    const summary = await countBookmarks(options, tokens);
    outputSummary(options, summary);
    return 0;
  }

  const summary = await syncBookmarks(options, tokens);
  outputSummary(options, summary);
  return 0;
}

function isMainModule() {
  if (!process.argv[1]) return false;
  try {
    return realpathSync(resolve(process.argv[1])) === realpathSync(fileURLToPath(import.meta.url));
  } catch {
    return resolve(process.argv[1]) === fileURLToPath(import.meta.url);
  }
}

if (isMainModule()) {
  main().then(
    (code) => { process.exitCode = code; },
    (error) => {
      const message = error instanceof Error ? error.message : String(error);
      process.stderr.write(`Error: ${message}\n`);
      process.exitCode = error instanceof CliError ? error.exitCode : 1;
    },
  );
}
