const mysql = require('mysql2');

const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'student_partner'
});

db.connect((err) => {
  if (err) {
    console.error('❌ DB Connection Failed');
    console.error(err.message);   // 👈 IMPORTANT
    return;
  }
  console.log('✅ MySQL Connected Successfully');
});

module.exports = db;
