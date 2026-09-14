// backend/config/firebase.js
const admin = require('firebase-admin');

// Guard against double-initialization (e.g. during tests when modules are re-required)
if (!admin.apps.length) {
  try {
    let credential;

    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      // Explicit service-account JSON encoded as base64 — used in production / CI
      const serviceAccount = JSON.parse(
        Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT, 'base64').toString('utf8')
      );
      credential = admin.credential.cert(serviceAccount);
    } else {
      // Fall back to GOOGLE_APPLICATION_CREDENTIALS env var or GCP metadata server
      credential = admin.credential.applicationDefault();
    }

    admin.initializeApp({
      credential,
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET || 'crafty-closet-5dc41.firebasestorage.app',
    });
    console.log('✅ Firebase Admin initialized successfully.');
  } catch (error) {
    // Re-throw so startup fails loudly rather than silently accepting all auth requests
    console.error('❌ Firebase Admin initialization failed:', error.message);
    throw error;
  }
}

module.exports = admin;
