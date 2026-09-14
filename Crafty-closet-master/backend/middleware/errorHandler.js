// backend/middleware/errorHandler.js
const errorHandler = (err, req, res, next) => {
  if (process.env.NODE_ENV !== 'production') {
    console.error(`[ERROR] ${req.method} ${req.originalUrl}`, err.message);
  }

  // MySQL errors
  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({ success: false, message: 'A record with this value already exists.' });
  }
  if (err.code === 'ER_NO_REFERENCED_ROW_2') {
    return res.status(400).json({ success: false, message: 'Referenced resource not found.' });
  }

  // Multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ success: false, message: `File too large. Maximum ${process.env.MAX_FILE_SIZE_MB || 5} MB.` });
  }
  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({ success: false, message: 'Invalid file field.' });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ success: false, message: 'Invalid token.' });
  }
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ success: false, message: 'Token expired.' });
  }

  // Custom HTTP errors
  if (err.status) {
    return res.status(err.status).json({ success: false, message: err.message });
  }

  // Fallback
  const message = process.env.NODE_ENV === 'production' ? 'Internal server error.' : err.message;
  res.status(500).json({ success: false, message });
};

module.exports = errorHandler;
