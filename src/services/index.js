const mongoose = require('mongoose');
const { setupYouTubeClient } = require('./youtube');

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
    throw error;
  }
}

module.exports = {
  initializeServices
}; 