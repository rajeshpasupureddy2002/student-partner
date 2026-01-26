const db = require('../config/db');
const util = require('util');

// Promisify db.query for async/await
const query = util.promisify(db.query).bind(db);

const User = {

  /* ============================
     GENERATE CUSTOM REG ID
  ============================ */
  generateRegistrationId: async (role) => {
    const year = new Date().getFullYear();
    const roleMap = {
      'student': 'ST',
      'teacher': 'TR',
      'parent': 'PR',
      'admin': 'AD'
    };
    const prefix = roleMap[role] || 'US';

    // Find the latest ID for this role and year
    const sql = `
      SELECT registration_id 
      FROM users 
      WHERE registration_id LIKE ? 
      ORDER BY registration_id DESC 
      LIMIT 1
    `;
    const searchPattern = `${year}${prefix}%`;
    const rows = await query(sql, [searchPattern]);

    let nextNum = 1;
    if (rows.length > 0 && rows[0].registration_id) {
      // Extract the numeric part (last 4 digits)
      const currentId = rows[0].registration_id;
      const currentNum = parseInt(currentId.slice(-4));
      nextNum = currentNum + 1;
    }

    return `${year}${prefix}${nextNum.toString().padStart(4, '0')}`;
  },

  /* ============================
     CREATE NEW USER
     (UI has only 3 fields)
  =========================== */
  createUser: async (name, email, password, role, isApproved = true, childLinkId = null) => {
    const regId = await User.generateRegistrationId(role || 'student');
    const sql = `
      INSERT INTO users (registration_id, name, email, password, role, is_approved, child_link_id)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    const result = await query(sql, [regId, name, email, password, role || 'student', isApproved, childLinkId]);
    return { ...result, registration_id: regId };
  },

  /* ============================
     FIND USER BY EMAIL OR REG ID (for login)
  =========================== */
  findByLoginId: async (identifier) => {
    const sql = `
      SELECT *
      FROM users
      WHERE email = ? OR registration_id = ?
      LIMIT 1
    `;
    const rows = await query(sql, [identifier, identifier]);
    return rows.length ? rows[0] : null;
  },

  /* ============================
     FIND USER BY EMAIL ONLY (for registration/password reset)
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
    const updates = [];
    const values = [];

    if (data.name) { updates.push('name = ?'); values.push(data.name); }
    if (data.phone) { updates.push('phone = ?'); values.push(data.phone); }
    if (data.bio) { updates.push('bio = ?'); values.push(data.bio); }
    if (data.college) { updates.push('college = ?'); values.push(data.college); }
    if (data.major) { updates.push('major = ?'); values.push(data.major); }
    if (data.linkedin) { updates.push('linkedin = ?'); values.push(data.linkedin); }
    if (data.github) { updates.push('github = ?'); values.push(data.github); }
    if (data.profile_image) { updates.push('profile_image = ?'); values.push(data.profile_image); }

    // Notifications (checkboxes)
    if (data.notifications_email !== undefined) {
      updates.push('notifications_email = ?');
      values.push(data.notifications_email === 'on' ? 1 : 0);
    }
    if (data.notifications_push !== undefined) {
      updates.push('notifications_push = ?');
      values.push(data.notifications_push === 'on' ? 1 : 0);
    }
    if (data.notifications_sms !== undefined) {
      updates.push('notifications_sms = ?');
      values.push(data.notifications_sms === 'on' ? 1 : 0);
    }

    if (updates.length === 0) return true;

    values.push(id);
    await query(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, values);
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
  },

  /* ============================
     FIND USERS BY ROLE
  ============================ */
  findByRole: async (role) => {
    let sql = 'SELECT * FROM users';
    let params = [];
    if (role && role !== 'all') {
      sql += ' WHERE role = ?';
      params.push(role);
    }
    return await query(sql, params);
  }

};

module.exports = User;
