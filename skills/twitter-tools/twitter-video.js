#!/usr/bin/env node

/**
 * Download video from Twitter/X tweet
 *
 * Usage:
 *   twitter-video.js <tweet-url>
 *   twitter-video.js <tweet-url> -o output.mp4
 *   twitter-video.js <tweet-url> --ytdlp          # Force yt-dlp
 */

import fs from 'fs';
import path from 'path';
import { spawn } from 'node:child_process';
import { extractTweetId, fetchTweetFromApi, getBestVideoUrl } from './lib/syndication.js';
import { getCachedTweet, cacheTweet, downloadFile } from './lib/cache.js';

function printUsage() {
  console.log(`Usage: twitter-video.js <tweet-url> [options]

Download video from a Twitter/X tweet.

Arguments:
  tweet-url         Tweet URL or ID

Options:
  -o, --output      Output file path (default: video_<tweet-id>.mp4)
  --ytdlp           Force use of yt-dlp (for age-restricted content)
  --help            Show this help message

Examples:
  twitter-video.js https://twitter.com/user/status/1234567890
  twitter-video.js 1234567890 -o my_video.mp4
  twitter-video.js https://x.com/user/status/1234567890 --ytdlp`);
}

async function downloadWithYtdlp(url, outputPath) {
  console.error('Downloading with yt-dlp...');
  await new Promise((resolvePromise, rejectPromise) => {
    const child = spawn('yt-dlp', [url, '-o', outputPath, '--no-warnings'], { stdio: 'inherit' });
    child.once('error', (error) => {
      if (error.code === 'ENOENT') {
        rejectPromise(new Error('yt-dlp is not installed or is not on PATH. Install it with: brew install yt-dlp'));
      } else {
        rejectPromise(error);
      }
    });
    child.once('exit', (code, signal) => {
      if (code === 0) resolvePromise();
      else rejectPromise(new Error(`yt-dlp failed${signal ? ` with signal ${signal}` : ` with exit code ${code}`}`));
    });
  });

  return outputPath;
}

async function downloadDirect(videoUrl, outputPath) {
  console.error('Downloading video directly...');
  await downloadFile(videoUrl, outputPath);
  return outputPath;
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help')) {
    printUsage();
    process.exit(args.includes('--help') ? 0 : 1);
  }

  // Parse arguments
  let input = null;
  let outputPath = null;
  let useYtdlp = false;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '-o' || arg === '--output') {
      outputPath = args[++i];
    } else if (arg === '--ytdlp') {
      useYtdlp = true;
    } else if (!arg.startsWith('-')) {
      input = arg;
    }
  }

  if (!input) {
    console.error('Error: Tweet URL or ID required');
    printUsage();
    process.exit(1);
  }

  try {
    const tweetId = extractTweetId(input);

    // Default output path
    if (!outputPath) {
      outputPath = `video_${tweetId}.mp4`;
    }

    // Resolve to absolute path
    outputPath = path.resolve(outputPath);

    // If forcing yt-dlp, use it directly
    if (useYtdlp) {
      const tweetUrl = `https://twitter.com/i/status/${tweetId}`;
      await downloadWithYtdlp(tweetUrl, outputPath);
      console.log(JSON.stringify({ success: true, path: outputPath }));
      return;
    }

    // Try to get video URL from syndication API
    let tweet = getCachedTweet(tweetId);
    if (!tweet) {
      tweet = await fetchTweetFromApi(tweetId);
      cacheTweet(tweetId, tweet);
    }

    const videoUrl = getBestVideoUrl(tweet);

    if (!videoUrl) {
      // No video found in syndication API, try yt-dlp as fallback
      console.error('No video found in API response, trying yt-dlp...');
      const tweetUrl = `https://twitter.com/i/status/${tweetId}`;
      await downloadWithYtdlp(tweetUrl, outputPath);
      console.log(JSON.stringify({ success: true, path: outputPath, method: 'ytdlp' }));
      return;
    }

    // Download directly
    await downloadDirect(videoUrl, outputPath);

    const stats = fs.statSync(outputPath);
    console.log(JSON.stringify({
      success: true,
      path: outputPath,
      size: stats.size,
      method: 'direct',
    }));
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

main();
