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
router.post('/login', authController.loginUser);
router.post('/register', authController.registerUser);

/* 🔐 FORGOT PASSWORD (MISSING FIX) */
router.post('/forgot-password', authController.forgotPasswordPost);

module.exports = router;
