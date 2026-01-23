const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/user.model');
const { hashPassword, comparePassword } = require('../utils/hash');
const { sendWelcomeEmail, sendWelcomeBackEmail, sendPasswordResetEmail } = require('../utils/sendEmail');

/* ============================
   AUTH PAGES
============================ */
exports.loginPage = (req, res) => {
  res.render('auth/login', { layout: 'auth', title: 'Login' });
};

exports.registerPage = (req, res) => {
  res.render('auth/register', { layout: 'auth', title: 'Register' });
};

exports.forgotPasswordPage = (req, res) => {
  res.render('auth/forgotpassword', { layout: 'auth', title: 'Forgot Password', forgotCSS: true });
};

exports.resetPasswordPage = async (req, res) => {
  const { token } = req.params;
  const user = await User.findByResetToken(token);

  if (!user || user.reset_expires < Date.now()) {
    return res.render('errors/500'); // Invalid or expired token
  }

  res.render('auth/resetpassword', { layout: 'auth', title: 'Reset Password', token, forgotCSS: true });
};

/* ============================
   REGISTER USER
============================ */
exports.registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.render('auth/register', { layout: 'auth', title: 'Register', error: 'All fields are required' });
    }

    const exists = await User.findByEmail(email);
    if (exists) {
      return res.render('auth/register', { layout: 'auth', title: 'Register', error: 'Email already exists' });
    }

    const hashed = await hashPassword(password);
    await User.createUser(name, email, hashed);

    // Send Welcome Email
    sendWelcomeEmail(email, name).catch(err => console.error('Silent Welcome Email Error:', err));

    res.redirect('/login');
  } catch (err) {
    console.error('REGISTER ERROR:', err);
    res.status(500).render('errors/500');
  }
};

/* ============================
   LOGIN USER
============================ */
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.render('auth/login', { layout: 'auth', title: 'Login', error: 'Email and password are required' });
    }

    const user = await User.findByEmail(email);
    if (!user || !(await comparePassword(password, user.password))) {
      return res.render('auth/login', { layout: 'auth', title: 'Login', error: 'Invalid email or password' });
    }

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.cookie('token', token, { httpOnly: true });

    // Send Welcome Back Email
    sendWelcomeBackEmail(email, user.name).catch(err => console.error('Silent Welcome Back Email Error:', err));

    res.redirect('/dashboard');
  } catch (err) {
    console.error('LOGIN ERROR:', err);
    res.status(500).render('errors/500');
  }
};

/* ============================
   LOGOUT USER
============================ */
exports.logout = (req, res) => {
  res.clearCookie('token');
  res.redirect('/login');
};

/* ============================
   FORGOT PASSWORD
============================ */
exports.forgotPasswordPost = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) return res.render('auth/forgotpassword', { layout: 'auth', title: 'Forgot Password', forgotCSS: true, error: 'Email is required' });

    const user = await User.findByEmail(email);
    if (!user) return res.render('auth/forgotpassword', { layout: 'auth', title: 'Forgot Password', forgotCSS: true, error: 'Email not found' });

    const token = crypto.randomBytes(32).toString('hex');
    const expires = Date.now() + 3600000; // 1 hour

    await User.saveResetToken(user.id, token, expires);

    // Send Password Reset Email
    const emailSent = await sendPasswordResetEmail(email, token, user.name);

    if (emailSent) {
      res.render('auth/forgotpassword', { layout: 'auth', title: 'Forgot Password', forgotCSS: true, success: 'Reset link sent to your email.' });
    } else {
      console.log(`RESET LINK (Fallback) 👉 http://localhost:3000/reset-password/${token}`);
      res.render('auth/forgotpassword', { layout: 'auth', title: 'Forgot Password', forgotCSS: true, error: 'Failed to send email. Link printed to console for demo.' });
    }
  } catch (err) {
    console.error('FORGOT PASSWORD ERROR:', err);
    res.status(500).render('errors/500');
  }
};

/* ============================
   RESET PASSWORD POST
============================ */
exports.resetPasswordPost = async (req, res) => {
  try {
    const { token } = req.params;
    const { password, confirmPassword } = req.body;

    if (password !== confirmPassword) {
      return res.render('auth/resetpassword', {
        layout: 'auth',
        title: 'Reset Password',
        token,
        forgotCSS: true,
        error: 'Passwords do not match'
      });
    }

    const user = await User.findByResetToken(token);

    if (!user || user.reset_expires < Date.now()) {
      return res.render('errors/500');
    }

    const hashed = await hashPassword(password);
    await User.updatePassword(user.id, hashed);

    res.redirect('/login');
  } catch (err) {
    console.error('RESET PASSWORD ERROR:', err);
    res.status(500).render('errors/500');
  }
};
