import dotenv from 'dotenv';
import app from './app.js';
import { connectDB } from './config/db.js';
import { LoveNote } from './models/index.js';
import mongoose from 'mongoose';

// Load environmental variables
dotenv.config();

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  // Connect DB
  await connectDB();


  // Start Listener
  const server = app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode.`);
    console.log(`👉 Access API Health at http://localhost:${PORT}/api/health`);
  });

  // --- Graceful Shutdown ---
  // Ensures MongoDB connection is properly closed before the process exits.
  // PM2 and systemd send SIGTERM for graceful restarts.
  const shutdown = async (signal) => {
    console.log(`\n🔴 Received ${signal}. Shutting down gracefully...`);
    server.close(async () => {
      try {
        await mongoose.connection.close();
        console.log('💾 MongoDB connection closed cleanly.');
      } catch (err) {
        console.error('❌ Error closing MongoDB:', err.message);
      }
      console.log('✅ Server shut down successfully.');
      process.exit(0);
    });

    // Force-exit if not closed within 10 seconds
    setTimeout(() => {
      console.error('⚠️ Forced shutdown after timeout.');
      process.exit(1);
    }, 10_000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  // Handle uncaught exceptions to prevent silent crashes
  process.on('uncaughtException', (err) => {
    console.error('💥 Uncaught Exception:', err.message);
    shutdown('uncaughtException');
  });

  process.on('unhandledRejection', (reason) => {
    console.error('💥 Unhandled Rejection:', reason);
    shutdown('unhandledRejection');
  });
};

startServer();
// Reload trigger: 100% pure MongoDB data only




