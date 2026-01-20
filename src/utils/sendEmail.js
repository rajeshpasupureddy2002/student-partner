const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS
  }
});

const sendPasswordResetEmail = async (email, token, userName) => {
  const resetLink = `${process.env.BASE_URL}/reset-password/${token}`;

  try {
    await transporter.sendMail({
      from: `"Student Partner" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: 'Password Reset - Student Partner',
      html: `
        <h2>Password Reset</h2>
        <p>Hello ${userName},</p>
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

module.exports = { sendPasswordResetEmail };
