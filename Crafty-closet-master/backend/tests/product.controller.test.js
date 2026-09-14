// backend/tests/product.controller.test.js
'use strict';

const pool = require('../config/db');
const ctrl = require('../controllers/productController');

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json   = jest.fn().mockReturnValue(res);
  return res;
};
const next = jest.fn();

const PRODUCT = {
  id: 1, name: 'Gold Ring', slug: 'gold-ring', description: 'Nice ring',
  price: '499.00', compare_price: '699.00', category: 'rings',
  image: '/uploads/ring.jpg', stock: 50, is_active: 1,
  rating: 4.5, rating_count: 12,
};

beforeEach(() => jest.clearAllMocks());

// ── getProducts ───────────────────────────────────────────────────
describe('getProducts', () => {
  test('returns paginated products list', async () => {
    pool.query
      .mockResolvedValueOnce([[{ total: 1 }], []])     // COUNT query
      .mockResolvedValueOnce([[PRODUCT], []]);           // SELECT query

    const req = { query: {} };
    const res = mockRes();

    await ctrl.getProducts(req, res, next);

    const body = res.json.mock.calls[0][0];
    expect(body.success).toBe(true);
    expect(body.products).toHaveLength(1);
    expect(body.pagination).toMatchObject({ total: 1, page: 1 });
  });

  test('applies search, category, price filters', async () => {
    pool.query
      .mockResolvedValueOnce([[{ total: 0 }], []])
      .mockResolvedValueOnce([[], []]);

    const req = { query: { search: 'ring', category: 'rings', minPrice: '100', maxPrice: '500' } };
    const res = mockRes();

    await ctrl.getProducts(req, res, next);

    // Verify LIKE terms were included in params
    const firstCall = pool.query.mock.calls[0];
    expect(firstCall[1]).toEqual(expect.arrayContaining(['%ring%']));
    expect(firstCall[1]).toEqual(expect.arrayContaining(['rings']));
  });

  test('returns empty products when none match', async () => {
    pool.query
      .mockResolvedValueOnce([[{ total: 0 }], []])
      .mockResolvedValueOnce([[], []]);

    const req = { query: { search: 'nonexistent' } };
    const res = mockRes();

    await ctrl.getProducts(req, res, next);

    const body = res.json.mock.calls[0][0];
    expect(body.products).toHaveLength(0);
    expect(body.pagination.total).toBe(0);
  });

  test('calls next(err) on DB failure', async () => {
    pool.query.mockRejectedValueOnce(new Error('DB error'));
    await ctrl.getProducts({ query: {} }, mockRes(), next);
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });
});

// ── getCategories ─────────────────────────────────────────────────
describe('getCategories', () => {
  test('returns category list with counts', async () => {
    pool.query.mockResolvedValueOnce([[
      { category: 'rings', count: 5 },
      { category: 'necklaces', count: 3 },
    ], []]);

    const res = mockRes();
    await ctrl.getCategories({}, res, next);

    expect(res.json).toHaveBeenCalledWith({
      success:    true,
      categories: [{ category: 'rings', count: 5 }, { category: 'necklaces', count: 3 }],
    });
  });
});

// ── getProduct ────────────────────────────────────────────────────
describe('getProduct', () => {
  test('returns product with ratings', async () => {
    pool.query
      .mockResolvedValueOnce([[PRODUCT], []])
      .mockResolvedValueOnce([[{ stars: 5, review: 'Great!', reviewer: 'Bob' }], []]);

    const req = { params: { id: 1 } };
    const res = mockRes();
    await ctrl.getProduct(req, res, next);

    const body = res.json.mock.calls[0][0];
    expect(body.product).toMatchObject({ id: 1, name: 'Gold Ring' });
    expect(body.ratings).toHaveLength(1);
  });

  test('returns 404 for unknown product', async () => {
    pool.query.mockResolvedValueOnce([[], []]);

    const req = { params: { id: 9999 } };
    const res = mockRes();
    await ctrl.getProduct(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
  });
});

// ── createProduct ─────────────────────────────────────────────────
describe('createProduct', () => {
  test('creates product and returns 201 with productId', async () => {
    pool.query
      .mockResolvedValueOnce([[], []])                            // slug uniqueness check
      .mockResolvedValueOnce([{ insertId: 42, affectedRows: 1 }, []]); // INSERT

    const req = {
      body: { name: 'Silver Bangle', description: 'Nice', price: '199', compare_price: '', category: 'bangles', stock: '20' },
      file: null,
    };
    const res = mockRes();
    await ctrl.createProduct(req, res, next);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, productId: 42 }));
  });

  test('appends timestamp when slug already exists', async () => {
    pool.query
      .mockResolvedValueOnce([[{ id: 1 }], []])  // slug clash
      .mockResolvedValueOnce([{ insertId: 43, affectedRows: 1 }, []]);

    const req = {
      body: { name: 'Gold Ring', price: '499', category: 'rings', stock: '10' },
      file: null,
    };
    const res = mockRes();
    await ctrl.createProduct(req, res, next);

    const insertCall = pool.query.mock.calls[1];
    const slugArg    = insertCall[1][1]; // second param is slug
    expect(slugArg).toMatch(/^gold-ring-\d+$/);
  });
});

// ── deleteProduct ─────────────────────────────────────────────────
describe('deleteProduct', () => {
  test('deletes product successfully', async () => {
    pool.query
      .mockResolvedValueOnce([[{ id: 1 }], []])
      .mockResolvedValueOnce([{ affectedRows: 1 }, []]);

    const req = { params: { id: 1 } };
    const res = mockRes();
    await ctrl.deleteProduct(req, res, next);

    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  test('returns 404 when product not found', async () => {
    pool.query.mockResolvedValueOnce([[], []]);

    const req = { params: { id: 999 } };
    const res = mockRes();
    await ctrl.deleteProduct(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
  });
});

// ── rateProduct ───────────────────────────────────────────────────
describe('rateProduct', () => {
  test('submits rating and recalculates average', async () => {
    pool.query
      .mockResolvedValueOnce([{ affectedRows: 1 }, []])              // UPSERT rating
      .mockResolvedValueOnce([[{ avg_r: 4.5, cnt: 10 }], []])        // SELECT AVG
      .mockResolvedValueOnce([{ affectedRows: 1 }, []]);             // UPDATE product

    const req = { user: { id: 1 }, params: { id: 1 }, body: { stars: 5, review: 'Love it!' } };
    const res = mockRes();
    await ctrl.rateProduct(req, res, next);

    expect(res.json).toHaveBeenCalledWith({ success: true, message: 'Rating submitted successfully.' });
    expect(pool.query).toHaveBeenCalledTimes(3);
  });
});
