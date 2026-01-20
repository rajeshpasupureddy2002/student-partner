const express = require('express');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

const router = express.Router();

const db = require('../config/db');
const { sendPasswordResetEmail } = require('../utils/sendEmail');

/* =====================
   FORGOT PASSWORD
===================== */
router.post('/forgot-password', (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }

  db.query(
    'SELECT id, name, email FROM users WHERE email = ?',
    [email],
    (err, users) => {
      if (err) return res.status(500).json({ message: 'DB error' });

      if (users.length === 0) {
        return res.status(200).json({
          message: 'If email exists, password reset link has been sent'
        });
      }

      const user = users[0];

      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

      db.query(
        'INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES (?, ?, ?)',
        [user.id, token, expiresAt],
        async (err) => {
          if (err) return res.status(500).json({ message: 'DB error saving token' });

          console.log('📧 Sending reset email to:', user.email);

          await sendPasswordResetEmail(user.email, token, user.name);

          res.status(200).json({
            message: 'Password reset email sent successfully'
          });
        }
      );
    }
  );
});

module.exports = router; // ✅ REQUIRED
