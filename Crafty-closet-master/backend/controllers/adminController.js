// backend/controllers/adminController.js
const pool = require('../config/db');

// ── GET /api/admin/stats ───────────────────────────────────────
exports.getStats = async (_req, res, next) => {
  try {
    const [[{ total_products }]] = await pool.query('SELECT COUNT(*) AS total_products FROM products');
    const [[{ total_orders }]]   = await pool.query('SELECT COUNT(*) AS total_orders FROM orders');
    const [[{ total_users }]]    = await pool.query(`SELECT COUNT(*) AS total_users FROM users WHERE role = 'user'`);
    const [[{ revenue }]]        = await pool.query(
      `SELECT COALESCE(SUM(total_price), 0) AS revenue FROM orders WHERE status != 'cancelled'`
    );
    const [[{ pending }]]        = await pool.query(
      `SELECT COUNT(*) AS pending FROM orders WHERE status = 'pending'`
    );
    const [[{ low_stock }]]      = await pool.query(
      'SELECT COUNT(*) AS low_stock FROM products WHERE stock <= 5 AND is_active = 1'
    );
    const [recent_orders] = await pool.query(
      `SELECT o.id, o.order_number, o.total_price, o.status, o.created_at,
              u.name AS user_name
       FROM orders o
       JOIN users u ON o.user_id = u.id
       ORDER BY o.created_at DESC
       LIMIT 5`
    );

    res.json({
      success: true,
      stats: { total_products, total_orders, total_users, revenue, pending, low_stock },
      recent_orders,
    });
  } catch (err) { next(err); }
};

// ── GET /api/admin/users ───────────────────────────────────────
exports.getUsers = async (req, res, next) => {
  try {
    const { page = '1', limit = '20', search = '' } = req.query;

    const conditions = ['1=1'];
    const params     = [];

    if (search.trim()) {
      conditions.push('(name LIKE ? OR email LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }

    const WHERE    = conditions.join(' AND ');
    const pageNum  = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, parseInt(limit) || 20);

    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total FROM users WHERE ${WHERE}`,
      [...params]
    );

    const [users] = await pool.query(
      `SELECT id, name, email, role, is_active, avatar, email_verified, created_at
       FROM users
       WHERE ${WHERE}
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limitNum, (pageNum - 1) * limitNum]
    );

    res.json({ success: true, users, total });
  } catch (err) { next(err); }
};

// ── PATCH /api/admin/users/:id/toggle ─────────────────────────
exports.toggleUserStatus = async (req, res, next) => {
  try {
    const [[user]] = await pool.query('SELECT id, role FROM users WHERE id = ?', [req.params.id]);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    if (user.role === 'admin') {
      return res.status(403).json({ success: false, message: 'Cannot deactivate admin accounts.' });
    }

    await pool.query('UPDATE users SET is_active = NOT is_active WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'User status updated.' });
  } catch (err) { next(err); }
};

// ── PATCH /api/admin/users/:id/role ───────────────────────────
exports.updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role.' });
    }
    await pool.query('UPDATE users SET role = ? WHERE id = ?', [role, req.params.id]);
    res.json({ success: true, message: 'User role updated.' });
  } catch (err) { next(err); }
};
