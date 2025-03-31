const { ProcessedLink, Video } = require('./database');
const { checkVideoExists, getVideoDetails, addVideoToPlaylist, getPlaylistName, setupYouTubeClient } = require('./youtube');

// YouTube URL patterns
const YOUTUBE_PATTERNS = [
  /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/|music\.youtube\.com\/watch\?v=)([^&\n?]+)/,
];

// YouTube URL regex pattern
const YOUTUBE_URL_PATTERN = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|v\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;

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

// Helper function to get playlist name
function getPlaylistName(playlistId) {
  const playlists = {
    [process.env.YOUTUBE_PLAYLIST_ID]: 'Aucklandia',
    [process.env.YOUTUBE_MUSIC_PLAYLIST_ID]: 'Aucklandia Music'
  };
  return playlists[playlistId] || 'Unknown';
}

// Helper function to clean YouTube URLs
function cleanYouTubeUrl(url) {
  // Remove any URL parameters after the video ID
  return url.split('&')[0];
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
  console.log('Setting up Slack bot...');
  
  // Handle ALL messages for debugging
  app.message(async ({ message, say, client }) => {
    console.log('DEBUG: Received ANY message:', {
      type: message.type,
      subtype: message.subtype,
      text: message.text,
      user: message.user,
      channel: message.channel,
      ts: message.ts,
      bot_id: message.bot_id,
      raw: message
    });

    // Log the bot's token (first few characters only for security)
    console.log('Bot token prefix:', process.env.SLACK_BOT_TOKEN?.substring(0, 10) + '...');
  });

  // Add a test event handler
  app.event('message', async ({ event, say }) => {
    console.log('DEBUG: Received message event:', event);
  });

  console.log('Slack bot setup complete');
}

module.exports = {
  setupSlackBot
}; 