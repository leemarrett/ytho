const { google } = require('googleapis');
const { OAuth2Client } = require('google-auth-library');

let youtubeClient = null;

// Setup YouTube client
async function setupYouTubeClient() {
  try {
    const oauth2Client = new OAuth2Client(
      process.env.YOUTUBE_CLIENT_ID,
      process.env.YOUTUBE_CLIENT_SECRET,
      'http://localhost:3000/oauth2callback'
    );

    oauth2Client.setCredentials({
      refresh_token: process.env.YOUTUBE_REFRESH_TOKEN
    });

    youtubeClient = google.youtube({
      version: 'v3',
      auth: oauth2Client
    });

    console.log('YouTube client initialized');
  } catch (error) {
    console.error('Error initializing YouTube client:', error.message);
    throw error;
  }
}

// Check if video exists in playlist
async function checkVideoExists(videoId, playlistId) {
  try {
    const response = await youtubeClient.playlistItems.list({
      part: 'snippet',
      playlistId: playlistId,
      videoId: videoId
    });

    return response.data.items && response.data.items.length > 0;
  } catch (error) {
    console.error('Error checking video existence:', error.message);
    throw error;
  }
}

// Get video details
async function getVideoDetails(videoId) {
  try {
    const response = await youtubeClient.videos.list({
      part: 'snippet',
      id: videoId
    });

    if (!response.data.items || response.data.items.length === 0) {
      throw new Error('Video not found');
    }

    const video = response.data.items[0];
    const snippet = video.snippet;
    return {
      title: snippet.title,
      description: snippet.description,
      publishedAt: snippet.publishedAt,
      categoryId: snippet.categoryId
    };
  } catch (error) {
    console.error('Error getting video details:', error.message);
    if (error.code === 401 || error.message.includes('invalid_grant')) {
      console.error('YouTube OAuth authentication failed. This usually means:');
      console.error('1. The refresh token has expired or been revoked');
      console.error('2. The refresh token is invalid or incorrect');
      console.error('3. The OAuth client credentials don\'t match the refresh token');
      console.error('Please check your YOUTUBE_REFRESH_TOKEN, YOUTUBE_CLIENT_ID, and YOUTUBE_CLIENT_SECRET in your .env file');
    }
    throw error;
  }
}

// Add video to playlist
async function addVideoToPlaylist(videoId, playlistId) {
  try {
    await youtubeClient.playlistItems.insert({
      part: 'snippet',
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
  } catch (error) {
    console.error('Error adding video to playlist:', error.message);
    throw error;
  }
}

// Get playlist name from ID
function getPlaylistName(playlistId) {
  if (playlistId === process.env.YOUTUBE_PLAYLIST_ID) {
    return 'Aucklandia';
  } else if (playlistId === process.env.YOUTUBE_MUSIC_PLAYLIST_ID) {
    return 'Aucklandia Music';
  }
  return 'Unknown Playlist';
}

module.exports = {
  setupYouTubeClient,
  checkVideoExists,
  getVideoDetails,
  addVideoToPlaylist,
  getPlaylistName
}; 