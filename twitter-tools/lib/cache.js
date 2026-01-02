/**
 * Cache management for twitter-tools
 * Provides idempotent storage for tweets and media
 */

import fs from 'fs';
import path from 'path';
import os from 'os';

const CACHE_DIR = path.join(os.homedir(), '.cache', 'twitter-tools');

/**
 * Get cache directory path
 * @param {string} [subdir] - Optional subdirectory
 * @returns {string} Cache directory path
 */
export function getCacheDir(subdir) {
  const dir = subdir ? path.join(CACHE_DIR, subdir) : CACHE_DIR;
  return dir;
}

/**
 * Ensure cache directory exists
 * @param {string} [subdir] - Optional subdirectory
 * @returns {string} Cache directory path
 */
export function ensureCacheDir(subdir) {
  const dir = getCacheDir(subdir);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

/**
 * Get cached tweet data
 * @param {string} tweetId - Tweet ID
 * @returns {object|null} Cached tweet data or null
 */
export function getCachedTweet(tweetId) {
  const cachePath = path.join(getCacheDir('tweets'), `${tweetId}.json`);

  if (fs.existsSync(cachePath)) {
    try {
      const data = fs.readFileSync(cachePath, 'utf-8');
      return JSON.parse(data);
    } catch {
      return null;
    }
  }

  return null;
}

/**
 * Cache tweet data
 * @param {string} tweetId - Tweet ID
 * @param {object} data - Tweet data
 */
export function cacheTweet(tweetId, data) {
  const cacheDir = ensureCacheDir('tweets');
  const cachePath = path.join(cacheDir, `${tweetId}.json`);
  fs.writeFileSync(cachePath, JSON.stringify(data, null, 2));
}

/**
 * Get archive directory for a tweet
 * @param {string} tweetId - Tweet ID
 * @returns {string} Archive directory path
 */
export function getArchiveDir(tweetId) {
  return path.join(getCacheDir('archives'), tweetId);
}

/**
 * Check if tweet is archived
 * @param {string} tweetId - Tweet ID
 * @returns {boolean} True if archived
 */
export function isArchived(tweetId) {
  const archiveDir = getArchiveDir(tweetId);
  const metadataPath = path.join(archiveDir, 'metadata.json');
  return fs.existsSync(metadataPath);
}

/**
 * Get archive metadata
 * @param {string} tweetId - Tweet ID
 * @returns {object|null} Archive metadata or null
 */
export function getArchiveMetadata(tweetId) {
  const archiveDir = getArchiveDir(tweetId);
  const metadataPath = path.join(archiveDir, 'metadata.json');

  if (fs.existsSync(metadataPath)) {
    try {
      const data = fs.readFileSync(metadataPath, 'utf-8');
      return JSON.parse(data);
    } catch {
      return null;
    }
  }

  return null;
}

/**
 * Save archive metadata
 * @param {string} tweetId - Tweet ID
 * @param {object} metadata - Archive metadata
 */
export function saveArchiveMetadata(tweetId, metadata) {
  const archiveDir = getArchiveDir(tweetId);
  fs.mkdirSync(archiveDir, { recursive: true });
  const metadataPath = path.join(archiveDir, 'metadata.json');
  fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
}

/**
 * Download file to archive
 * @param {string} url - File URL
 * @param {string} destPath - Destination path
 * @returns {Promise<void>}
 */
export async function downloadFile(url, destPath) {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to download: ${response.status}`);
  }

  const buffer = await response.arrayBuffer();
  fs.writeFileSync(destPath, Buffer.from(buffer));
}

/**
 * Clear cache for a specific tweet
 * @param {string} tweetId - Tweet ID
 */
export function clearTweetCache(tweetId) {
  const cachePath = path.join(getCacheDir('tweets'), `${tweetId}.json`);
  if (fs.existsSync(cachePath)) {
    fs.unlinkSync(cachePath);
  }
}

/**
 * Get cache stats
 * @returns {object} Cache statistics
 */
export function getCacheStats() {
  const tweetsDir = getCacheDir('tweets');
  const archivesDir = getCacheDir('archives');

  let tweetCount = 0;
  let archiveCount = 0;

  if (fs.existsSync(tweetsDir)) {
    tweetCount = fs.readdirSync(tweetsDir).filter(f => f.endsWith('.json')).length;
  }

  if (fs.existsSync(archivesDir)) {
    archiveCount = fs.readdirSync(archivesDir).filter(f => {
      const stat = fs.statSync(path.join(archivesDir, f));
      return stat.isDirectory();
    }).length;
  }

  return {
    cache_dir: CACHE_DIR,
    cached_tweets: tweetCount,
    archived_tweets: archiveCount,
  };
}
