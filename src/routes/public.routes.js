const express = require('express');
const router = express.Router();

const publicController = require('../controllers/public.controller');

// Public routes
router.get('/', publicController.homePage);

// Dashboard (you can protect this later)
// Dashboard route removed (moved to dashboard.routes.js)

module.exports = router;
