const express = require('express');
const router = express.Router();

const publicController = require('../controllers/public.controller');

// Public routes
router.get('/', publicController.homePage);
router.get('/login', publicController.loginPage);
router.get('/register', publicController.registerPage);

// Dashboard (you can protect this later)
router.get('/dashboard', publicController.dashboardPage);

module.exports = router;
