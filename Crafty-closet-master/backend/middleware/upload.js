// backend/middleware/upload.js
const multer = require('multer');

// Use memory storage — file is kept in req.file.buffer, never written to disk.
// This avoids Render's ephemeral filesystem issue.
const storage = multer.memoryStorage();

const fileFilter = (_req, file, cb) => {
  const allowed = /^image\/(jpeg|jpg|png|webp|gif)$/;
  if (allowed.test(file.mimetype)) return cb(null, true);
  cb(new Error('Only image files are allowed (jpeg, jpg, png, webp, gif)'));
};

const upload = multer({
  storage,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE_MB || '5') * 1024 * 1024 },
  fileFilter,
});

module.exports = upload;
