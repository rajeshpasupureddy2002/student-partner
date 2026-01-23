const bcrypt = require('bcrypt');
const crypto = require('crypto');
const db = require('../config/db');
const nodemailer = require('nodemailer');

// ================================
// 1️⃣ HOME PAGE
// ================================
exports.homePage = (req, res) => {
    res.render('home', { title: 'Home' });
};
