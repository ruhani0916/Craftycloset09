// backend/tests/auth.middleware.test.js
'use strict';

// Use the manual mocks wired via moduleNameMapper
const admin = require('../config/firebase');
const pool  = require('../config/db');
const { authenticate, requireAdmin, optionalAuth } = require('../middleware/auth');

// ── Helpers ─────────────────────────────────────────────────────
const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json   = jest.fn().mockReturnValue(res);
  return res;
};

const mockReq = (token = 'valid-token') => ({
  headers: { authorization: `Bearer ${token}` },
});

const DB_USER = { id: 1, name: 'Alice', email: 'alice@test.com', role: 'user', is_active: 1, avatar: null };
const DB_ADMIN = { ...DB_USER, role: 'admin' };

// ── authenticate ─────────────────────────────────────────────────
describe('authenticate middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('passes next() with valid token + existing DB user', async () => {
    admin.__mockVerifyIdToken.mockResolvedValue({ email: 'alice@test.com', name: 'Alice', picture: null });
    pool.query.mockResolvedValueOnce([[DB_USER], []]);

    const req  = mockReq();
    const res  = mockRes();
    const next = jest.fn();

    await authenticate(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.user).toMatchObject({ id: 1, email: 'alice@test.com' });
  });

  test('auto-creates user when not found in DB', async () => {
    admin.__mockVerifyIdToken.mockResolvedValue({ email: 'new@test.com', name: 'New User', picture: null });
    // First query (SELECT) returns empty, second (INSERT) returns insertId
    pool.query
      .mockResolvedValueOnce([[], []])
      .mockResolvedValueOnce([{ insertId: 99, affectedRows: 1 }, []]);

    const req  = mockReq();
    const res  = mockRes();
    const next = jest.fn();

    await authenticate(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.user.id).toBe(99);
    expect(req.user.email).toBe('new@test.com');
  });

  test('returns 401 when no Authorization header', async () => {
    const req  = { headers: {} };
    const res  = mockRes();
    const next = jest.fn();

    await authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  test('returns 401 for malformed Bearer token', async () => {
    const req  = { headers: { authorization: 'NotBearer token' } };
    const res  = mockRes();
    const next = jest.fn();

    await authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
  });

  test('returns 401 with NO_EMAIL code when token has no email (GitHub private email)', async () => {
    admin.__mockVerifyIdToken.mockResolvedValue({ uid: 'gh123', email: undefined });

    const req  = mockReq();
    const res  = mockRes();
    const next = jest.fn();

    await authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ code: 'NO_EMAIL' }));
    expect(next).not.toHaveBeenCalled();
  });

  test('returns 401 for deactivated account', async () => {
    admin.__mockVerifyIdToken.mockResolvedValue({ email: 'banned@test.com', name: 'Banned', picture: null });
    pool.query.mockResolvedValueOnce([[{ ...DB_USER, is_active: 0 }], []]);

    const req  = mockReq();
    const res  = mockRes();
    const next = jest.fn();

    await authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Account deactivated.' }));
    expect(next).not.toHaveBeenCalled();
  });

  test('returns 401 with "Session expired" for expired token', async () => {
    const expiredErr = new Error('Token expired');
    expiredErr.code  = 'auth/id-token-expired';
    admin.__mockVerifyIdToken.mockRejectedValue(expiredErr);

    const req  = mockReq();
    const res  = mockRes();
    const next = jest.fn();

    await authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('expired') }));
  });

  test('returns 401 with "Invalid token" for bad token', async () => {
    const badErr = new Error('Bad token');
    badErr.code  = 'auth/invalid-id-token';
    admin.__mockVerifyIdToken.mockRejectedValue(badErr);

    const req  = mockReq();
    const res  = mockRes();
    const next = jest.fn();

    await authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Invalid authentication token.' }));
  });
});

// ── requireAdmin ─────────────────────────────────────────────────
describe('requireAdmin middleware', () => {
  test('calls next() for admin role', () => {
    const req  = { user: DB_ADMIN };
    const res  = mockRes();
    const next = jest.fn();

    requireAdmin(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
  });

  test('returns 403 for non-admin user', () => {
    const req  = { user: DB_USER };
    const res  = mockRes();
    const next = jest.fn();

    requireAdmin(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  test('returns 403 when no user on req', () => {
    const req  = {};
    const res  = mockRes();
    const next = jest.fn();

    requireAdmin(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
  });
});

// ── optionalAuth ─────────────────────────────────────────────────
describe('optionalAuth middleware', () => {
  beforeEach(() => jest.clearAllMocks());

  test('attaches user when valid token and user exists', async () => {
    admin.__mockVerifyIdToken.mockResolvedValue({ email: 'alice@test.com' });
    pool.query.mockResolvedValueOnce([[{ id: 1, name: 'Alice', email: 'alice@test.com', role: 'user' }], []]);

    const req  = mockReq();
    const res  = mockRes();
    const next = jest.fn();

    await optionalAuth(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.user).toBeDefined();
  });

  test('calls next() without user when no Authorization header', async () => {
    const req  = { headers: {} };
    const res  = mockRes();
    const next = jest.fn();

    await optionalAuth(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.user).toBeUndefined();
  });

  test('calls next() without user when token has no email (GitHub private)', async () => {
    admin.__mockVerifyIdToken.mockResolvedValue({ uid: 'gh-uid', email: undefined });

    const req  = mockReq();
    const res  = mockRes();
    const next = jest.fn();

    await optionalAuth(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.user).toBeUndefined();
  });

  test('calls next() even when token verification throws', async () => {
    admin.__mockVerifyIdToken.mockRejectedValue(new Error('Token boom'));

    const req  = mockReq();
    const res  = mockRes();
    const next = jest.fn();

    await optionalAuth(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.user).toBeUndefined();
  });
});
