// backend/tests/setup.js
// Runs before every test file.  Sets safe dummy env vars so modules that read
// process.env at import-time don't throw or try to connect to real services.
process.env.NODE_ENV              = 'test';
process.env.DB_HOST               = 'localhost';
process.env.DB_USER               = 'test';
process.env.DB_PASSWORD           = 'test';
process.env.DB_NAME               = 'test';
process.env.FIREBASE_SERVICE_ACCOUNT = ''; // empty → applicationDefault path (mocked)
