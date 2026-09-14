// backend/tests/auth.controller.test.js
'use strict';

const admin = require('../config/firebase');
const pool  = require('../config/db');
const ctrl  = require('../controllers/authController');

// ── Helpers ─────────────────────────────────────────────────────
const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json   = jest.fn().mockReturnValue(res);
  return res;
};

const bearerReq = (token = 'tok') => ({
  headers: { authorization: `Bearer ${token}` },
  user: null,
});

const DB_USER = { id: 1, name: 'Alice', email: 'alice@test.com', role: 'user', is_active: 1, avatar: 'https://pic.test/a.jpg' };

// ── syncUser ─────────────────────────────────────────────────────
describe('POST /auth/sync  →  syncUser', () => {
  beforeEach(() => jest.clearAllMocks());

  test('creates a new user and returns safeUser', async () => {
    admin.__mockVerifyIdToken.mockResolvedValue({
      email: 'alice@test.com', name: 'Alice', picture: 'https://pic.test/a.jpg',
    });
    // SELECT returns empty (user not yet in DB)
    pool.query
      .mockResolvedValueOnce([[], []])
      // INSERT
      .mockResolvedValueOnce([{ insertId: 1, affectedRows: 1 }, []]);

    const req  = bearerReq();
    const res  = mockRes();
    const next = jest.fn();

    await ctrl.syncUser(req, res, next);

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      user: expect.objectContaining({ id: 1, email: 'alice@test.com', role: 'user' }),
    });
    expect(next).not.toHaveBeenCalled();
  });

  test('returns existing user and syncs updated avatar', async () => {
    admin.__mockVerifyIdToken.mockResolvedValue({
      email: 'alice@test.com', name: 'Alice', picture: 'https://new-avatar.test/a.jpg',
    });
    pool.query
      .mockResolvedValueOnce([[{ ...DB_USER, avatar: 'OLD' }], []])  // SELECT
      .mockResolvedValueOnce([{ affectedRows: 1 }, []]);             // UPDATE avatar

    const req  = bearerReq();
    const res  = mockRes();
    const next = jest.fn();

    await ctrl.syncUser(req, res, next);

    expect(pool.query).toHaveBeenCalledTimes(2);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  test('returns 401 when no Authorization header', async () => {
    const req  = { headers: {} };
    const res  = mockRes();
    const next = jest.fn();

    await ctrl.syncUser(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
  });

  test('returns 400 NO_EMAIL for GitHub user with no email', async () => {
    admin.__mockVerifyIdToken.mockResolvedValue({ uid: 'gh-uid', email: undefined });

    const req  = bearerReq();
    const res  = mockRes();
    const next = jest.fn();

    await ctrl.syncUser(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ code: 'NO_EMAIL' }));
  });

  test('returns 401 for deactivated account', async () => {
    admin.__mockVerifyIdToken.mockResolvedValue({ email: 'banned@test.com', name: 'Banned', picture: null });
    pool.query.mockResolvedValueOnce([[{ ...DB_USER, email: 'banned@test.com', is_active: 0 }], []]);

    const req  = bearerReq();
    const res  = mockRes();
    const next = jest.fn();

    await ctrl.syncUser(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Account deactivated.' }));
  });

  test('calls next(err) on unexpected DB error', async () => {
    admin.__mockVerifyIdToken.mockResolvedValue({ email: 'alice@test.com', name: 'Alice', picture: null });
    pool.query.mockRejectedValueOnce(new Error('DB connection lost'));

    const req  = bearerReq();
    const res  = mockRes();
    const next = jest.fn();

    await ctrl.syncUser(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });

  test('uses uid-derived name when name is missing', async () => {
    admin.__mockVerifyIdToken.mockResolvedValue({ email: 'bob@test.com', name: undefined, picture: null });
    pool.query
      .mockResolvedValueOnce([[], []])
      .mockResolvedValueOnce([{ insertId: 2, affectedRows: 1 }, []]);

    const req  = bearerReq();
    const res  = mockRes();
    const next = jest.fn();

    await ctrl.syncUser(req, res, next);

    const inserted = pool.query.mock.calls[1][1]; // second query args
    expect(inserted[0]).toBe('bob'); // name derived from email
  });
});

// ── me ────────────────────────────────────────────────────────────
describe('GET /auth/me  →  me', () => {
  test('returns safeUser from req.user', () => {
    const req  = { user: DB_USER };
    const res  = mockRes();

    ctrl.me(req, res);

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      user: {
        id:     1,
        name:   'Alice',
        email:  'alice@test.com',
        role:   'user',
        avatar: 'https://pic.test/a.jpg',
      },
    });
  });

  test('returns null avatar when missing', () => {
    const req  = { user: { ...DB_USER, avatar: undefined } };
    const res  = mockRes();

    ctrl.me(req, res);

    const resp = res.json.mock.calls[0][0];
    expect(resp.user.avatar).toBeNull();
  });
});
