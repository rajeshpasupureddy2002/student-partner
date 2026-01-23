const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');

/* =====================
   PAGE ROUTES
===================== */
router.get('/login', authController.loginPage);
router.get('/register', authController.registerPage);
router.get('/forgot-password', authController.forgotPasswordPage);
router.get('/reset-password/:token', authController.resetPasswordPage);

/* =====================
   ACTION ROUTES
===================== */
router.get('/logout', authController.logout); // ✅ Logout Route
router.post('/login', authController.loginUser);
router.post('/register', authController.registerUser);

/* 🔐 FORGOT PASSWORD & RESET */
router.post('/forgot-password', authController.forgotPasswordPost);
router.post('/reset-password/:token', authController.resetPasswordPost);

module.exports = router;
