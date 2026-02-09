#!/usr/bin/env node

/**
 * Archive a Twitter/X tweet with all media
 * Idempotent - won't re-download if already archived
 *
 * Usage:
 *   twitter-archive.js <tweet-url>
 *   twitter-archive.js <tweet-url> --dir ./output
 *   twitter-archive.js <tweet-url> --force
 */

import fs from 'fs';
import path from 'path';
import { extractTweetId, fetchTweetFromApi, formatTweet, getBestVideoUrl } from './lib/syndication.js';
import {
  getCachedTweet,
  cacheTweet,
  getArchiveDir,
  isArchived,
  getArchiveMetadata,
  saveArchiveMetadata,
  downloadFile,
} from './lib/cache.js';

function printUsage() {
  console.log(`Usage: twitter-archive.js <tweet-url> [options]

Archive a Twitter/X tweet with all media files.

Arguments:
  tweet-url         Tweet URL or ID

Options:
  --dir             Custom output directory (default: ~/.cache/twitter-tools/archives/<id>)
  --force           Re-archive even if already exists
  --help            Show this help message

Examples:
  twitter-archive.js https://twitter.com/user/status/1234567890
  twitter-archive.js 1234567890 --dir ./my-archive
  twitter-archive.js https://x.com/user/status/1234567890 --force`);
}

function getExtension(url, defaultExt = 'jpg') {
  // Extract extension from URL, handling query params
  const pathname = new URL(url).pathname;
  const ext = path.extname(pathname).slice(1);
  return ext || defaultExt;
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help')) {
    printUsage();
    process.exit(args.includes('--help') ? 0 : 1);
  }

  // Parse arguments
  let input = null;
  let customDir = null;
  let force = false;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--dir') {
      customDir = args[++i];
    } else if (arg === '--force') {
      force = true;
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
    const tweetUrl = `https://twitter.com/i/status/${tweetId}`;

    // Check if already archived
    if (!force && isArchived(tweetId)) {
      const metadata = getArchiveMetadata(tweetId);
      console.log(JSON.stringify({
        success: true,
        cached: true,
        tweet_id: tweetId,
        archive_dir: metadata?.archive_dir || getArchiveDir(tweetId),
        archived_at: metadata?.archived_at,
        media_files: metadata?.media_files || [],
      }));
      return;
    }

    // Fetch tweet data
    let tweet = getCachedTweet(tweetId);
    if (!tweet || force) {
      tweet = await fetchTweetFromApi(tweetId);
      cacheTweet(tweetId, tweet);
    }

    const formatted = formatTweet(tweet);

    // Determine archive directory
    const archiveDir = customDir ? path.resolve(customDir) : getArchiveDir(tweetId);
    fs.mkdirSync(archiveDir, { recursive: true });

    // Save tweet JSON
    const tweetJsonPath = path.join(archiveDir, 'tweet.json');
    fs.writeFileSync(tweetJsonPath, JSON.stringify(tweet, null, 2));

    const formattedJsonPath = path.join(archiveDir, 'tweet_formatted.json');
    fs.writeFileSync(formattedJsonPath, JSON.stringify(formatted, null, 2));

    // Download media
    const mediaFiles = [];
    let mediaIndex = 0;

    for (const media of formatted.media) {
      if (media.type === 'photo') {
        const ext = getExtension(media.url, 'jpg');
        const filename = `media_${mediaIndex}.${ext}`;
        const filepath = path.join(archiveDir, filename);

        console.error(`Downloading photo: ${filename}`);
        await downloadFile(media.url, filepath);
        mediaFiles.push(filename);
        mediaIndex++;
      } else if (media.type === 'video' || media.type === 'animated_gif') {
        // Download thumbnail
        if (media.thumbnail) {
          const thumbExt = getExtension(media.thumbnail, 'jpg');
          const thumbFilename = `media_${mediaIndex}_thumb.${thumbExt}`;
          const thumbPath = path.join(archiveDir, thumbFilename);

          console.error(`Downloading thumbnail: ${thumbFilename}`);
          await downloadFile(media.thumbnail, thumbPath);
          mediaFiles.push(thumbFilename);
        }

        // Download video (best quality)
        if (media.variants && media.variants.length > 0) {
          const videoUrl = media.variants[0].url;
          const videoFilename = `media_${mediaIndex}.mp4`;
          const videoPath = path.join(archiveDir, videoFilename);

          console.error(`Downloading video: ${videoFilename}`);
          await downloadFile(videoUrl, videoPath);
          mediaFiles.push(videoFilename);
        }

        mediaIndex++;
      }
    }

    // Save metadata
    const metadata = {
      tweet_id: tweetId,
      source_url: tweetUrl,
      archived_at: new Date().toISOString(),
      archive_dir: archiveDir,
      media_files: mediaFiles,
      user: formatted.user?.screen_name,
      text_preview: formatted.text?.slice(0, 100),
    };

    saveArchiveMetadata(tweetId, metadata);

    // Also save metadata to custom dir if specified
    if (customDir) {
      const metadataPath = path.join(archiveDir, 'metadata.json');
      fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
    }

    console.log(JSON.stringify({
      success: true,
      cached: false,
      tweet_id: tweetId,
      archive_dir: archiveDir,
      archived_at: metadata.archived_at,
      media_files: mediaFiles,
    }));
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

main();
