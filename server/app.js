const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const compression = require('compression');
const cookieParser = require('cookie-parser');

const config = require('./config/env');
const routes = require('./routes');
const { errorHandler, notFound } = require('./middleware/error');
const { apiLimiter } = require('./middleware/rateLimit');
const { configureCloudinary } = require('./config/cloudinary');
const logger = require('./utils/logger');

const app = express();

// Trust first proxy hop so secure cookies + req.ip behave behind a reverse proxy.
app.set('trust proxy', 1);

// --- Security & parsing middleware ---
app.use(helmet());
app.use(compression());
app.use(
  cors({
    origin(origin, cb) {
      // Allow same-origin/server-to-server (no Origin header) and whitelisted clients.
      if (!origin || config.clientUrls.includes(origin)) return cb(null, true);
      return cb(new Error(`CORS blocked origin: ${origin}`));
    },
    credentials: true,
  })
);
const path = require('path');
app.use(express.json({ limit: '10mb' })); // Increased for attachments
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(morgan(config.isDev ? 'dev' : 'combined', { skip: (req) => req.path === '/health' }));

// --- Health check (no rate limit) ---
app.get('/health', (_req, res) =>
  res.status(200).json({
    success: true,
    message: 'OK',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  })
);

// --- API ---
app.use('/api', apiLimiter, routes);

// --- 404 + error handling ---
app.use(notFound);
app.use(errorHandler);

// Boot-time cloudinary config check (non-fatal).
configureCloudinary();

// Surface unhandled rejections / exceptions instead of hanging.
process.on('unhandledRejection', (reason) => logger.error('Unhandled rejection:', reason));
process.on('uncaughtException', (err) => {
  logger.error('Uncaught exception:', err.message);
  process.exit(1);
});

module.exports = app;
// Trigger nodemon restart
