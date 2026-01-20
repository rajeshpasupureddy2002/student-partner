require('dotenv').config();
const { sendPasswordResetEmail } = require('./src/utils/sendEmail');

sendPasswordResetEmail(
  'your_email@gmail.com',
  'testtoken123',
  'Rajesh'
)
.then(sent => console.log('Email sent:', sent))
.catch(err => console.error(err));
