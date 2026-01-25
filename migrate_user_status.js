require('dotenv').config();
const db = require('./src/config/db');
const util = require('util');
const query = util.promisify(db.query).bind(db);

async function migrate() {
    try {
        console.log('--- SYNCING USERS TABLE STATUS ---');

        try {
            await query("ALTER TABLE users ADD COLUMN status ENUM('pending', 'active', 'deactivated') DEFAULT 'active'");
            console.log('✅ Added status column to users table.');
            // Defaulting to active for existing users, but new ones might be pending if we update registration.
        } catch (err) {
            if (err.code === 'ER_DUP_COLUMN_NAME') {
                console.log('ℹ️ status column already exists.');
            } else {
                throw err;
            }
        }

        console.log('--- USERS MIGRATION COMPLETED ---');
        process.exit(0);
    } catch (err) {
        console.error('❌ Migration failed:', err);
        process.exit(1);
    }
}

migrate();
