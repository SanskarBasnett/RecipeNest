/**
 * @file upload.middleware.js
 * @description Multer configuration for handling image file uploads.
 *
 * Configures:
 *  - Disk storage: files are saved to the `uploads/` directory with a
 *    timestamp-prefixed filename to avoid collisions.
 *  - File type filter: only JPEG, JPG, PNG, and WebP images are accepted.
 *  - File size limit: 5 MB maximum per upload.
 *
 * Usage in routes:
 *   upload.single('fieldName')  — for a single file field
 *   upload.array('fieldName')   — for multiple files on the same field
 */

const multer = require('multer');
const path   = require('path');

// ---------------------------------------------------------------------------
// Storage Engine
// Determines where uploaded files are saved and what they are named.
// ---------------------------------------------------------------------------
const storage = multer.diskStorage({
  /**
   * Sets the destination folder for uploaded files.
   * The `uploads/` path is relative to the working directory (backend/).
   */
  destination: (req, file, cb) => cb(null, 'uploads/'),

  /**
   * Generates a unique filename for each upload.
   * Format: <unix-timestamp>-<sanitized-original-name>
   * Spaces in the original filename are replaced with hyphens to keep
   * the path URL-safe and avoid filesystem issues.
   */
  filename: (req, file, cb) =>
    cb(null, `${Date.now()}-${file.originalname.replace(/\s+/g, '-')}`),
});

// ---------------------------------------------------------------------------
// File Type Filter
// Rejects any upload whose extension or MIME type is not an allowed image
// format. Both checks are required to prevent MIME-type spoofing.
// ---------------------------------------------------------------------------
const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|webp/;

  // Check the file extension (case-insensitive)
  const ext  = allowed.test(path.extname(file.originalname).toLowerCase());

  // Check the MIME type reported by the client
  const mime = allowed.test(file.mimetype);

  if (ext && mime) return cb(null, true); // Accept the file

  // Reject with a descriptive error; multer will pass this to the error handler
  cb(new Error('Only image files are allowed'));
};

// ---------------------------------------------------------------------------
// Multer Instance
// Combines storage, filter, and size limit into a single middleware factory.
// 5 MB limit keeps uploads manageable and prevents abuse.
// ---------------------------------------------------------------------------
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB in bytes
});

module.exports = upload;
