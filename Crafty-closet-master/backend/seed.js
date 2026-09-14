// backend/seed.js — Run: npm run seed
require('dotenv').config();
const bcrypt = require('bcryptjs');
const pool   = require('./config/db');

async function seed() {
  console.log('\n🌱  Seeding admin user…');

  const hash = await bcrypt.hash('Admin@123', 12);

  await pool.query(`
    INSERT INTO users (name, email, password, role, is_active, email_verified)
    VALUES ('Admin', 'admin@craftycloset.com', ?, 'admin', 1, 1)
    ON DUPLICATE KEY UPDATE
      password       = VALUES(password),
      role           = 'admin',
      is_active      = 1,
      email_verified = 1
  `, [hash]);

  console.log('✅  Admin user ready!');
  console.log('    Email:    admin@craftycloset.com');
  console.log('    Password: Admin@123\n');
  process.exit(0);
}

seed().catch(err => {
  console.error('❌  Seed failed:', err.message);
  process.exit(1);
});
