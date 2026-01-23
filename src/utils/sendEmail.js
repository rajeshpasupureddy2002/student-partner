const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS
  }
});

const sendPasswordResetEmail = async (email, token, userName) => {
  const resetLink = `${process.env.BASE_URL || 'http://localhost:3000'}/reset-password/${token}`;

  try {
    await transporter.sendMail({
      from: `"Student Partner" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: 'Password Reset - Student Partner',
      html: `
        <h2>Password Reset</h2>
        <p>Hello ${userName || 'User'},</p>
        <p>Click below to reset your password:</p>
        <a href="${resetLink}">${resetLink}</a>
        <p>This link expires in 1 hour.</p>
      `
    });

    return true;
  } catch (error) {
    console.error('Email error:', error);
    return false;
  }
};

const sendWelcomeEmail = async (email, userName) => {
  try {
    await transporter.sendMail({
      from: `"Student Partner" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: 'Welcome to Student Partner!',
      html: `
        <h2>Welcome ${userName}!</h2>
        <p>Thank you for joining Student Partner. We're excited to help you manage your studies and projects effectively.</p>
        <p>Get started by exploring your dashboard!</p>
      `
    });
    return true;
  } catch (error) {
    console.error('Welcome Email error:', error);
    return false;
  }
};

const sendWelcomeBackEmail = async (email, userName) => {
  try {
    await transporter.sendMail({
      from: `"Student Partner" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: 'Welcome Back to Student Partner!',
      html: `
        <h2>Welcome Back, ${userName}!</h2>
        <p>Great to see you again. Your dashboard is ready for you.</p>
      `
    });
    return true;
  } catch (error) {
    console.error('Welcome Back Email error:', error);
    return false;
  }
};

module.exports = {
  sendPasswordResetEmail,
  sendWelcomeEmail,
  sendWelcomeBackEmail
};
