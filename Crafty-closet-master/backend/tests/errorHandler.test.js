// backend/tests/errorHandler.test.js
'use strict';

const errorHandler = require('../middleware/errorHandler');

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json   = jest.fn().mockReturnValue(res);
  return res;
};
const mockReq  = () => ({ method: 'GET', originalUrl: '/test' });
const mockNext = jest.fn();

describe('errorHandler middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NODE_ENV = 'test'; // non-production
  });

  test('handles MySQL duplicate entry (ER_DUP_ENTRY) → 409', () => {
    const err = new Error('dup'); err.code = 'ER_DUP_ENTRY';
    const res = mockRes();
    errorHandler(err, mockReq(), res, mockNext);
    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
  });

  test('handles MySQL foreign key error (ER_NO_REFERENCED_ROW_2) → 400', () => {
    const err = new Error('fk'); err.code = 'ER_NO_REFERENCED_ROW_2';
    const res = mockRes();
    errorHandler(err, mockReq(), res, mockNext);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('handles Multer file-too-large (LIMIT_FILE_SIZE) → 413', () => {
    const err = new Error('big'); err.code = 'LIMIT_FILE_SIZE';
    const res = mockRes();
    errorHandler(err, mockReq(), res, mockNext);
    expect(res.status).toHaveBeenCalledWith(413);
  });

  test('handles Multer unexpected file (LIMIT_UNEXPECTED_FILE) → 400', () => {
    const err = new Error('field'); err.code = 'LIMIT_UNEXPECTED_FILE';
    const res = mockRes();
    errorHandler(err, mockReq(), res, mockNext);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('handles JsonWebTokenError → 401', () => {
    const err = new Error('bad jwt'); err.name = 'JsonWebTokenError';
    const res = mockRes();
    errorHandler(err, mockReq(), res, mockNext);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  test('handles TokenExpiredError → 401', () => {
    const err = new Error('expired'); err.name = 'TokenExpiredError';
    const res = mockRes();
    errorHandler(err, mockReq(), res, mockNext);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  test('uses err.status for custom HTTP errors', () => {
    const err = new Error('Not found'); err.status = 404;
    const res = mockRes();
    errorHandler(err, mockReq(), res, mockNext);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Not found' }));
  });

  test('falls back to 500 for unknown errors (dev mode shows message)', () => {
    const err = new Error('something exploded');
    const res = mockRes();
    errorHandler(err, mockReq(), res, mockNext);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'something exploded' }));
  });

  test('hides error details in production mode', () => {
    process.env.NODE_ENV = 'production';
    const err = new Error('secret db creds leak');
    const res = mockRes();
    errorHandler(err, mockReq(), res, mockNext);
    expect(res.status).toHaveBeenCalledWith(500);
    const body = res.json.mock.calls[0][0];
    expect(body.message).toBe('Internal server error.');
    process.env.NODE_ENV = 'test';
  });
});
