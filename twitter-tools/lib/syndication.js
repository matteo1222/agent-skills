/**
 * Twitter Syndication API client
 * Uses the undocumented embed API - no authentication required
 */

const SYNDICATION_URL = 'https://cdn.syndication.twimg.com/tweet-result';

/**
 * Generate token for syndication API
 * @param {string} id - Tweet ID
 * @returns {string} Token
 */
export function getToken(id) {
  return ((Number(id) / 1e15) * Math.PI)
    .toString(36)
    .replace(/(0+|\.)/g, '');
}

/**
 * Extract tweet ID from URL or return as-is if already an ID
 * @param {string} input - Tweet URL or ID
 * @returns {string} Tweet ID
 */
export function extractTweetId(input) {
  // If it's already just numbers, return it
  if (/^\d+$/.test(input)) {
    return input;
  }

  // Try to extract from URL
  const patterns = [
    /(?:twitter\.com|x\.com)\/\w+\/status\/(\d+)/,
    /(?:twitter\.com|x\.com)\/i\/web\/status\/(\d+)/,
  ];

  for (const pattern of patterns) {
    const match = input.match(pattern);
    if (match) {
      return match[1];
    }
  }

  throw new Error(`Could not extract tweet ID from: ${input}`);
}

/**
 * Fetch tweet data from syndication API
 * @param {string} tweetId - Tweet ID
 * @returns {Promise<object>} Tweet data
 */
export async function fetchTweetFromApi(tweetId) {
  const token = getToken(tweetId);
  const url = `${SYNDICATION_URL}?id=${tweetId}&token=${token}`;

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(`Tweet not found: ${tweetId}`);
    }
    throw new Error(`Failed to fetch tweet: ${response.status} ${response.statusText}`);
  }

  const text = await response.text();
  if (!text) {
    throw new Error(`Empty response for tweet: ${tweetId}`);
  }

  return JSON.parse(text);
}

/**
 * Format tweet data for display
 * @param {object} tweet - Raw tweet data
 * @returns {object} Formatted tweet
 */
export function formatTweet(tweet) {
  const formatted = {
    id: tweet.id_str,
    url: `https://twitter.com/${tweet.user?.screen_name}/status/${tweet.id_str}`,
    text: tweet.text,
    created_at: tweet.created_at,
    user: {
      name: tweet.user?.name,
      screen_name: tweet.user?.screen_name,
      profile_image: tweet.user?.profile_image_url_https,
      verified: tweet.user?.verified || tweet.user?.is_blue_verified,
    },
    metrics: {
      favorites: tweet.favorite_count,
      replies: tweet.reply_count,
      quotes: tweet.quote_count,
    },
    media: [],
    has_video: false,
  };

  // Extract media
  if (tweet.mediaDetails) {
    for (const media of tweet.mediaDetails) {
      if (media.type === 'photo') {
        formatted.media.push({
          type: 'photo',
          url: media.media_url_https,
        });
      } else if (media.type === 'video' || media.type === 'animated_gif') {
        formatted.has_video = true;
        const variants = media.video_info?.variants || [];
        const mp4s = variants
          .filter(v => v.content_type === 'video/mp4')
          .sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0));

        formatted.media.push({
          type: media.type,
          thumbnail: media.media_url_https,
          variants: mp4s.map(v => ({
            url: v.url,
            bitrate: v.bitrate,
          })),
        });
      }
    }
  }

  // Check for video in alternate location
  if (tweet.video?.variants) {
    formatted.has_video = true;
    const mp4s = tweet.video.variants
      .filter(v => v.type === 'video/mp4')
      .sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0));

    if (mp4s.length > 0 && !formatted.media.some(m => m.type === 'video')) {
      formatted.media.push({
        type: 'video',
        thumbnail: tweet.video.poster,
        variants: mp4s.map(v => ({
          url: v.src,
          bitrate: v.bitrate,
        })),
      });
    }
  }

  // Quoted tweet
  if (tweet.quoted_tweet) {
    formatted.quoted_tweet = {
      id: tweet.quoted_tweet.id_str,
      text: tweet.quoted_tweet.text,
      user: tweet.quoted_tweet.user?.screen_name,
    };
  }

  // Reply info
  if (tweet.in_reply_to_status_id_str) {
    formatted.reply_to = {
      tweet_id: tweet.in_reply_to_status_id_str,
      user: tweet.in_reply_to_screen_name,
    };
  }

  return formatted;
}

/**
 * Get best video URL from tweet
 * @param {object} tweet - Raw tweet data
 * @returns {string|null} Best quality video URL
 */
export function getBestVideoUrl(tweet) {
  // Check mediaDetails first
  if (tweet.mediaDetails) {
    for (const media of tweet.mediaDetails) {
      if (media.type === 'video' || media.type === 'animated_gif') {
        const variants = media.video_info?.variants || [];
        const mp4s = variants
          .filter(v => v.content_type === 'video/mp4')
          .sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0));

        if (mp4s.length > 0) {
          return mp4s[0].url;
        }
      }
    }
  }

  // Check video object
  if (tweet.video?.variants) {
    const mp4s = tweet.video.variants
      .filter(v => v.type === 'video/mp4')
      .sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0));

    if (mp4s.length > 0) {
      return mp4s[0].src;
    }
  }

  return null;
}
