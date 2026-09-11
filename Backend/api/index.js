const mongoose = require('mongoose');
const app = require('../src/app');

// Vercel serverless functions are stateless. We need to cache the DB connection
// across lambda invocations to prevent exhausting database connections.
let isConnected = false;

const connectToDatabase = async () => {
  if (isConnected) {
    return;
  }

  const MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI) {
    throw new Error("MONGODB_URI is missing in environment variables");
  }

  try {
    const db = await mongoose.connect(MONGODB_URI);
    isConnected = db.connections[0].readyState === 1;
    console.log('MongoDB connected for serverless function');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    throw err;
  }
};

// Export the serverless handler
module.exports = async (req, res) => {
  await connectToDatabase();
  
  // Pass the request to the Express app
  return app(req, res);
};
