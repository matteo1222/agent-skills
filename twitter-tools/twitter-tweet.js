#!/usr/bin/env node

/**
 * Fetch tweet data from Twitter/X
 * Uses syndication API - no authentication required
 *
 * Usage:
 *   twitter-tweet.js <tweet-id-or-url>
 *   twitter-tweet.js <tweet-id-or-url> --force    # Bypass cache
 *   twitter-tweet.js <tweet-id-or-url> --raw      # Output raw JSON
 */

import { extractTweetId, fetchTweetFromApi, formatTweet } from './lib/syndication.js';
import { getCachedTweet, cacheTweet } from './lib/cache.js';

function printUsage() {
  console.log(`Usage: twitter-tweet.js <tweet-id-or-url> [options]

Fetch tweet data from Twitter/X using the syndication API.

Arguments:
  tweet-id-or-url   Tweet ID or full URL

Options:
  --force           Bypass cache and fetch fresh data
  --raw             Output raw API response (not formatted)
  --help            Show this help message

Examples:
  twitter-tweet.js 1629307668568633344
  twitter-tweet.js https://twitter.com/user/status/1629307668568633344
  twitter-tweet.js https://x.com/user/status/1629307668568633344 --raw`);
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help')) {
    printUsage();
    process.exit(args.includes('--help') ? 0 : 1);
  }

  const input = args.find(a => !a.startsWith('--'));
  const force = args.includes('--force');
  const raw = args.includes('--raw');

  if (!input) {
    console.error('Error: Tweet ID or URL required');
    printUsage();
    process.exit(1);
  }

  try {
    const tweetId = extractTweetId(input);

    // Check cache first (unless --force)
    if (!force) {
      const cached = getCachedTweet(tweetId);
      if (cached) {
        if (raw) {
          console.log(JSON.stringify(cached, null, 2));
        } else {
          const formatted = formatTweet(cached);
          console.log(JSON.stringify(formatted, null, 2));
        }
        return;
      }
    }

    // Fetch from API
    const tweet = await fetchTweetFromApi(tweetId);

    // Cache the result
    cacheTweet(tweetId, tweet);

    // Output
    if (raw) {
      console.log(JSON.stringify(tweet, null, 2));
    } else {
      const formatted = formatTweet(tweet);
      console.log(JSON.stringify(formatted, null, 2));
    }
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

main();
