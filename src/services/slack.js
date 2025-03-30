const { ProcessedLink, Video } = require('./database');
const { checkVideoExists, getVideoDetails, addVideoToPlaylist, getPlaylistName } = require('./youtube');

// YouTube URL patterns
const YOUTUBE_PATTERNS = [
  /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/|music\.youtube\.com\/watch\?v=)([^&\n?]+)/,
];

// Extract video ID from URL
function extractVideoId(url) {
  // Remove any angle brackets from the URL
  url = url.replace(/[<>]/g, '');
  
  for (const pattern of YOUTUBE_PATTERNS) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

// Get playlist ID based on channel name
function getPlaylistIdForChannel(channelName) {
  // If the channel name contains "music", use the music playlist
  if (channelName.toLowerCase().includes('music')) {
    return process.env.YOUTUBE_MUSIC_PLAYLIST_ID;
  }
  // Otherwise use the main playlist
  return process.env.YOUTUBE_PLAYLIST_ID;
}

// Process YouTube link
async function processYouTubeLink(url, videoId, postedBy, channelName) {
  try {
    // Clean the URL by removing any angle brackets
    const cleanUrl = url.replace(/[<>]/g, '');
    
    // Get the appropriate playlist ID based on channel
    const playlistId = getPlaylistIdForChannel(channelName);
    console.log(`Adding video to ${getPlaylistName(playlistId)} playlist`);
    
    // Check if link was already processed
    const existingLink = await ProcessedLink.findOne({ url: cleanUrl });
    if (existingLink) {
      console.log('Video already processed');
      return;
    }

    // Check if video exists in playlist
    const exists = await checkVideoExists(videoId, playlistId);
    if (exists) {
      console.log('Video already in playlist');
      return;
    }

    // Get video details
    const videoDetails = await getVideoDetails(videoId);
    console.log(`Found: ${videoDetails.title}`);

    // Add video to playlist
    await addVideoToPlaylist(videoId, playlistId);

    // Save to database
    await ProcessedLink.create({
      url: cleanUrl,
      videoId,
      postedBy,
      postedAt: new Date()
    });

    await Video.create({
      videoId,
      title: videoDetails.title,
      description: videoDetails.description,
      channelId: playlistId,
      postedAt: new Date(videoDetails.publishedAt)
    });

    return { ...videoDetails, playlistId };
  } catch (error) {
    console.error('Error processing video:', error.message);
    throw error;
  }
}

// Setup Slack bot
async function setupSlackBot(app) {
  // Handle messages containing YouTube links
  app.message(async ({ message, say, client }) => {
    try {
      // Skip messages from bots and message edits
      if (message.subtype === 'bot_message' || message.subtype === 'message_changed') {
        return;
      }

      // Find YouTube links in message
      const text = message.text;
      if (!text) return;
      
      const matches = text.match(new RegExp(YOUTUBE_PATTERNS.map(p => p.source).join('|'), 'g'));
      if (!matches) return;

      // Get channel name
      const channelInfo = await client.conversations.info({ channel: message.channel });
      const channelName = channelInfo.channel.name;

      // Process each link
      for (const url of matches) {
        const videoId = extractVideoId(url);
        if (!videoId) continue;

        const videoDetails = await processYouTubeLink(url, videoId, message.user, channelName);
        if (videoDetails) {
          try {
            await client.chat.postMessage({
              channel: process.env.SLACK_NOTIFICATION_CHANNEL_ID,
              text: `🎥 New YouTube video added to the ${getPlaylistName(videoDetails.playlistId)} playlist!\n\n*${videoDetails.title}*\n${url}`,
              blocks: [
                {
                  type: 'section',
                  text: {
                    type: 'mrkdwn',
                    text: `🎥 New YouTube video added to the ${getPlaylistName(videoDetails.playlistId)} playlist!\n\n*${videoDetails.title}*\n${url}`
                  }
                }
              ]
            });
          } catch (error) {
            console.error('Error posting notification:', error.message);
          }
        }
      }
    } catch (error) {
      console.error('Error handling message:', error.message);
    }
  });
}

module.exports = {
  setupSlackBot
}; 