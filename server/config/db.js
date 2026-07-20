const mongoose = require('mongoose');
const config = require('./env');
const logger = require('../utils/logger');

/**
 * Connect to MongoDB. Called once at boot. Exits the process on fatal failure
 * so the orchestrator/container manager can restart it cleanly.
 */
async function connectDB() {
  mongoose.set('strictQuery', true);

  mongoose.connection.on('connected', () => {
    logger.info(`MongoDB connected: ${mongoose.connection.host}/${mongoose.connection.name}`);
  });
  mongoose.connection.on('reconnected', () => logger.warn('MongoDB reconnected'));
  mongoose.connection.on('disconnected', () => logger.warn('MongoDB disconnected'));

  try {
    let uri = config.mongoUri;
    try {
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 2000, // Reduced timeout for faster fallback
        autoIndex: config.isDev,
      });
      return mongoose.connection;
    } catch (initialErr) {
      if (config.isDev && (uri.includes('127.0.0.1') || uri.includes('localhost'))) {
        logger.warn('Local MongoDB connection failed. Falling back to mongodb-memory-server...');
        const { MongoMemoryServer } = require('mongodb-memory-server');
        const mongoServer = await MongoMemoryServer.create();
        uri = mongoServer.getUri();
        await mongoose.connect(uri, {
          serverSelectionTimeoutMS: 10000,
          autoIndex: config.isDev,
        });
        return mongoose.connection;
      }
      throw initialErr;
    }
  } catch (err) {
    logger.error('MongoDB connection failed:', err.message);
    process.exit(1);
  }
}

/** Graceful shutdown used by the HTTP server's SIGTERM/SIGINT handlers. */
async function closeDB() {
  try {
    await mongoose.connection.close();
    logger.info('MongoDB connection closed');
  } catch (err) {
    logger.error('Error closing MongoDB:', err.message);
  }
}

module.exports = { connectDB, closeDB };
