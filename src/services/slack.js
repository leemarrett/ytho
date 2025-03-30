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
    console.log(`Processing YouTube link: ${cleanUrl}`);
    
    // Get the appropriate playlist ID based on channel
    const playlistId = getPlaylistIdForChannel(channelName);
    console.log(`Using playlist: ${getPlaylistName(playlistId)}`);
    
    // Check if link was already processed
    const existingLink = await ProcessedLink.findOne({ url: cleanUrl });
    if (existingLink) {
      console.log(`Link already processed: ${cleanUrl}`);
      return;
    }

    // Check if video exists in playlist
    const exists = await checkVideoExists(videoId, playlistId);
    if (exists) {
      console.log(`Video already exists in playlist: ${videoId}`);
      return;
    }

    // Get video details
    const videoDetails = await getVideoDetails(videoId);
    console.log(`Found video details: ${videoDetails.title}`);

    // Add video to playlist
    await addVideoToPlaylist(videoId, playlistId);
    console.log(`Added video to playlist: ${videoId}`);

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
    console.error('Error processing YouTube link:', error);
    throw error;
  }
}

// Setup Slack bot
async function setupSlackBot(app) {
  // Handle messages containing YouTube links
  app.message(async ({ message, say, client }) => {
    try {
      console.log('Received message:', message);
      
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

      console.log('Message text:', text);
      
      const matches = text.match(new RegExp(YOUTUBE_PATTERNS.map(p => p.source).join('|'), 'g'));
      console.log('Found matches:', matches);

      if (!matches) {
        console.log('No YouTube links found in message');
        return;
      }

      // Get channel name
      const channelInfo = await client.conversations.info({ channel: message.channel });
      const channelName = channelInfo.channel.name;

      // Process each link
      for (const url of matches) {
        const videoId = extractVideoId(url);
        if (!videoId) {
          console.log('Could not extract video ID from URL:', url);
          continue;
        }

        console.log('Processing video ID:', videoId);
        const videoDetails = await processYouTubeLink(url, videoId, message.user, channelName);
        if (videoDetails) {
          // Post to #ytho channel using the channel ID from environment variables
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
            console.log('Posted notification to channel:', process.env.SLACK_NOTIFICATION_CHANNEL_ID);
          } catch (error) {
            console.error('Error posting to notification channel:', error);
          }
        }
      }
    } catch (error) {
      console.error('Error handling message:', error);
    }
  });
}

module.exports = {
  setupSlackBot
}; 