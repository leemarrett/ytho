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
  app.message(async ({ message, say }) => {
    try {
      console.log('Received message:', message.text);
      
      // Skip messages from the bot itself
      if (message.bot_id) {
        console.log('Skipping bot message');
        return;
      }

      // Find YouTube links in the message
      const matches = message.text.match(YOUTUBE_URL_PATTERN);
      if (!matches) {
        console.log('No YouTube links found in message');
        return;
      }

      console.log('Found YouTube links:', matches);

      // Process each YouTube link
      for (const match of matches) {
        const cleanUrl = cleanYouTubeUrl(match);
        console.log('Processing URL:', cleanUrl);
        
        // Extract video ID
        const videoId = cleanUrl.match(YOUTUBE_URL_PATTERN)[1];
        console.log('Extracted video ID:', videoId);

        // Check if video exists in database
        const existingVideo = await Video.findOne({ videoId });
        if (existingVideo) {
          console.log('Video already processed:', videoId);
          continue;
        }

        // Get video details
        const videoDetails = await setupYouTubeClient().videos.list({
          part: ['snippet'],
          id: [videoId]
        });

        if (!videoDetails.data.items || videoDetails.data.items.length === 0) {
          console.log('Video not found:', videoId);
          continue;
        }

        const video = videoDetails.data.items[0];
        console.log('Found video:', video.snippet.title);

        // Determine which playlist to use based on channel
        const playlistId = message.channel === 'C06QZJ4KX4P' 
          ? process.env.YOUTUBE_MUSIC_PLAYLIST_ID 
          : process.env.YOUTUBE_PLAYLIST_ID;

        console.log('Using playlist:', getPlaylistName(playlistId));

        // Add video to playlist
        await setupYouTubeClient().playlistItems.insert({
          part: ['snippet'],
          requestBody: {
            snippet: {
              playlistId: playlistId,
              resourceId: {
                kind: 'youtube#video',
                videoId: videoId
              }
            }
          }
        });

        // Save to database
        await Video.create({
          videoId,
          title: video.snippet.title,
          channelId: video.snippet.channelId,
          channelTitle: video.snippet.channelTitle,
          playlistId: playlistId
        });

        console.log('Added video to playlist:', video.snippet.title);
      }
    } catch (error) {
      console.error('Error processing message:', error.message);
    }
  });

  console.log('Slack bot setup complete');
}

module.exports = {
  setupSlackBot
}; 