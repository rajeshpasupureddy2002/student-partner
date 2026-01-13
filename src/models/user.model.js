const db = require('../config/db');

exports.createUser = (user, callback) => {
  const sql = `
    INSERT INTO users (name, email, password, role)
    VALUES (?, ?, ?, ?)
  `;
  db.query(sql, user, callback);
};

exports.findByEmail = (email, callback) => {
  db.query(
    'SELECT * FROM users WHERE email = ?',
    [email],
    callback
  );
};
