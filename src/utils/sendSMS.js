/**
 * SMS Utility Wrapper
 * For now, this is a placeholder that logs to the console.
 * You can integrate Twilio, Msg91, or any other SMS provider here.
 */

const sendSMS = async (phoneNumber, message) => {
    if (!phoneNumber) {
        console.error('SMS Error: No phone number provided');
        return false;
    }

    try {
        console.log('------------------------------------------');
        console.log(`[SIMULATED SMS SENT] To: ${phoneNumber}`);
        console.log(`Message: ${message}`);
        console.log('------------------------------------------');

        // Example Twilio Integration:
        // const client = require('twilio')(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);
        // await client.messages.create({ body: message, from: process.env.TWILIO_PHONE, to: phoneNumber });

        return true;
    } catch (error) {
        console.error('SMS Sending Error:', error);
        return false;
    }
};

module.exports = { sendSMS };
