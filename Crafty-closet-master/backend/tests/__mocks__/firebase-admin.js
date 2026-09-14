// backend/tests/__mocks__/firebase-admin.js
// Jest manual mock for firebase-admin so tests never hit the real Firebase service.

const mockVerifyIdToken = jest.fn();
const mockGetUser       = jest.fn();

const admin = {
  apps: ['mock-app'], // non-empty so !admin.apps.length check is false
  auth: jest.fn(() => ({
    verifyIdToken: mockVerifyIdToken,
    getUser:       mockGetUser,
  })),
  credential: {
    cert:               jest.fn(),
    applicationDefault: jest.fn(),
  },
  initializeApp: jest.fn(),
};

// Expose helpers so individual test files can configure behaviour per-test
admin.__mockVerifyIdToken = mockVerifyIdToken;
admin.__mockGetUser       = mockGetUser;

module.exports = admin;
