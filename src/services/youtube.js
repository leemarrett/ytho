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

    const video = response.data.items[0].snippet;
    return {
      title: video.title,
      description: video.description,
      publishedAt: video.publishedAt
    };
  } catch (error) {
    console.error('Error getting video details:', error.message);
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