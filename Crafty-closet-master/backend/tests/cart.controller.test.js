// backend/tests/cart.controller.test.js
'use strict';

const pool = require('../config/db');
const ctrl = require('../controllers/cartController');

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json   = jest.fn().mockReturnValue(res);
  return res;
};
const next   = jest.fn();
const userId = 1;

const CART_ITEMS = [
  { id: 10, quantity: 2, product_id: 5, name: 'Ring', price: '299.00', compare_price: null, image: null, stock: 10, category: 'rings', is_active: 1 },
];

beforeEach(() => { jest.clearAllMocks(); });

// ── getCart ───────────────────────────────────────────────────────
describe('getCart', () => {
  test('returns items, subtotal and count', async () => {
    pool.query.mockResolvedValueOnce([CART_ITEMS, []]);
    const req = { user: { id: userId } };
    const res = mockRes();

    await ctrl.getCart(req, res, next);

    expect(res.json).toHaveBeenCalledWith({
      success:  true,
      items:    CART_ITEMS,
      subtotal: 598.00,
      count:    2,
    });
  });

  test('returns empty cart when no items', async () => {
    pool.query.mockResolvedValueOnce([[], []]);
    const req = { user: { id: userId } };
    const res = mockRes();

    await ctrl.getCart(req, res, next);

    const body = res.json.mock.calls[0][0];
    expect(body.items).toHaveLength(0);
    expect(body.count).toBe(0);
    expect(body.subtotal).toBe(0);
  });

  test('calls next(err) on DB failure', async () => {
    pool.query.mockRejectedValueOnce(new Error('DB down'));
    const req = { user: { id: userId } };
    const res = mockRes();

    await ctrl.getCart(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });
});

// ── addToCart ─────────────────────────────────────────────────────
describe('addToCart', () => {
  test('adds a new item to cart', async () => {
    pool.query
      .mockResolvedValueOnce([[{ id: 5, stock: 10, is_active: 1 }], []])  // SELECT product
      .mockResolvedValueOnce([[null], []])                                   // SELECT existing (not found)
      .mockResolvedValueOnce([{ affectedRows: 1 }, []]);                    // INSERT

    const req = { user: { id: userId }, body: { product_id: 5, quantity: 2 } };
    const res = mockRes();

    await ctrl.addToCart(req, res, next);

    expect(res.json).toHaveBeenCalledWith({ success: true, message: 'Added to cart.' });
  });

  test('returns 404 when product not found', async () => {
    pool.query.mockResolvedValueOnce([[], []]);

    const req = { user: { id: userId }, body: { product_id: 999 } };
    const res = mockRes();

    await ctrl.addToCart(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('returns 400 when product is inactive', async () => {
    pool.query.mockResolvedValueOnce([[{ id: 5, stock: 10, is_active: 0 }], []]);

    const req = { user: { id: userId }, body: { product_id: 5 } };
    const res = mockRes();

    await ctrl.addToCart(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('unavailable') }));
  });

  test('returns 400 when requested quantity exceeds stock', async () => {
    pool.query
      .mockResolvedValueOnce([[{ id: 5, stock: 3, is_active: 1 }], []])
      .mockResolvedValueOnce([[{ quantity: 2 }], []]); // already 2 in cart

    const req = { user: { id: userId }, body: { product_id: 5, quantity: 5 } };
    const res = mockRes();

    await ctrl.addToCart(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('3 units') }));
  });
});

// ── updateCartItem ────────────────────────────────────────────────
describe('updateCartItem', () => {
  test('updates quantity successfully', async () => {
    pool.query
      .mockResolvedValueOnce([[{ id: 10, stock: 10 }], []])  // SELECT
      .mockResolvedValueOnce([{ affectedRows: 1 }, []]);      // UPDATE

    const req = { user: { id: userId }, params: { id: 10 }, body: { quantity: 3 } };
    const res = mockRes();

    await ctrl.updateCartItem(req, res, next);

    expect(res.json).toHaveBeenCalledWith({ success: true, message: 'Cart updated.' });
  });

  test('returns 404 when cart item not found', async () => {
    pool.query.mockResolvedValueOnce([[], []]);

    const req = { user: { id: userId }, params: { id: 999 }, body: { quantity: 1 } };
    const res = mockRes();

    await ctrl.updateCartItem(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('returns 400 when quantity exceeds stock', async () => {
    pool.query.mockResolvedValueOnce([[{ id: 10, stock: 2 }], []]);

    const req = { user: { id: userId }, params: { id: 10 }, body: { quantity: 10 } };
    const res = mockRes();

    await ctrl.updateCartItem(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
  });
});

// ── removeCartItem ────────────────────────────────────────────────
describe('removeCartItem', () => {
  test('deletes item and returns success', async () => {
    pool.query.mockResolvedValueOnce([{ affectedRows: 1 }, []]);

    const req = { user: { id: userId }, params: { id: 10 } };
    const res = mockRes();

    await ctrl.removeCartItem(req, res, next);

    expect(res.json).toHaveBeenCalledWith({ success: true, message: 'Item removed from cart.' });
  });
});

// ── clearCart ─────────────────────────────────────────────────────
describe('clearCart', () => {
  test('clears all items for user', async () => {
    pool.query.mockResolvedValueOnce([{ affectedRows: 3 }, []]);

    const req = { user: { id: userId } };
    const res = mockRes();

    await ctrl.clearCart(req, res, next);

    expect(res.json).toHaveBeenCalledWith({ success: true, message: 'Cart cleared.' });
    expect(pool.query).toHaveBeenCalledWith(expect.stringContaining('DELETE'), [userId]);
  });
});
