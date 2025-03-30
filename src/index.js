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
  } catch (error) {
    console.error('Error starting app:', error.message);
    process.exit(1);
  }
})(); 