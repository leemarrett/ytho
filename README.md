# YouTube Link Bot for Slack

A Slack bot that monitors specified channels for YouTube links, checks if they exist on a designated YouTube channel, and if not, posts them to the YouTube channel. The bot also notifies a designated Slack channel when new YouTube content is added.

## Features

- Monitors Slack channels for YouTube links
- Detects various YouTube URL formats
- Checks if videos exist on the designated YouTube channel
- Posts new videos to the YouTube channel
- Sends notifications to a designated Slack channel

## Prerequisites

- Node.js (v18 or higher)
- MongoDB
- Slack workspace with admin access
- YouTube channel with API access
- Required API keys and tokens

## Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/ytho.git
   cd ytho
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file:
   ```bash
   cp .env.example .env
   ```

4. Configure your environment variables in `.env`:
   - Get your Slack Bot Token from your Slack App settings
   - Get your YouTube API Key from Google Cloud Console
   - Set up your MongoDB connection string
   - Configure other required variables

5. Start the development server:
   ```bash
   npm run dev
   ```

## Environment Variables

See `.env.example` for all required environment variables. Make sure to set up your own values in the `.env` file.

## Development

- `npm run dev`: Start the development server with hot reload
- `npm start`: Start the production server
- `npm test`: Run tests

## Deployment

The application is designed to be deployed on Render. Follow these steps:

1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Configure environment variables in Render
4. Deploy!

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 