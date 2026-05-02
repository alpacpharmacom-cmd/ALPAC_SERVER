/* eslint-disable no-console */
import { app } from './app';
import { connectDB } from './lib/db';
import mongoose from 'mongoose';
import { config } from './utils/config';

const PORT = config.PORT || 3000;

// Connect to Database
connectDB();

const server = app.listen(PORT, () => {
  console.log(`[server]: Server is running at http://localhost:${PORT}`);
});

// Global Error Handling & Graceful Shutdown
process.on('unhandledRejection', (reason: unknown) => {
  console.error('[server]: UNHANDLED REJECTION! Shutting down...');
  console.error(reason);
  server.close(() => process.exit(1));
});

process.on('uncaughtException', (err: unknown) => {
  console.error('[server]: UNCAUGHT EXCEPTION! Shutting down...');
  console.error(err);
  process.exit(1);
});

const gracefulShutdown = (signal: string) => {
  console.log(`[server]: ${signal} received. Shutting down gracefully...`);
  server.close(async () => {
    console.log('[server]: Static server closed.');
    await mongoose.connection.close();
    console.log('[server]: Database connection closed.');
    process.exit(0);
  });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
