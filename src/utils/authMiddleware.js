const jwt = require('jsonwebtoken');
const User = require('../models/user.model');

const authMiddleware = async (req, res, next) => {
    try {
        const token = req.cookies.token;

        if (!token) {
            return res.redirect('/login');
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (!decoded) {
            return res.redirect('/login');
        }

        const user = await User.findById(decoded.id);
        if (!user) {
            return res.redirect('/login');
        }

        req.user = user;
        next();
    } catch (err) {
        console.error('Auth Middleware Error:', err);
        res.redirect('/login'); // If token invalid/expired, redirect to login
    }
};

module.exports = authMiddleware;
