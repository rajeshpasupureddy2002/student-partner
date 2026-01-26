require('dotenv').config();
const { sendAnnouncementEmail } = require('./src/utils/sendEmail');
const { sendSMS } = require('./src/utils/sendSMS');

async function verify() {
    console.log('Testing Email Announcement...');
    const emailRes = await sendAnnouncementEmail(
        process.env.GMAIL_USER,
        'Test Broadcast',
        'This is a test broadcast email content.',
        'Admin'
    );
    console.log('Email Result:', emailRes);

    console.log('\nTesting SMS Announcement...');
    const smsRes = await sendSMS(
        '1234567890',
        'Institutional Notice: This is a test SMS broadcast.'
    );
    console.log('SMS Result:', smsRes);
}

verify().then(() => console.log('\nVerification Complete')).catch(console.error);
