// backend/controllers/orderController.js
const pool = require('../config/db');
const { sendOrderConfirmation, sendOrderStatusUpdate } = require('../config/mailer');

const genOrderNumber = () =>
  `CC-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

// ── POST /api/orders — checkout ────────────────────────────────
exports.placeOrder = async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const {
      shipping_name, shipping_email, shipping_phone,
      shipping_address, payment_method = 'cod', notes,
    } = req.body;

    // Get cart items
    const [cartItems] = await conn.query(
      `SELECT c.product_id, c.quantity, p.price, p.stock, p.name, p.image, p.is_active
       FROM cart c JOIN products p ON c.product_id = p.id
       WHERE c.user_id = ?`,
      [req.user.id]
    );

    if (!cartItems.length) {
      await conn.rollback();
      return res.status(400).json({ success: false, message: 'Your cart is empty.' });
    }

    // Validate stock
    for (const item of cartItems) {
      if (!item.is_active) {
        await conn.rollback();
        return res.status(400).json({ success: false, message: `"${item.name}" is no longer available.` });
      }
      if (item.quantity > item.stock) {
        await conn.rollback();
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for "${item.name}". Only ${item.stock} left.`,
        });
      }
    }

    const totalPrice  = cartItems.reduce((s, i) => s + parseFloat(i.price) * i.quantity, 0);
    const orderNumber = genOrderNumber();

    const [orderResult] = await conn.query(
      `INSERT INTO orders
         (order_number, user_id, total_price, payment_method,
          shipping_name, shipping_email, shipping_phone, shipping_address, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        orderNumber, req.user.id, totalPrice.toFixed(2), payment_method,
        shipping_name, shipping_email || null, shipping_phone, shipping_address, notes || null,
      ]
    );

    const orderId = orderResult.insertId;

    for (const item of cartItems) {
      await conn.query(
        'INSERT INTO order_items (order_id, product_id, name, price, quantity, image) VALUES (?, ?, ?, ?, ?, ?)',
        [orderId, item.product_id, item.name, item.price, item.quantity, item.image]
      );
      await conn.query(
        'UPDATE products SET stock = stock - ? WHERE id = ?',
        [item.quantity, item.product_id]
      );
    }

    await conn.query('DELETE FROM cart WHERE user_id = ?', [req.user.id]);
    await conn.commit();

    // Send order confirmation email
    const order = {
      order_number:    orderNumber,
      total_price:     totalPrice,
      payment_method,
      shipping_name,
      shipping_address,
    };
    const emailTo = shipping_email || req.user.email;
    const nameTo = shipping_name || req.user.name;
    sendOrderConfirmation(emailTo, nameTo, order, cartItems).catch((err) => {
      console.error('Order confirmation email failed:', err);
    });

    res.status(201).json({
      success: true,
      message: 'Order placed successfully!',
      order:   { id: orderId, order_number: orderNumber, total: parseFloat(totalPrice.toFixed(2)) },
    });
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
};

// ── GET /api/orders/my ─────────────────────────────────────────
exports.getMyOrders = async (req, res, next) => {
  try {
    const [orders] = await pool.query(
      'SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC',
      [req.user.id]
    );

    for (const order of orders) {
      const [items] = await pool.query(
        `SELECT oi.*, p.image AS current_image
         FROM order_items oi
         LEFT JOIN products p ON oi.product_id = p.id
         WHERE oi.order_id = ?`,
        [order.id]
      );
      order.items = items;
    }

    res.json({ success: true, orders });
  } catch (err) { next(err); }
};

// ── GET /api/orders/my/:id ─────────────────────────────────────
exports.getMyOrder = async (req, res, next) => {
  try {
    const [[order]] = await pool.query(
      'SELECT * FROM orders WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });

    const [items] = await pool.query(
      'SELECT * FROM order_items WHERE order_id = ?',
      [order.id]
    );
    res.json({ success: true, order: { ...order, items } });
  } catch (err) { next(err); }
};

// ── GET /api/orders [admin] ────────────────────────────────────
exports.getAllOrders = async (req, res, next) => {
  try {
    const { status = '', page = '1', limit = '25', search = '' } = req.query;

    const conditions = ['1=1'];
    const params     = [];

    if (status) { conditions.push('o.status = ?'); params.push(status); }
    if (search) {
      conditions.push('(u.name LIKE ? OR o.order_number LIKE ? OR u.email LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    const WHERE    = conditions.join(' AND ');
    const pageNum  = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 25));

    const [orders] = await pool.query(
      `SELECT o.*, u.name AS user_name, u.email AS user_email
       FROM orders o
       JOIN users u ON o.user_id = u.id
       WHERE ${WHERE}
       ORDER BY o.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limitNum, (pageNum - 1) * limitNum]
    );

    res.json({ success: true, orders });
  } catch (err) { next(err); }
};

// ── PUT /api/orders/:id/status [admin] ────────────────────────
exports.updateOrderStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    const [[order]] = await pool.query(
      'SELECT o.*, u.email AS user_email, u.name AS user_name FROM orders o JOIN users u ON o.user_id = u.id WHERE o.id = ?',
      [req.params.id]
    );
    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });

    await pool.query('UPDATE orders SET status = ? WHERE id = ?', [status, req.params.id]);

    // Send status update email
    const updated = { ...order, status };
    const emailTo = order.shipping_email || order.user_email;
    const nameTo = order.shipping_name || order.user_name;
    sendOrderStatusUpdate(emailTo, nameTo, updated).catch((err) => {
      console.error('Order status email failed:', err);
    });

    res.json({ success: true, message: 'Order status updated.' });
  } catch (err) { next(err); }
};
