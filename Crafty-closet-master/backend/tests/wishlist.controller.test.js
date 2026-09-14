// backend/tests/wishlist.controller.test.js
'use strict';

const pool = require('../config/db');
const ctrl = require('../controllers/wishlistController');

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json   = jest.fn().mockReturnValue(res);
  return res;
};
const next   = jest.fn();
const userId = 7;

const WISHLIST_ITEMS = [
  { id: 1, product_id: 5, name: 'Gold Ring', price: '499.00', category: 'rings', stock: 10, is_active: 1 },
];

beforeEach(() => jest.clearAllMocks());

describe('getWishlist', () => {
  test('returns items for user', async () => {
    pool.query.mockResolvedValueOnce([WISHLIST_ITEMS, []]);
    const res = mockRes();
    await ctrl.getWishlist({ user: { id: userId } }, res, next);
    expect(res.json).toHaveBeenCalledWith({ success: true, items: WISHLIST_ITEMS });
  });

  test('returns empty list when nothing wishlisted', async () => {
    pool.query.mockResolvedValueOnce([[], []]);
    const res = mockRes();
    await ctrl.getWishlist({ user: { id: userId } }, res, next);
    expect(res.json).toHaveBeenCalledWith({ success: true, items: [] });
  });

  test('calls next(err) on DB failure', async () => {
    pool.query.mockRejectedValueOnce(new Error('DB error'));
    await ctrl.getWishlist({ user: { id: userId } }, mockRes(), next);
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });
});

describe('addToWishlist', () => {
  test('adds item successfully', async () => {
    pool.query
      .mockResolvedValueOnce([[{ id: 5 }], []])    // product check
      .mockResolvedValueOnce([{ affectedRows: 1 }, []]);  // INSERT IGNORE

    const req = { user: { id: userId }, body: { product_id: 5 } };
    const res = mockRes();
    await ctrl.addToWishlist(req, res, next);
    expect(res.json).toHaveBeenCalledWith({ success: true, message: 'Added to wishlist.' });
  });

  test('returns 404 for unknown product', async () => {
    pool.query.mockResolvedValueOnce([[], []]);
    const req = { user: { id: userId }, body: { product_id: 999 } };
    const res = mockRes();
    await ctrl.addToWishlist(req, res, next);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('silently succeeds (INSERT IGNORE) when item already in wishlist', async () => {
    pool.query
      .mockResolvedValueOnce([[{ id: 5 }], []])
      .mockResolvedValueOnce([{ affectedRows: 0 }, []]);  // duplicate, ignored

    const req = { user: { id: userId }, body: { product_id: 5 } };
    const res = mockRes();
    await ctrl.addToWishlist(req, res, next);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });
});

describe('removeFromWishlist', () => {
  test('removes item and returns success', async () => {
    pool.query.mockResolvedValueOnce([{ affectedRows: 1 }, []]);
    const req = { user: { id: userId }, params: { productId: 5 } };
    const res = mockRes();
    await ctrl.removeFromWishlist(req, res, next);
    expect(res.json).toHaveBeenCalledWith({ success: true, message: 'Removed from wishlist.' });
  });

  test('still returns success when item was not in wishlist (idempotent)', async () => {
    pool.query.mockResolvedValueOnce([{ affectedRows: 0 }, []]);
    const req = { user: { id: userId }, params: { productId: 999 } };
    const res = mockRes();
    await ctrl.removeFromWishlist(req, res, next);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });
});
