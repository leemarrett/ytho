# YTHO - YouTube Playlist Manager for Slack

A Slack bot that automatically adds YouTube videos to designated playlists based on the channel where they're posted.

## Features

- Monitors Slack channels for YouTube links
- Automatically adds videos to the appropriate playlist:
  - Videos posted in channels with "music" in the name go to "Aucklandia Music" playlist
  - All other videos go to "Aucklandia" playlist
- Posts notifications in the #ytho channel when videos are added
- Prevents duplicate videos from being added
- Supports both public and private channels

## Setup

### Prerequisites

- Node.js 18 or higher
- MongoDB database
- Slack workspace with admin access
- Google Cloud project with YouTube Data API enabled

### Local Development

1. Clone the repository:
   ```bash
   git clone https://github.com/leemarrett/ytho.git
   cd ytho
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file with the following variables:
   ```
   # Slack Configuration
   SLACK_BOT_TOKEN=xoxb-your-bot-token
   SLACK_APP_TOKEN=xapp-your-app-token
   SLACK_NOTIFICATION_CHANNEL_ID=C...  # Channel ID for #ytho (starts with C)

   # YouTube Configuration
   YOUTUBE_CLIENT_ID=your-client-id
   YOUTUBE_CLIENT_SECRET=your-client-secret
   YOUTUBE_REFRESH_TOKEN=your-refresh-token
   YOUTUBE_PLAYLIST_ID=your-playlist-id
   YOUTUBE_MUSIC_PLAYLIST_ID=your-music-playlist-id

   # MongoDB Configuration
   MONGODB_URI=your-mongodb-uri
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

### Deployment to Render

1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Configure the service:
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Environment Variables: Add all variables from your `.env` file
   - Plan: Free tier is sufficient

4. Deploy the service

## Environment Variables

| Variable | Description |
|----------|-------------|
| `SLACK_BOT_TOKEN` | Your Slack Bot User OAuth Token |
| `SLACK_APP_TOKEN` | Your Slack App-Level Token with `connections:write` scope |
| `SLACK_NOTIFICATION_CHANNEL_ID` | Channel ID where notifications will be posted |
| `YOUTUBE_CLIENT_ID` | Google Cloud OAuth 2.0 Client ID |
| `YOUTUBE_CLIENT_SECRET` | Google Cloud OAuth 2.0 Client Secret |
| `YOUTUBE_REFRESH_TOKEN` | OAuth 2.0 Refresh Token for YouTube API |
| `YOUTUBE_PLAYLIST_ID` | ID of the main playlist (Aucklandia) |
| `YOUTUBE_MUSIC_PLAYLIST_ID` | ID of the music playlist (Aucklandia Music) |
| `MONGODB_URI` | MongoDB connection string |
| `PORT` | Port to run the server on (default: 3000) |

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 