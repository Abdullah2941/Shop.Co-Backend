const mongoose = require('mongoose');

// Cached connection: serverless hosts (Vercel) reuse it between requests,
// and reconnect if it was dropped while the function was frozen.
let pending = global._mongoosePending || null;

const connectDB = async () => {
  const state = mongoose.connection.readyState; // 0 off, 1 on, 2 connecting, 3 disconnecting
  if (state === 1) return;
  if (state === 2 && pending) {
    await pending;
    return;
  }
  if (!process.env.MONGO_URI) throw new Error('MONGO_URI is not set in the environment variables');

  pending = global._mongoosePending = mongoose.connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 8000,
  });
  try {
    const conn = await pending;
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    pending = global._mongoosePending = null; // retry on the next request
    throw err;
  }
};

module.exports = connectDB;
