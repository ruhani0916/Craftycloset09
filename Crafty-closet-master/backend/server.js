// backend/server.js
require('dotenv').config();
const express     = require('express');
const cors        = require('cors');
const helmet      = require('helmet');
const compression = require('compression');
const morgan      = require('morgan');
const path        = require('path');
const rateLimit   = require('express-rate-limit');

require('./config/db');                              // connect MySQL on startup
require('./config/firebase');                        // initialise Firebase Admin

const errorHandler = require('./middleware/errorHandler');

const app = express();

// ── Security headers ──────────────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(compression());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// ── CORS ──────────────────────────────────────────────────────
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map(o => o.trim());

app.use(cors({
  origin: (origin, callback) => {
    // Allow same-origin / no-origin requests (mobile apps, curl, etc.)
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: ${origin} not allowed`));
  },
  credentials:    true,
  methods:        ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ── Rate limiting ─────────────────────────────────────────────
app.use('/api/', rateLimit({
  windowMs: 60 * 1000,
  max:      300,
  standardHeaders: true,
  legacyHeaders:   false,
  message: { success: false, message: 'Too many requests. Please slow down.' },
}));

// Protect the sync endpoint (called after every sign-in)
app.use('/api/auth/sync', rateLimit({ windowMs: 60 * 1000, max: 30 }));

// ── Body parsers ──────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Static file serving ───────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── API Routes ────────────────────────────────────────────────
app.use('/api/auth',     require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/cart',     require('./routes/cart'));
app.use('/api/orders',   require('./routes/orders'));
app.use('/api/wishlist', require('./routes/wishlist'));
app.use('/api/admin',    require('./routes/admin'));

// ── Health check ──────────────────────────────────────────────
app.get('/api/health', (_req, res) => res.json({
  success: true,
  message: '💎 Crafty Closet API is running',
  env:     process.env.NODE_ENV || 'development',
  time:    new Date().toISOString(),
}));

// ── 404 ───────────────────────────────────────────────────────
app.use((_req, res) =>
  res.status(404).json({ success: false, message: 'Route not found.' })
);

// ── Global error handler ──────────────────────────────────────
app.use(errorHandler);

// ── Start ─────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n💎  Crafty Closet API  →  http://localhost:${PORT}`);
  console.log(`📦  Environment        →  ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗  Client URL         →  ${allowedOrigins.join(', ')}\n`);
});

module.exports = app;
