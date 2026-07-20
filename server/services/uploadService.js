const multer = require('multer');
const { v2: cloudinary } = require('../config/cloudinary');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');

/**
 * Cloudinary upload helper. Used by Phase 4 (documents/photos/labels). Defined
 * now so upload security rules are in one place and reused later.
 *
 * For Phase 1 we keep memory storage; Cloudinary push happens in Phase 4 once
 * the credentials are configured. This module never crashes if Cloudinary is
 * unconfigured — it returns a clear operational error instead.
 */

const ALLOWED_MIME = new Set([
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
  'application/pdf',
]);

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

const memoryUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_BYTES },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME.has(file.mimetype)) {
      return cb(new ApiError(400, `File type not allowed: ${file.mimetype}`));
    }
    cb(null, true);
  },
});

async function uploadToCloudinary(file, { folder = 'classic-express' } = {}) {
  if (!cloudinary.config().cloud_name) {
    throw new ApiError(503, 'File uploads are not configured.');
  }
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder, resource_type: 'auto' },
      (err, result) => {
        if (err) {
          logger.error('Cloudinary upload error:', err.message);
          return reject(new ApiError(500, 'File upload failed.'));
        }
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          format: result.format,
          bytes: result.bytes,
          resourceType: result.resource_type,
        });
      }
    );
    uploadStream.end(file.buffer);
  });
}

module.exports = { memoryUpload, uploadToCloudinary, ALLOWED_MIME, MAX_BYTES };
