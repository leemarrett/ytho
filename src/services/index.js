const mongoose = require('mongoose');
const { setupYouTubeClient } = require('./youtube');

function validateMongoDBUri(uri) {
  if (!uri) {
    return { valid: false, error: 'MONGODB_URI is not set' };
  }

  // Check if it's a valid MongoDB URI format
  if (!uri.startsWith('mongodb://') && !uri.startsWith('mongodb+srv://')) {
    return { valid: false, error: 'MONGODB_URI must start with mongodb:// or mongodb+srv://' };
  }

  // Extract hostname for validation
  const hostnameMatch = uri.match(/@([^/]+)\//);
  if (hostnameMatch) {
    const hostname = hostnameMatch[1];
    // MongoDB Atlas hostnames typically contain .mongodb.net
    if (uri.startsWith('mongodb+srv://') && !hostname.includes('.mongodb.net')) {
      return { 
        valid: false, 
        error: 'Invalid MongoDB Atlas hostname. SRV connection strings should use .mongodb.net domain' 
      };
    }
  }

  return { valid: true };
}

async function initializeServices() {
  try {
    // Check if MONGODB_URI is set
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI environment variable is not set. Please check your .env file.');
    }

    // Validate connection string format
    const validation = validateMongoDBUri(process.env.MONGODB_URI);
    if (!validation.valid) {
      throw new Error(`Invalid MONGODB_URI: ${validation.error}`);
    }

    // Sanitize URI for logging (remove credentials)
    const sanitizedUri = process.env.MONGODB_URI.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@');
    console.log('Connecting to MongoDB:', sanitizedUri);

    // Connect to MongoDB with options
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000, // Timeout after 10s
    });
    console.log('Connected to MongoDB');

    // Initialize YouTube client
    await setupYouTubeClient();

    console.log('Services initialized');
  } catch (error) {
    if (error.name === 'MongoServerSelectionError' || error.message.includes('ENOTFOUND')) {
      console.error('\n❌ MongoDB connection failed (DNS lookup error)');
      console.error('\nThis usually means:');
      console.error('  1. The MongoDB Atlas cluster doesn\'t exist or was deleted');
      console.error('  2. The connection string is outdated or incorrect');
      console.error('  3. The cluster hostname in the connection string is wrong');
      console.error('\nTo fix this:');
      console.error('  1. Log into MongoDB Atlas: https://cloud.mongodb.com');
      console.error('  2. Go to your cluster and click "Connect"');
      console.error('  3. Choose "Connect your application"');
      console.error('  4. Copy the new connection string');
      console.error('  5. Update MONGODB_URI in your .env file');
      console.error('  6. Make sure to replace <password> with your actual password');
      console.error('\nExample format: mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority');
      console.error('\nOriginal error:', error.message);
    } else {
      console.error('Error initializing services:', error.message);
    }
    throw error;
  }
}

module.exports = {
  initializeServices
}; 