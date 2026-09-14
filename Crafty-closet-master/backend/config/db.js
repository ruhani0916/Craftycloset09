// backend/config/db.js
const mysql = require('mysql2/promise');

let pool;

if (process.env.MYSQL_URL || process.env.DATABASE_URL) {
  // ── Hosted DB (Aiven / PlanetScale / Render) ──────────────────
  // Aiven requires SSL; the URL contains ?ssl-mode=REQUIRED which
  // mysql2 doesn't parse — so we pull the host from the URL and
  // force ssl: true separately.
  const rawUrl = process.env.MYSQL_URL || process.env.DATABASE_URL;

  pool = mysql.createPool({
    uri:                rawUrl.replace(/\?.*$/, ''),   // strip query params
    ssl:                { rejectUnauthorized: false },  // Aiven self-signed OK
    waitForConnections: true,
    connectionLimit:    10,
    queueLimit:         0,
    charset:            'utf8mb4',
    timezone:           '+00:00',
  });
} else {
  // ── Local development ─────────────────────────────────────────
  pool = mysql.createPool({
    host:               process.env.DB_HOST     || 'localhost',
    port:               parseInt(process.env.DB_PORT || '3306'),
    user:               process.env.DB_USER     || 'root',
    password:           process.env.DB_PASSWORD || '',
    database:           process.env.DB_NAME     || 'crafty_closet_v2',
    waitForConnections: true,
    connectionLimit:    10,
    queueLimit:         0,
    charset:            'utf8mb4',
    timezone:           '+00:00',
  });
}

// Test connection on startup
pool.getConnection()
  .then(conn => {
    console.log(`✅  MySQL connected`);
    conn.release();
  })
  .catch(err => {
    console.error('❌  MySQL connection failed:', err.message);
    console.error('    Check MYSQL_URL or DB_HOST / DB_USER / DB_PASSWORD / DB_NAME');
    process.exit(1);
  });

module.exports = pool;
