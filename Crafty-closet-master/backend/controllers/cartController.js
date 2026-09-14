// backend/controllers/cartController.js
const pool = require('../config/db');

exports.getCart = async (req, res, next) => {
  try {
    const [items] = await pool.query(
      `SELECT c.id, c.quantity,
              p.id AS product_id, p.name, p.price, p.compare_price,
              p.image, p.stock, p.category, p.is_active
       FROM cart c
       JOIN products p ON c.product_id = p.id
       WHERE c.user_id = ?
       ORDER BY c.created_at DESC`,
      [req.user.id]
    );

    const subtotal = items.reduce((s, i) => s + parseFloat(i.price) * i.quantity, 0);
    const count    = items.reduce((s, i) => s + i.quantity, 0);

    res.json({
      success: true,
      items,
      subtotal: parseFloat(subtotal.toFixed(2)),
      count,
    });
  } catch (err) { next(err); }
};

exports.addToCart = async (req, res, next) => {
  try {
    const { product_id, quantity = 1 } = req.body;

    const [[product]] = await pool.query(
      'SELECT id, stock, is_active FROM products WHERE id = ?',
      [product_id]
    );
    if (!product)           return res.status(404).json({ success: false, message: 'Product not found.' });
    if (!product.is_active) return res.status(400).json({ success: false, message: 'Product is currently unavailable.' });

    // Check existing cart qty
    const [[existing]] = await pool.query(
      'SELECT quantity FROM cart WHERE user_id = ? AND product_id = ?',
      [req.user.id, product_id]
    ).catch(() => [[null]]);

    const newQty = (existing?.quantity || 0) + parseInt(quantity);
    if (newQty > product.stock) {
      return res.status(400).json({ success: false, message: `Only ${product.stock} units available.` });
    }

    await pool.query(
      `INSERT INTO cart (user_id, product_id, quantity)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE quantity = quantity + VALUES(quantity)`,
      [req.user.id, product_id, parseInt(quantity)]
    );

    res.json({ success: true, message: 'Added to cart.' });
  } catch (err) { next(err); }
};

exports.updateCartItem = async (req, res, next) => {
  try {
    const { quantity } = req.body;

    const [[item]] = await pool.query(
      `SELECT c.id, p.stock
       FROM cart c JOIN products p ON c.product_id = p.id
       WHERE c.id = ? AND c.user_id = ?`,
      [req.params.id, req.user.id]
    );
    if (!item) return res.status(404).json({ success: false, message: 'Cart item not found.' });
    if (parseInt(quantity) > item.stock) {
      return res.status(400).json({ success: false, message: `Only ${item.stock} units available.` });
    }

    await pool.query(
      'UPDATE cart SET quantity = ? WHERE id = ? AND user_id = ?',
      [parseInt(quantity), req.params.id, req.user.id]
    );
    res.json({ success: true, message: 'Cart updated.' });
  } catch (err) { next(err); }
};

exports.removeCartItem = async (req, res, next) => {
  try {
    await pool.query('DELETE FROM cart WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    res.json({ success: true, message: 'Item removed from cart.' });
  } catch (err) { next(err); }
};

exports.clearCart = async (req, res, next) => {
  try {
    await pool.query('DELETE FROM cart WHERE user_id = ?', [req.user.id]);
    res.json({ success: true, message: 'Cart cleared.' });
  } catch (err) { next(err); }
};
