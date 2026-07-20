const { v2: cloudinary } = require('cloudinary');
const config = require('./env');
const logger = require('../utils/logger');

/**
 * Configure Cloudinary. Upload routes are added in Phase 4; we configure it now
 * so the connection is validated at boot and ready when needed.
 */
function configureCloudinary() {
  if (!config.cloudinary.cloudName || !config.cloudinary.apiKey || !config.cloudinary.apiSecret) {
    logger.warn('Cloudinary credentials missing — file uploads will be disabled until configured.');
    return false;
  }
  cloudinary.config({
    cloud_name: config.cloudinary.cloudName,
    api_key: config.cloudinary.apiKey,
    api_secret: config.cloudinary.apiSecret,
    secure: true,
  });
  logger.info('Cloudinary configured');
  return true;
}

module.exports = { cloudinary, configureCloudinary };
