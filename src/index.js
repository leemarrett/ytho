require('dotenv').config();
const { App } = require('@slack/bolt');
const { initializeServices } = require('./services');

// Initialize Slack app
const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  socketMode: true,
  appToken: process.env.SLACK_APP_TOKEN
});

// Start the app
(async () => {
  try {
    // Initialize all services
    await initializeServices();
    
    // Start the Slack app in Socket Mode
    await app.start();
    console.log('⚡️ Bolt app is running!');

    // Check channel connections
    const client = app.client;
    const channels = ['C06QZJ4KX4P', 'C06QZJ4KX4Q']; // Add your channel IDs here
    for (const channel of channels) {
      try {
        const result = await client.conversations.info({ channel });
        console.log(`Connected to channel: ${result.channel.name}`);
      } catch (error) {
        console.error(`Error connecting to channel ${channel}:`, error.message);
      }
    }
  } catch (error) {
    console.error('Error starting app:', error.message);
    process.exit(1);
  }
})(); 