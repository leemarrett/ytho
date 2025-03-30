const mongoose = require('mongoose');

// Define schemas
const processedLinkSchema = new mongoose.Schema({
  url: { type: String, required: true, unique: true },
  videoId: { type: String, required: true },
  postedBy: { type: String, required: true },
  postedAt: { type: Date, default: Date.now },
  processedAt: { type: Date, default: Date.now }
});

const videoSchema = new mongoose.Schema({
  videoId: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  description: String,
  channelId: { type: String, required: true },
  postedAt: { type: Date, required: true },
  addedToChannelAt: { type: Date, default: Date.now }
});

// Create models
const ProcessedLink = mongoose.model('ProcessedLink', processedLinkSchema);
const Video = mongoose.model('Video', videoSchema);

// Database setup function
async function setupDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
}

module.exports = {
  setupDatabase,
  ProcessedLink,
  Video
}; 