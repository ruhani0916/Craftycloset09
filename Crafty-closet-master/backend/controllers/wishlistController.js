// backend/controllers/wishlistController.js
const pool = require('../config/db');

exports.getWishlist = async (req, res, next) => {
  try {
    const [items] = await pool.query(
      `SELECT w.id, w.added_at,
              p.id AS product_id, p.name, p.price, p.compare_price,
              p.image, p.category, p.stock, p.rating, p.is_active
       FROM wishlist w
       JOIN products p ON w.product_id = p.id
       WHERE w.user_id = ?
       ORDER BY w.added_at DESC`,
      [req.user.id]
    );
    res.json({ success: true, items });
  } catch (err) { next(err); }
};

exports.addToWishlist = async (req, res, next) => {
  try {
    const { product_id } = req.body;
    const [[p]] = await pool.query('SELECT id FROM products WHERE id = ?', [product_id]);
    if (!p) return res.status(404).json({ success: false, message: 'Product not found.' });

    await pool.query(
      'INSERT IGNORE INTO wishlist (user_id, product_id) VALUES (?, ?)',
      [req.user.id, product_id]
    );
    res.json({ success: true, message: 'Added to wishlist.' });
  } catch (err) { next(err); }
};

exports.removeFromWishlist = async (req, res, next) => {
  try {
    await pool.query(
      'DELETE FROM wishlist WHERE product_id = ? AND user_id = ?',
      [req.params.productId, req.user.id]
    );
    res.json({ success: true, message: 'Removed from wishlist.' });
  } catch (err) { next(err); }
};
