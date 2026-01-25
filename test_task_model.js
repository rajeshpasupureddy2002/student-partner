require('dotenv').config();
const Task = require('./src/models/task.model');

async function test() {
    try {
        console.log('Testing Task.findByUserId(1, "admin")...');
        const tasks = await Task.findByUserId(1, "admin");
        console.log('Success:', tasks);
        process.exit(0);
    } catch (err) {
        console.error('Error identified:', err.message);
        if (err.message.includes('Unknown column \'target_role\'')) {
            console.log('Root Cause: Missing \'target_role\' column in \'tasks\' table.');
        }
        process.exit(1);
    }
}

test();
