require('dotenv').config();
const { App } = require('@slack/bolt');
const { setupSlackBot } = require('./services/slack');
const { setupYouTubeClient } = require('./services/youtube');
const mongoose = require('mongoose');

// Initialize Slack app
const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  socketMode: true,
  appToken: process.env.SLACK_APP_TOKEN
});

// Initialize services
async function initializeServices() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Initialize YouTube client
    await setupYouTubeClient();

    // Setup Slack bot
    await setupSlackBot(app);

    console.log('Services initialized');
  } catch (error) {
    console.error('Error initializing services:', error.message);
    process.exit(1);
  }
}

// Start the app
(async () => {
  try {
    await initializeServices();
    
    // Start the app in Socket Mode
    await app.start();
    console.log('⚡️ Bolt app is running!');
  } catch (error) {
    console.error('Error starting app:', error.message);
    process.exit(1);
  }
})(); 