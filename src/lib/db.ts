/* eslint-disable no-console */
import mongoose from 'mongoose';
import { config } from '../utils/config';

declare global {
  var mongooseCache:
    | {
        conn: mongoose.Connection | null;
        promise: Promise<mongoose.Mongoose> | null;
      }
    | undefined;
}

let cached = global.mongooseCache;

if (!cached) {
  cached = global.mongooseCache = { conn: null, promise: null };
}

const connectDB = async () => {
  const MONGODB_URI = config.MONGODB_URI;

  // If a connection already exists, return it (cached)
  if (cached?.conn) {
    console.log('[database]: Using existing cached connection');
    return cached.conn;
  }

  if (!cached?.promise) {
    const opts = {
      bufferCommands: false,
    };

    console.log('[database]: Creating new connection...');
    cached!.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      console.log(`[database]: MongoDB Connected: ${mongoose.connection.host}`);
      return mongoose;
    });
  }

  try {
    const mongooseInstance = await cached!.promise;
    cached!.conn = mongooseInstance.connection;
  } catch (error) {
    cached!.promise = null; // Reset promise so we can attempt to connect again later
    console.error('[database]: Connection error:', error);
    process.exit(1);
  }

  return cached!.conn;
};

// Event listeners for robust error handling during the connection's lifecycle
mongoose.connection.on('disconnected', () => {
  console.warn('[database]: MongoDB disconnected');
});

mongoose.connection.on('error', (err) => {
  console.error('[database]: MongoDB connection error:', err);
});

export { connectDB };
