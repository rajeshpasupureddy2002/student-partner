const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');

// Pages
router.get('/', authController.homePage);
router.get('/login', authController.loginPage);
router.get('/register', authController.registerPage);


module.exports = router;
