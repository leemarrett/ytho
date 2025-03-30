require('dotenv').config();
const { App } = require('@slack/bolt');
const express = require('express');
const { initializeServices } = require('./services');
const { setupYouTubeClient } = require('./services/youtube');
const mongoose = require('mongoose');

// Initialize Express app for health checks
const expressApp = express();
const port = process.env.PORT || 10000;

// Health check endpoint
expressApp.get('/', (req, res) => {
  res.send('OK');
});

// Initialize Slack app
const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
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
    
    // Start Express server for health checks
    expressApp.listen(port, '0.0.0.0', () => {
      console.log(`Health check server running on port ${port}`);
    });
    
    // Start the Slack app in Socket Mode
    await app.start();
    console.log('⚡️ Bolt app is running!');
  } catch (error) {
    console.error('Error starting app:', error.message);
    process.exit(1);
  }
})(); 