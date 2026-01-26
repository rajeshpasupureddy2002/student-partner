require('dotenv').config();
const User = require('./src/models/user.model');
const crypto = require('crypto');

async function verify() {
    try {
        const randomEmail = `teststudent_${crypto.randomBytes(4).toString('hex')}@example.com`;

        console.log('Registering new student...');
        const result = await User.createUser(
            'Test Student',
            randomEmail,
            'password123',
            'student'
        );

        console.log('User Created successfully.');
        console.log(`Name: ${result.name || 'Test Student'}`);
        console.log(`Role: ${result.role || 'student'}`);
        console.log(`Registration ID: ${result.registration_id}`);

        if (result.registration_id.startsWith('2026ST')) {
            console.log('PASS: Registration ID follows format.');
        } else {
            console.error('FAIL: Invalid Registration ID format.');
        }

        process.exit();
    } catch (err) {
        console.error('Test Failed:', err);
        process.exit(1);
    }
}

verify();
