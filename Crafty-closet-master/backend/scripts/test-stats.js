require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const pool = require('../config/db');

async function testStats() {
  try {
    const [[{ total_products }]] = await pool.query('SELECT COUNT(*) AS total_products FROM products');
    const [[{ total_orders }]]   = await pool.query('SELECT COUNT(*) AS total_orders FROM orders');
    const [[{ total_users }]]    = await pool.query('SELECT COUNT(*) AS total_users FROM users WHERE role = "user"');
    const [[{ revenue }]]        = await pool.query(
      'SELECT COALESCE(SUM(total_price), 0) AS revenue FROM orders WHERE status != "cancelled"'
    );
    const [[{ pending }]]        = await pool.query(
      'SELECT COUNT(*) AS pending FROM orders WHERE status = "pending"'
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

    console.log({
      stats: { total_products, total_orders, total_users, revenue, pending, low_stock },
      recent_orders,
    });
  } catch (err) {
    console.error('Error:', err);
  } finally {
    process.exit(0);
  }
}
testStats();
