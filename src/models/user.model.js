const db = require('../config/db');
const util = require('util');

// Promisify db.query for async/await
const query = util.promisify(db.query).bind(db);

const User = {

  /* ============================
     CREATE NEW USER
     (UI has only 3 fields)
  =========================== */
  createUser: async (name, email, password) => {
    const sql = `
      INSERT INTO users (name, email, password, role)
      VALUES (?, ?, ?, 'student')
    `;
    const result = await query(sql, [name, email, password]);
    return result;
  },

  /* ============================
     FIND USER BY EMAIL
  =========================== */
  findByEmail: async (email) => {
    const sql = `
      SELECT *
      FROM users
      WHERE email = ?
      LIMIT 1
    `;
    const rows = await query(sql, [email]);
    return rows.length ? rows[0] : null;
  },

  /* ============================
     UPDATE USER PROFILE
  ============================ */
  updateProfile: async (id, data) => {
    const sql = `
      UPDATE users
      SET name = ?, phone = ?, bio = ?, college = ?, major = ?, linkedin = ?, github = ?, notifications_email = ?, notifications_push = ?
      WHERE id = ?
    `;
    const params = [
      data.name,
      data.phone,
      data.bio,
      data.college,
      data.major,
      data.linkedin,
      data.github,
      data.notifications_email ? 1 : 0,
      data.notifications_push ? 1 : 0,
      id
    ];
    await query(sql, params);
    return true;
  },

  /* ============================
     FIND USER BY ID (EXTENDED)
  ============================ */
  findById: async (id) => {
    const sql = `
      SELECT *
      FROM users
      WHERE id = ?
      LIMIT 1
    `;
    const rows = await query(sql, [id]);
    return rows.length ? rows[0] : null;
  },

  /* ============================
     SAVE RESET TOKEN
  =========================== */
  saveResetToken: async (userId, token, expires) => {
    const sql = `
      UPDATE users
      SET reset_token = ?, reset_expires = ?
      WHERE id = ?
    `;
    await query(sql, [token, expires, userId]);
    return true;
  },

  /* ============================
     FIND USER BY RESET TOKEN
  =========================== */
  findByResetToken: async (token) => {
    const sql = `
      SELECT *
      FROM users
      WHERE reset_token = ?
      LIMIT 1
    `;
    const rows = await query(sql, [token]);
    return rows.length ? rows[0] : null;
  },

  /* ============================
     UPDATE PASSWORD
  =========================== */
  updatePassword: async (userId, hashedPassword) => {
    const sql = `
      UPDATE users
      SET password = ?, reset_token = NULL, reset_expires = NULL
      WHERE id = ?
    `;
    await query(sql, [hashedPassword, userId]);
    return true;
  }

};

module.exports = User;
