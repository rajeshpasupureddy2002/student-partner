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

// ================================
// 2️⃣ LOGIN PAGE
// ================================
exports.loginPage = (req, res) => {
    res.render('auth/login', {
        title: 'Login',
        layout: 'auth'
    });
};

// ================================
// 3️⃣ REGISTER PAGE
// ================================
exports.registerPage = (req, res) => {
    res.render('auth/register', {
        title: 'Register',
        layout: 'auth'
    });
};

// ================================
// 4️⃣ DASHBOARD PAGE
// ================================
exports.dashboardPage = (req, res) => {
    res.render('auth/dashboard', {
        title: 'Dashboard'
    });
};

// ================================
// 5️⃣ HANDLE LOGIN
// ================================
exports.handleLogin = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.render('auth/login', {
            title: 'Login',
            layout: 'auth',
            error: 'All fields are required'
        });
    }

    try {
        const [rows] = await db.query(
            'SELECT * FROM users WHERE email = ?',
            [email]
        );

        const user = rows[0];
        if (!user) {
            return res.render('auth/login', {
                title: 'Login',
                layout: 'auth',
                error: 'User not found'
            });
        }

        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            return res.render('auth/login', {
                title: 'Login',
                layout: 'auth',
                error: 'Incorrect password'
            });
        }

        // TODO: session / JWT
        res.redirect('/dashboard');

    } catch (err) {
        console.error(err);
        res.render('auth/login', {
            title: 'Login',
            layout: 'auth',
            error: 'Something went wrong'
        });
    }
};

// ================================
// 6️⃣ HANDLE REGISTER
// ================================
exports.handleRegister = async (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.render('auth/register', {
            title: 'Register',
            layout: 'auth',
            error: 'All fields are required'
        });
    }

    try {
        const [rows] = await db.query(
            'SELECT * FROM users WHERE email = ?',
            [email]
        );

        if (rows.length > 0) {
            return res.render('auth/register', {
                title: 'Register',
                layout: 'auth',
                error: 'Email already registered'
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await db.query(
            'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
            [name, email, hashedPassword]
        );

        res.redirect('/login');

    } catch (err) {
        console.error(err);
        res.render('auth/register', {
            title: 'Register',
            layout: 'auth',
            error: 'Something went wrong'
        });
    }
};

// ================================
// 7️⃣ FORGOT PASSWORD PAGE
// ================================
exports.forgotPasswordPage = (req, res) => {
    res.render('auth/forgotpassword', {
        title: 'Forgot Password',
        layout: 'auth',
        forgotCSS: true
    });
};

// ================================
// 8️⃣ HANDLE FORGOT PASSWORD
// ================================
exports.handleForgotPassword = async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.render('auth/forgotpassword', {
            title: 'Forgot Password',
            layout: 'auth',
            forgotCSS: true,
            error: 'Email is required'
        });
    }

    try {
        const [rows] = await db.query(
            'SELECT * FROM users WHERE email = ?',
            [email]
        );

        const user = rows[0];
        if (!user) {
            return res.render('auth/forgotpassword', {
                title: 'Forgot Password',
                layout: 'auth',
                forgotCSS: true,
                error: 'User not found'
            });
        }

        const token = crypto.randomBytes(32).toString('hex');
        const expiry = Date.now() + 60 * 60 * 1000; // 1 hour

        await db.query(
            'UPDATE users SET reset_token = ?, reset_expiry = ? WHERE email = ?',
            [token, expiry, email]
        );

        const transporter = nodemailer.createTransport({
            service: 'Gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        const resetLink = `http://localhost:3000/reset-password/${token}`;

        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Password Reset - Student Partner',
            html: `
                <p>You requested a password reset.</p>
                <p>
                    <a href="${resetLink}">
                        Click here to reset your password
                    </a>
                </p>
                <p>This link is valid for 1 hour.</p>
            `
        });

        res.render('auth/forgotpassword', {
            title: 'Forgot Password',
            layout: 'auth',
            forgotCSS: true,
            success: 'Reset link sent to your email'
        });

    } catch (err) {
        console.error(err);
        res.render('auth/forgotpassword', {
            title: 'Forgot Password',
            layout: 'auth',
            forgotCSS: true,
            error: 'Something went wrong'
        });
    }
};

// ================================
// 9️⃣ RESET PASSWORD PAGE
// ================================
exports.resetPasswordPage = async (req, res) => {
    const { token } = req.params;

    try {
        const [rows] = await db.query(
            'SELECT * FROM users WHERE reset_token = ? AND reset_expiry > ?',
            [token, Date.now()]
        );

        if (rows.length === 0) {
            return res.render('auth/login', {
                title: 'Login',
                layout: 'auth',
                error: 'Invalid or expired reset link'
            });
        }

        res.render('auth/resetpassword', {
            title: 'Reset Password',
            layout: 'auth',
            token,
            forgotCSS: true
        });

    } catch (err) {
        console.error(err);
        res.render('auth/login', {
            title: 'Login',
            layout: 'auth',
            error: 'Something went wrong'
        });
    }
};

// ================================
// 🔟 HANDLE RESET PASSWORD
// ================================
exports.handleResetPassword = async (req, res) => {
    const { token } = req.params;
    const { password, confirmPassword } = req.body;

    if (!password || password !== confirmPassword) {
        return res.render('auth/resetpassword', {
            title: 'Reset Password',
            layout: 'auth',
            token,
            forgotCSS: true,
            error: 'Passwords do not match'
        });
    }

    try {
        const [rows] = await db.query(
            'SELECT * FROM users WHERE reset_token = ? AND reset_expiry > ?',
            [token, Date.now()]
        );

        const user = rows[0];
        if (!user) {
            return res.render('auth/login', {
                title: 'Login',
                layout: 'auth',
                error: 'Invalid or expired reset link'
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await db.query(
            'UPDATE users SET password = ?, reset_token = NULL, reset_expiry = NULL WHERE id = ?',
            [hashedPassword, user.id]
        );

        res.redirect('/login');

    } catch (err) {
        console.error(err);
        res.render('auth/resetpassword', {
            title: 'Reset Password',
            layout: 'auth',
            token,
            forgotCSS: true,
            error: 'Something went wrong'
        });
    }
};
