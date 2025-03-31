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
  
  // Handle YouTube links in messages
  app.message(async ({ message, say, client }) => {
    console.log('DEBUG: Received message:', {
      type: message.type,
      subtype: message.subtype,
      text: message.text,
      user: message.user,
      channel: message.channel
    });
    
    try {
      // Skip messages from bots and message edits
      if (message.subtype === 'bot_message' || message.subtype === 'message_changed') {
        console.log('Skipping bot message or message edit');
        return;
      }

      // Find YouTube links in message
      const text = message.text;
      if (!text) {
        console.log('No text in message');
        return;
      }
      
      const matches = text.match(new RegExp(YOUTUBE_PATTERNS.map(p => p.source).join('|'), 'g'));
      if (!matches) {
        console.log('No YouTube links found in message');
        return;
      }

      console.log('Found YouTube links:', matches);

      // Get channel name
      const channelInfo = await client.conversations.info({ channel: message.channel });
      const channelName = channelInfo.channel.name;
      console.log('Processing links in channel:', channelName);

      // Process each link
      for (const url of matches) {
        console.log('Processing URL:', url);
        const videoId = extractVideoId(url);
        if (!videoId) {
          console.log('Could not extract video ID from URL');
          continue;
        }

        console.log('Extracted video ID:', videoId);
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
            console.log('Posted notification message');
          } catch (error) {
            console.error('Error posting notification:', error.message);
          }
        }
      }
    } catch (error) {
      console.error('Error handling message:', error.message);
    }
  });

  console.log('Slack bot setup complete');
}

module.exports = {
  setupSlackBot
}; 