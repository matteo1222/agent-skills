import { createHash, randomBytes } from 'node:crypto';
import {
  chmodSync,
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';

export const DEFAULT_MAX_BACKUP_SHARD_BYTES = 48 * 1024 * 1024;
export const BOOKMARK_BACKUP_FORMAT = 'twitter-bookmarks-jsonl';

function canonicalJson(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) {
    return `[${value.map((item) => canonicalJson(item === undefined ? null : item)).join(',')}]`;
  }
  const entries = Object.keys(value)
    .filter((key) => value[key] !== undefined)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`);
  return `{${entries.join(',')}}`;
}

export function canonicalStringify(value) {
  return canonicalJson(value);
}

function sha256(contents) {
  return createHash('sha256').update(contents).digest('hex');
}

function tweetYear(tweet) {
  const value = tweet.post?.created_at;
  if (!value) return 'unknown';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'unknown';
  const year = date.getUTCFullYear();
  return year >= 1900 && year <= 9999 ? String(year) : 'unknown';
}

function partPath(logicalPath, partNumber) {
  const suffix = `.part-${String(partNumber).padStart(4, '0')}.jsonl`;
  return logicalPath.endsWith('.jsonl')
    ? `${logicalPath.slice(0, -'.jsonl'.length)}${suffix}`
    : `${logicalPath}${suffix}`;
}

export function shardJsonl(logicalPath, rows, maxBytes = DEFAULT_MAX_BACKUP_SHARD_BYTES) {
  if (!Number.isSafeInteger(maxBytes) || maxBytes < 1) {
    throw new Error('maxBytes must be a positive safe integer.');
  }
  const lines = rows.map((row) => `${canonicalStringify(row)}\n`);
  const totalBytes = lines.reduce((sum, line) => sum + Buffer.byteLength(line), 0);
  if (totalBytes <= maxBytes) return [{ path: logicalPath, contents: lines.join(''), rows: rows.length }];

  const parts = [];
  let current = [];
  let currentBytes = 0;
  const flush = () => {
    if (current.length === 0) return;
    parts.push({
      path: partPath(logicalPath, parts.length + 1),
      contents: current.join(''),
      rows: current.length,
    });
    current = [];
    currentBytes = 0;
  };
  for (const line of lines) {
    const bytes = Buffer.byteLength(line);
    if (current.length > 0 && currentBytes + bytes > maxBytes) flush();
    current.push(line);
    currentBytes += bytes;
  }
  flush();
  return parts;
}

function compareText(left, right) {
  return String(left).localeCompare(String(right), 'en');
}

export function buildBookmarkBackup(snapshot, {
  maxShardBytes = DEFAULT_MAX_BACKUP_SHARD_BYTES,
} = {}) {
  const logicalShards = new Map();
  logicalShards.set('data/accounts.jsonl', [...snapshot.accounts].sort((left, right) => (
    compareText(left.id, right.id)
  )));
  logicalShards.set('data/authors.jsonl', [...snapshot.authors].sort((left, right) => (
    compareText(left.accountId, right.accountId) || compareText(left.authorId, right.authorId)
  )));
  logicalShards.set('data/collections/bookmarks.jsonl', [...snapshot.bookmarks].sort((left, right) => (
    compareText(left.accountId, right.accountId)
      || left.position - right.position
      || compareText(left.tweetId, right.tweetId)
  )));

  const tweetsByYear = new Map();
  for (const tweet of snapshot.tweets) {
    const year = tweetYear(tweet);
    const path = `data/tweets/${year}.jsonl`;
    const rows = tweetsByYear.get(path) || [];
    rows.push(tweet);
    tweetsByYear.set(path, rows);
  }
  for (const path of [...tweetsByYear.keys()].sort(compareText)) {
    logicalShards.set(path, tweetsByYear.get(path).sort((left, right) => (
      compareText(left.post?.created_at || '', right.post?.created_at || '')
        || compareText(left.id, right.id)
    )));
  }

  const files = [];
  for (const [logicalPath, rows] of logicalShards) {
    for (const shard of shardJsonl(logicalPath, rows, maxShardBytes)) {
      files.push({
        ...shard,
        bytes: Buffer.byteLength(shard.contents),
        sha256: sha256(shard.contents),
      });
    }
  }
  files.sort((left, right) => compareText(left.path, right.path));

  const snapshotAt = snapshot.accounts
    .map((account) => account.lastSyncAt)
    .filter(Boolean)
    .sort()
    .at(-1) || null;
  const fileManifest = files.map(({ path, bytes, rows, sha256: hash }) => ({
    path,
    bytes,
    rows,
    sha256: hash,
  }));
  const counts = {
    accounts: snapshot.accounts.length,
    authors: snapshot.authors.length,
    bookmarks: snapshot.bookmarks.length,
    tweets: snapshot.tweets.length,
  };
  const manifest = {
    format: BOOKMARK_BACKUP_FORMAT,
    schemaVersion: 1,
    snapshotAt,
    counts,
    files: fileManifest,
    backupHash: sha256(canonicalStringify({ counts, files: fileManifest })),
  };
  return { files, manifest };
}

export function validateBookmarkBackup(outputDir) {
  const root = resolve(outputDir);
  const manifestPath = resolve(root, 'manifest.json');
  if (!existsSync(manifestPath)) throw new Error(`Backup manifest not found: ${manifestPath}`);
  let manifest;
  try {
    manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  } catch (error) {
    throw new Error(`Backup manifest is invalid JSON: ${error.message}`);
  }
  if (manifest.format !== BOOKMARK_BACKUP_FORMAT) {
    throw new Error(`Unsupported backup format: ${manifest.format || 'missing'}`);
  }
  if (manifest.schemaVersion !== 1) {
    throw new Error(`Unsupported backup schema version: ${manifest.schemaVersion}`);
  }
  if (!Array.isArray(manifest.files)) throw new Error('Backup manifest files must be an array.');

  const errors = [];
  const seenPaths = new Set();
  const counts = { accounts: 0, authors: 0, bookmarks: 0, tweets: 0 };
  for (const file of manifest.files) {
    if (!file?.path || seenPaths.has(file.path)) {
      errors.push(`duplicate or missing file path: ${file?.path || '(missing)'}`);
      continue;
    }
    seenPaths.add(file.path);
    if (!String(file.path).startsWith('data/')) {
      errors.push(`file is outside data/: ${file.path}`);
      continue;
    }
    let path;
    try {
      path = safeDestination(root, file.path);
    } catch (error) {
      errors.push(error.message);
      continue;
    }
    if (!existsSync(path)) {
      errors.push(`missing file: ${file.path}`);
      continue;
    }
    if (lstatSync(path).isSymbolicLink()) {
      errors.push(`file is a symlink: ${file.path}`);
      continue;
    }
    const contents = readFileSync(path, 'utf8');
    const bytes = Buffer.byteLength(contents);
    if (bytes !== file.bytes) errors.push(`byte count mismatch: ${file.path}`);
    if (sha256(contents) !== file.sha256) errors.push(`SHA-256 mismatch: ${file.path}`);
    if (contents && !contents.endsWith('\n')) errors.push(`missing final newline: ${file.path}`);
    const lines = contents ? contents.slice(0, -1).split('\n') : [];
    if (lines.length !== file.rows) errors.push(`row count mismatch: ${file.path}`);
    for (let index = 0; index < lines.length; index += 1) {
      try {
        JSON.parse(lines[index]);
      } catch {
        errors.push(`invalid JSONL row ${index + 1}: ${file.path}`);
      }
    }
    if (/^data\/accounts(?:\.part-\d{4})?\.jsonl$/.test(file.path)) counts.accounts += lines.length;
    else if (/^data\/authors(?:\.part-\d{4})?\.jsonl$/.test(file.path)) counts.authors += lines.length;
    else if (/^data\/collections\/bookmarks(?:\.part-\d{4})?\.jsonl$/.test(file.path)) counts.bookmarks += lines.length;
    else if (file.path.startsWith('data/tweets/')) counts.tweets += lines.length;
  }
  if (canonicalStringify(counts) !== canonicalStringify(manifest.counts)) {
    errors.push('manifest counts do not match JSONL rows');
  }
  const expectedBackupHash = sha256(canonicalStringify({
    counts: manifest.counts,
    files: manifest.files,
  }));
  if (expectedBackupHash !== manifest.backupHash) errors.push('backup hash mismatch');
  if (errors.length > 0) throw new Error(`Backup validation failed:\n- ${errors.join('\n- ')}`);
  return {
    ok: true,
    outputDir: root,
    manifestPath,
    counts,
    files: manifest.files.length,
    backupHash: manifest.backupHash,
  };
}

function assertManagedBackup(outputDir) {
  const dataPath = resolve(outputDir, 'data');
  const manifestPath = resolve(outputDir, 'manifest.json');
  const hasData = existsSync(dataPath);
  const hasManifest = existsSync(manifestPath);
  if (!hasData && !hasManifest) return;
  if (hasData && lstatSync(dataPath).isSymbolicLink()) {
    throw new Error(`Refusing to replace a symlinked backup data directory: ${dataPath}`);
  }
  if (hasData && !lstatSync(dataPath).isDirectory()) {
    throw new Error(`Refusing to replace a non-directory backup data path: ${dataPath}`);
  }
  if (!hasManifest) {
    throw new Error(`Refusing to replace unmanaged data directory: ${dataPath}`);
  }
  let manifest;
  try {
    manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  } catch (error) {
    throw new Error(`Refusing to replace data because manifest.json is invalid: ${error.message}`);
  }
  if (manifest.format !== BOOKMARK_BACKUP_FORMAT) {
    throw new Error(`Refusing to replace data owned by another backup format: ${dataPath}`);
  }
}

function safeDestination(root, relativePath) {
  const destination = resolve(root, relativePath);
  const fromRoot = relative(resolve(root), destination);
  if (!fromRoot || fromRoot === '..' || fromRoot.startsWith(`..${sep}`) || isAbsolute(fromRoot)) {
    throw new Error(`Backup path escapes its destination: ${relativePath}`);
  }
  return destination;
}

function writePrivateFile(path, contents) {
  mkdirSync(dirname(path), { recursive: true, mode: 0o700 });
  writeFileSync(path, contents, { encoding: 'utf8', flag: 'wx', mode: 0o600 });
  chmodSync(path, 0o600);
}

export function writeBookmarkBackup(outputDir, snapshot, options = {}) {
  const root = resolve(outputDir);
  mkdirSync(root, { recursive: true, mode: 0o700 });
  assertManagedBackup(root);
  const backup = buildBookmarkBackup(snapshot, options);
  const nonce = `${process.pid}-${randomBytes(6).toString('hex')}`;
  const stageRoot = resolve(root, `.twitter-bookmarks-stage-${nonce}`);
  const oldDataPath = resolve(root, `.twitter-bookmarks-old-data-${nonce}`);
  const dataPath = resolve(root, 'data');
  let movedOldData = false;
  let installedNewData = false;
  let committed = false;

  try {
    mkdirSync(stageRoot, { recursive: false, mode: 0o700 });
    for (const file of backup.files) {
      writePrivateFile(safeDestination(stageRoot, file.path), file.contents);
    }
    const manifestContents = `${JSON.stringify(backup.manifest, null, 2)}\n`;
    const stagedManifest = resolve(stageRoot, 'manifest.json');
    writePrivateFile(stagedManifest, manifestContents);
    validateBookmarkBackup(stageRoot);
    const stagedDataPath = resolve(stageRoot, 'data');
    if (existsSync(dataPath)) {
      renameSync(dataPath, oldDataPath);
      movedOldData = true;
    }
    renameSync(stagedDataPath, dataPath);
    installedNewData = true;
    renameSync(stagedManifest, resolve(root, 'manifest.json'));
    committed = true;
  } catch (error) {
    if (!committed) {
      if (installedNewData && existsSync(dataPath)) rmSync(dataPath, { recursive: true, force: true });
      if (movedOldData && existsSync(oldDataPath)) renameSync(oldDataPath, dataPath);
    }
    if (existsSync(stageRoot)) rmSync(stageRoot, { recursive: true, force: true });
    throw error;
  }
  try {
    if (movedOldData) rmSync(oldDataPath, { recursive: true, force: true });
    if (existsSync(stageRoot)) rmSync(stageRoot, { recursive: true, force: true });
  } catch {
    // The committed manifest and data remain valid; only a hidden stale staging path may remain.
  }

  return {
    outputDir: root,
    manifestPath: join(root, 'manifest.json'),
    dataPath,
    counts: backup.manifest.counts,
    files: backup.manifest.files.length,
    backupHash: backup.manifest.backupHash,
  };
}
