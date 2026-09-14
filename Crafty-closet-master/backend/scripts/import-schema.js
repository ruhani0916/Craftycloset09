#!/usr/bin/env node
// backend/scripts/import-schema.js
// ─────────────────────────────────────────────────────────────────────────────
// Imports database/schema.sql into your hosted MySQL (Aiven / PlanetScale etc.)
//
// Usage:
//   node backend/scripts/import-schema.js
//
// Requires MYSQL_URL in your environment:
//   $env:MYSQL_URL = "mysql://avnadmin:PASSWORD@HOST:PORT/defaultdb"
//   node backend/scripts/import-schema.js
// ─────────────────────────────────────────────────────────────────────────────

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mysql = require('mysql2/promise');
const fs    = require('fs');
const path  = require('path');

const rawUrl = process.env.MYSQL_URL || process.env.DATABASE_URL;
if (!rawUrl) {
  console.error('❌  MYSQL_URL not set. Add it to backend/.env or pass it as an env var.');
  process.exit(1);
}

const schemaPath = path.join(__dirname, '../../database/schema.sql');
if (!fs.existsSync(schemaPath)) {
  console.error(`❌  Schema file not found at: ${schemaPath}`);
  process.exit(1);
}

async function run() {
  console.log('🔌  Connecting to MySQL...');

  const conn = await mysql.createConnection({
    uri: rawUrl.replace(/\?.*$/, ''),
    ssl: { rejectUnauthorized: false },
    multipleStatements: true,
  });

  console.log('✅  Connected.');
  console.log('📄  Reading schema.sql...');

  let sql = fs.readFileSync(schemaPath, 'utf8');

  // Aiven / hosted DBs already have the DB created — skip CREATE/USE DATABASE
  // statements and run only the table + seed definitions.
  sql = sql
    .replace(/CREATE\s+DATABASE[^;]+;/gi, '')
    .replace(/USE\s+\w+\s*;/gi, '');

  console.log('🚀  Importing schema...\n');

  await conn.query(sql);

  console.log('✅  Schema imported successfully!');
  console.log('    Tables: users, products, cart, wishlist, orders, order_items, ratings');
  console.log('    Sample products have been seeded.\n');

  await conn.end();
}

run().catch(err => {
  console.error('❌  Import failed:', err.message);
  process.exit(1);
});
