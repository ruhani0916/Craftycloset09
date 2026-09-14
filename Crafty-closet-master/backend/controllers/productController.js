// backend/controllers/productController.js
const pool    = require('../config/db');
const slugify = require('slugify');

const makeSlug = (name) => slugify(name, { lower: true, strict: true });

// ── GET /api/products ──────────────────────────────────────────
exports.getProducts = async (req, res, next) => {
  try {
    const {
      search     = '',
      category   = '',
      minPrice   = '',
      maxPrice   = '',
      sort       = 'newest',
      page       = '1',
      limit      = '12',
      active_only = 'true',
    } = req.query;

    const conditions = ['1=1'];
    const params     = [];

    // Active filter — admin passes active_only=false to see all
    if (active_only !== 'false') {
      conditions.push('is_active = 1');
    }

    // Search — plain LIKE, works on every MySQL setup
    if (search && search.trim()) {
      conditions.push('(name LIKE ? OR description LIKE ?)');
      const term = `%${search.trim()}%`;
      params.push(term, term);
    }

    if (category && category.trim()) {
      conditions.push('category = ?');
      params.push(category.trim());
    }

    if (minPrice !== '' && !isNaN(parseFloat(minPrice))) {
      conditions.push('price >= ?');
      params.push(parseFloat(minPrice));
    }

    if (maxPrice !== '' && !isNaN(parseFloat(maxPrice))) {
      conditions.push('price <= ?');
      params.push(parseFloat(maxPrice));
    }

    const WHERE = conditions.join(' AND ');

    const sortMap = {
      newest:      'created_at DESC',
      price_asc:   'price ASC',
      price_desc:  'price DESC',
      rating_desc: 'rating DESC',
      popular:     'rating_count DESC',
    };
    const ORDER = sortMap[sort] || 'created_at DESC';

    // Count total matching rows (separate query without LIMIT)
    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total FROM products WHERE ${WHERE}`,
      [...params]                          // spread to avoid mutating params
    );

    // Paginate
    const pageNum  = Math.max(1, parseInt(page)  || 1);
    const limitNum = Math.min(200, Math.max(1, parseInt(limit) || 12));
    const offset   = (pageNum - 1) * limitNum;

    const [products] = await pool.query(
      `SELECT * FROM products WHERE ${WHERE} ORDER BY ${ORDER} LIMIT ? OFFSET ?`,
      [...params, limitNum, offset]
    );

    res.json({
      success: true,
      products,
      pagination: {
        total,
        page:  pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum) || 1,
      },
    });
  } catch (err) { next(err); }
};

// ── GET /api/products/categories ──────────────────────────────
exports.getCategories = async (_req, res, next) => {
  try {
    const [rows] = await pool.query(
      'SELECT category, COUNT(*) AS count FROM products WHERE is_active = 1 GROUP BY category ORDER BY category'
    );
    res.json({ success: true, categories: rows });
  } catch (err) { next(err); }
};

// ── GET /api/products/:id ──────────────────────────────────────
exports.getProduct = async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT * FROM products WHERE id = ?', [req.params.id]);
    if (!rows.length) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    const [ratings] = await pool.query(
      `SELECT r.stars, r.review, r.created_at, u.name AS reviewer
       FROM ratings r
       JOIN users u ON r.user_id = u.id
       WHERE r.product_id = ?
       ORDER BY r.created_at DESC
       LIMIT 20`,
      [req.params.id]
    );

    res.json({ success: true, product: rows[0], ratings });
  } catch (err) { next(err); }
};

// ── POST /api/products [admin] ─────────────────────────────────
exports.createProduct = async (req, res, next) => {
  try {
    const { name, description, price, compare_price, category, stock } = req.body;
    const image = req.uploadedImageUrl || '/uploads/placeholder.jpg';

    let slug = makeSlug(name);
    const [existing] = await pool.query('SELECT id FROM products WHERE slug = ?', [slug]);
    if (existing.length) slug = `${slug}-${Date.now()}`;

    const [result] = await pool.query(
      `INSERT INTO products (name, slug, description, price, compare_price, category, image, stock)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        slug,
        description || null,
        parseFloat(price),
        (compare_price && !isNaN(parseFloat(compare_price))) ? parseFloat(compare_price) : null,
        category,
        image,
        parseInt(stock),
      ]
    );

    res.status(201).json({ success: true, message: 'Product created successfully.', productId: result.insertId });
  } catch (err) { next(err); }
};

// ── PUT /api/products/:id [admin] ──────────────────────────────
exports.updateProduct = async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT id FROM products WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'Product not found.' });

    const fields = [];
    const values = [];

    // Only update fields that were actually sent
    const allowed = ['name','description','price','compare_price','category','stock','is_active'];
    allowed.forEach(f => {
      if (req.body[f] !== undefined && req.body[f] !== '') {
        fields.push(`${f} = ?`);
        values.push(req.body[f]);
      }
    });

    if (req.uploadedImageUrl) {
      fields.push('image = ?');
      values.push(req.uploadedImageUrl);
    }

    if (req.body.name) {
      let slug = makeSlug(req.body.name);
      const [ex] = await pool.query('SELECT id FROM products WHERE slug = ? AND id != ?', [slug, req.params.id]);
      if (ex.length) slug = `${slug}-${Date.now()}`;
      fields.push('slug = ?');
      values.push(slug);
    }

    if (!fields.length) {
      return res.status(400).json({ success: false, message: 'No fields provided to update.' });
    }

    values.push(req.params.id);
    await pool.query(`UPDATE products SET ${fields.join(', ')} WHERE id = ?`, values);

    res.json({ success: true, message: 'Product updated successfully.' });
  } catch (err) { next(err); }
};

// ── DELETE /api/products/:id [admin] ──────────────────────────
exports.deleteProduct = async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT id FROM products WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'Product not found.' });

    await pool.query('DELETE FROM products WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Product deleted successfully.' });
  } catch (err) { next(err); }
};

// ── POST /api/products/:id/rate [auth] ─────────────────────────
exports.rateProduct = async (req, res, next) => {
  try {
    const { stars, review } = req.body;

    await pool.query(
      `INSERT INTO ratings (user_id, product_id, stars, review)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE stars = VALUES(stars), review = VALUES(review)`,
      [req.user.id, req.params.id, parseInt(stars), review || null]
    );

    // Recalculate average
    const [[agg]] = await pool.query(
      'SELECT ROUND(AVG(stars), 2) AS avg_r, COUNT(*) AS cnt FROM ratings WHERE product_id = ?',
      [req.params.id]
    );
    await pool.query(
      'UPDATE products SET rating = ?, rating_count = ? WHERE id = ?',
      [agg.avg_r || 0, agg.cnt || 0, req.params.id]
    );

    res.json({ success: true, message: 'Rating submitted successfully.' });
  } catch (err) { next(err); }
};
