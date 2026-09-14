#!/usr/bin/env node
// backend/scripts/migrate-images-to-firebase.js
// ─────────────────────────────────────────────────────────────────────────────
// Uploads all local /uploads/* product images to Firebase Storage,
// then updates every product row in the DB with the new public URL.
//
// Run ONCE from the backend directory:
//   node scripts/migrate-images-to-firebase.js
// ─────────────────────────────────────────────────────────────────────────────

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const admin  = require('../config/firebase');   // initialises Firebase Admin
const mysql  = require('mysql2/promise');
const fs     = require('fs');
const path   = require('path');

const UPLOADS_DIR = path.join(__dirname, '../uploads');

async function uploadFile(localPath, destName) {
  const bucket = admin.storage().bucket(); // uses storageBucket from initializeApp
  await bucket.upload(localPath, {
    destination: `products/${destName}`,
    metadata: {
      contentType: localPath.match(/\.png$/i) ? 'image/png' : 'image/jpeg',
      cacheControl: 'public, max-age=31536000',
    },
  });

  // Make file publicly readable
  const file = bucket.file(`products/${destName}`);
  await file.makePublic();

  const bucketName = bucket.name;
  return `https://storage.googleapis.com/${bucketName}/products/${destName}`;
}

async function run() {
  // ── Connect to DB ─────────────────────────────────────────────
  const rawUrl = process.env.MYSQL_URL || process.env.DATABASE_URL;
  const conn   = await mysql.createConnection(
    rawUrl
      ? { uri: rawUrl.replace(/\?.*$/, ''), ssl: { rejectUnauthorized: false } }
      : {
          host:     process.env.DB_HOST     || 'localhost',
          port:     parseInt(process.env.DB_PORT || '3306'),
          user:     process.env.DB_USER     || 'root',
          password: process.env.DB_PASSWORD || '',
          database: process.env.DB_NAME     || 'crafty_closet_v2',
        }
  );
  console.log('✅  DB connected\n');

  // ── Get all products ──────────────────────────────────────────
  const [products] = await conn.query('SELECT id, name, image FROM products ORDER BY id');
  console.log(`📦  Found ${products.length} product(s)\n`);

  // ── Get all local image files (sorted by filename = upload order) ──
  const localFiles = fs.readdirSync(UPLOADS_DIR)
    .filter(f => f !== '.gitkeep' && !f.startsWith('.'))
    .sort(); // sort by timestamp prefix so order is consistent

  console.log(`🖼️   Local images found: ${localFiles.length}`);
  localFiles.forEach((f, i) => console.log(`     [${i}] ${f}`));
  console.log('');

  if (localFiles.length === 0) {
    console.error('❌  No images found in uploads/ — nothing to migrate.');
    await conn.end();
    return;
  }

  // ── Upload all images to Firebase Storage ─────────────────────
  const uploadedUrls = [];
  for (const filename of localFiles) {
    const localPath = path.join(UPLOADS_DIR, filename);
    process.stdout.write(`  ↑  Uploading ${filename} ... `);
    try {
      const url = await uploadFile(localPath, filename);
      uploadedUrls.push(url);
      console.log('✅');
    } catch (err) {
      console.log(`❌  ${err.message}`);
      uploadedUrls.push(null);
    }
  }
  console.log('');

  // ── Assign uploaded URLs to products in order ─────────────────
  // If there are fewer images than products, cycle through them.
  let updated = 0;
  for (let i = 0; i < products.length; i++) {
    const product = products[i];
    const url     = uploadedUrls[i % uploadedUrls.length];

    if (!url) {
      console.log(`⚠️   Skipping #${product.id} ${product.name} — no URL available`);
      continue;
    }

    await conn.query('UPDATE products SET image = ? WHERE id = ?', [url, product.id]);
    console.log(`  ✅  #${product.id} ${product.name}`);
    console.log(`       → ${url}`);
    updated++;
  }

  console.log(`\n🎉  Done! Updated ${updated}/${products.length} products with Firebase Storage URLs.\n`);
  await conn.end();
}

run().catch(err => {
  console.error('\n❌  Migration failed:', err.message);
  process.exit(1);
});
