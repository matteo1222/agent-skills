#!/usr/bin/env node

/**
 * Fetch Twitter/X article content via Jina Reader API
 * Works for articles, long tweets, and any X content that the syndication API can't fully capture.
 *
 * Usage:
 *   twitter-article.js <tweet-url>
 *   twitter-article.js <tweet-url> --raw     # Output raw markdown (no cleanup)
 *   twitter-article.js <tweet-url> --json    # Output as JSON
 */

import { extractTweetId } from './lib/syndication.js';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

const CACHE_DIR = join(homedir(), '.cache', 'twitter-tools', 'articles');
const JINA_BASE = 'https://r.jina.ai/';

function printUsage() {
  console.log(`Usage: twitter-article.js <tweet-url> [options]

Fetch full article/tweet content from X via Jina Reader API.

Arguments:
  tweet-url         Tweet URL (x.com or twitter.com)

Options:
  --raw             Output raw Jina markdown without cleanup
  --json            Output as JSON with title, content, source
  --force           Bypass cache
  --help            Show this help message

Examples:
  twitter-article.js https://x.com/koylanai/status/2025286163641118915
  twitter-article.js https://x.com/user/status/123456 --json`);
}

function cleanMarkdown(text) {
  // Remove image markdown (profile pics, embedded images)
  let cleaned = text.replace(/!\[Image \d+[^\]]*\]\([^)]+\)/g, '');
  // Remove standalone image links
  cleaned = cleaned.replace(/\[!\[Image[^\]]*\]\([^)]+\)\]\([^)]+\)/g, '');
  // Remove profile pic lines
  cleaned = cleaned.replace(/^!\[.*\]\(https:\/\/pbs\.twimg\.com\/profile_images\/.*\)$/gm, '');
  // Collapse multiple blank lines
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
  return cleaned.trim();
}

function extractTitle(text) {
  const match = text.match(/^Title:\s*(.+?)(?:\s*\/\s*X)?\s*$/m);
  if (match) return match[1].trim();
  // Fallback: first heading
  const heading = text.match(/^#\s+(.+)$/m);
  return heading ? heading[1].trim() : null;
}

async function fetchArticle(url, { force = false } = {}) {
  const id = extractTweetId(url);
  if (!id) throw new Error(`Could not extract tweet ID from: ${url}`);

  const cacheFile = join(CACHE_DIR, `${id}.md`);

  // Check cache
  if (!force && existsSync(cacheFile)) {
    return readFileSync(cacheFile, 'utf-8');
  }

  // Normalize URL to x.com format
  const normalizedUrl = `https://x.com/i/status/${id}`;
  const jinaUrl = `${JINA_BASE}https://x.com/i/status/${id}`;

  // Also try the original URL via Jina
  const urls = [
    `${JINA_BASE}${url.replace('twitter.com', 'x.com')}`,
  ];

  let content = null;
  for (const fetchUrl of urls) {
    try {
      const res = await fetch(fetchUrl, {
        headers: {
          'Accept': 'text/plain',
        },
      });
      if (res.ok) {
        content = await res.text();
        if (content && content.length > 200) break;
      }
    } catch (e) {
      // Try next URL
    }
  }

  if (!content || content.length < 200) {
    throw new Error('Failed to fetch article content from Jina');
  }

  // Cache it
  mkdirSync(CACHE_DIR, { recursive: true });
  writeFileSync(cacheFile, content, 'utf-8');

  return content;
}

async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.length === 0) {
    printUsage();
    process.exit(0);
  }

  const url = args.find(a => !a.startsWith('--'));
  const raw = args.includes('--raw');
  const json = args.includes('--json');
  const force = args.includes('--force');

  if (!url) {
    console.error('Error: Please provide a tweet URL');
    process.exit(1);
  }

  try {
    const content = await fetchArticle(url, { force });

    if (raw) {
      console.log(content);
    } else if (json) {
      const title = extractTitle(content);
      const cleaned = cleanMarkdown(content);
      console.log(JSON.stringify({
        id: extractTweetId(url),
        url: url,
        title,
        content: cleaned,
        cached: !force,
      }, null, 2));
    } else {
      console.log(cleanMarkdown(content));
    }
  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }
}

main();
