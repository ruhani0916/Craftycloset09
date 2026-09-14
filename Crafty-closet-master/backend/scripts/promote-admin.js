require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mysql = require('mysql2/promise');

async function run() {
  const rawUrl = process.env.MYSQL_URL || process.env.DATABASE_URL;
  if (!rawUrl) {
    console.error('MYSQL_URL is not defined in .env');
    process.exit(1);
  }
  
  const conn = await mysql.createConnection({
    uri: rawUrl.replace(/\?.*$/, ''),
    ssl: { rejectUnauthorized: false }
  });
  
  const [rows] = await conn.query('SELECT id, name, email, role FROM users');
  console.log('Current users:', rows);
  
  if (rows.length > 0) {
    console.log('\nPromoting all users to admin for now...');
    await conn.query("UPDATE users SET role = 'admin'");
    const [updatedRows] = await conn.query('SELECT id, name, email, role FROM users');
    console.log('Updated users:', updatedRows);
  } else {
    console.log('No users found in the database. Please sign up on the live site first!');
  }
  
  await conn.end();
}

run();
