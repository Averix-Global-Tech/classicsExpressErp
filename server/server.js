const app = require('./app');
const config = require('./config/env');
const { connectDB, closeDB } = require('./config/db');
const logger = require('./utils/logger');

// Start server function
async function start() {
  await connectDB();

  const server = app.listen(config.port, () => {
    logger.info(`Classic Express ERP API running on http://localhost:${config.port}`);
    logger.info(`Environment: ${config.env}`);
  });

  const shutdown = (signal) => {
    logger.info(`${signal} received — shutting down gracefully...`);
    server.close(async () => {
      await closeDB();
      process.exit(0);
    });
    // Hard exit if graceful close stalls.
    setTimeout(() => process.exit(1), 10000).unref();
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

start().catch((err) => {
  logger.error('Failed to start server:', err);
  process.exit(1);
});

