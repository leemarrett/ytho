require('dotenv').config();
const { App } = require('@slack/bolt');
const express = require('express');
const mongoose = require('mongoose');
const { setupSlackBot } = require('./services/slack');
const { setupYouTubeClient } = require('./services/youtube');
const { setupDatabase } = require('./services/database');

// Initialize Express app
const app = express();
const port = process.env.PORT || 3000;

// Initialize Slack app
const slackApp = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  socketMode: true,
  appToken: process.env.SLACK_APP_TOKEN
});

// Initialize services
async function initializeServices() {
  try {
    // Setup database connection
    await setupDatabase();
    
    // Setup Slack bot
    await setupSlackBot(slackApp);
    
    // Setup YouTube client
    await setupYouTubeClient();
    
    console.log('All services initialized successfully');
  } catch (error) {
    console.error('Failed to initialize services:', error);
    process.exit(1);
  }
}

// Start the application
async function startApp() {
  try {
    // Initialize all services
    await initializeServices();
    
    // Start Slack app
    await slackApp.start();
    
    // Start Express server
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  } catch (error) {
    console.error('Failed to start application:', error);
    process.exit(1);
  }
}

startApp(); 