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
    console.log('Connected to MongoDB successfully');

    // Initialize YouTube client
    await setupYouTubeClient();

    // Setup Slack bot
    await setupSlackBot(app);

    console.log('All services initialized successfully');
  } catch (error) {
    console.error('Error initializing services:', error);
    process.exit(1);
  }
}

// Start the app
(async () => {
  try {
    await initializeServices();
    
    // Start the app
    const port = process.env.PORT || 3000;
    await app.start(port);
    console.log(`Server is running on port ${port}`);
  } catch (error) {
    console.error('Error starting app:', error);
    process.exit(1);
  }
})(); 