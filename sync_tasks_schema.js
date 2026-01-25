require('dotenv').config();
const db = require('./src/config/db');
const util = require('util');
const query = util.promisify(db.query).bind(db);

async function migrate() {
    try {
        console.log('--- SYNCING TASKS TABLE SCHEMA ---');

        // 1. Add target_role if it doesn't exist
        try {
            await query("ALTER TABLE tasks ADD COLUMN target_role ENUM('none', 'student', 'teacher', 'admin') DEFAULT 'none'");
            console.log('✅ Added target_role column to tasks table.');
        } catch (err) {
            if (err.code === 'ER_DUP_COLUMN_NAME') {
                console.log('ℹ️ target_role column already exists.');
            } else {
                throw err;
            }
        }

        // 2. Make user_id nullable (to support role-wide tasks)
        try {
            await query("ALTER TABLE tasks MODIFY COLUMN user_id INT NULL");
            console.log('✅ Updated user_id to be nullable in tasks table.');
        } catch (err) {
            console.error('❌ Failed to modify user_id column:', err.message);
            throw err;
        }

        console.log('--- MIGRATION COMPLETED SUCCESSFULLY ---');
        process.exit(0);
    } catch (err) {
        console.error('❌ Migration failed:', err);
        process.exit(1);
    }
}

migrate();
