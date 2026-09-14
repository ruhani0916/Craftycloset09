// backend/middleware/cloudinaryUpload.js
// ─────────────────────────────────────────────────────────────────────
// Takes the in-memory buffer from multer (req.file.buffer) and uploads
// it to Cloudinary. Attaches the public URL to req.uploadedImageUrl.
// ─────────────────────────────────────────────────────────────────────
const cloudinary = require('cloudinary').v2;

// Configure from env vars (set once at module load)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Middleware: upload req.file buffer to Cloudinary.
 * Must be placed AFTER multer middleware in the route chain.
 */
const cloudinaryUpload = async (req, _res, next) => {
  try {
    // If no file was uploaded, skip — this allows optional image updates
    if (!req.file) return next();

    // Upload buffer to Cloudinary via a stream
    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: 'crafty-closet/products',
          resource_type: 'image',
          transformation: [
            { width: 800, height: 800, crop: 'limit', quality: 'auto', fetch_format: 'auto' },
          ],
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      stream.end(req.file.buffer);
    });

    req.uploadedImageUrl = result.secure_url;
    next();
  } catch (err) {
    console.error('❌ Cloudinary upload failed:', err.message);
    next(err);
  }
};

module.exports = cloudinaryUpload;
