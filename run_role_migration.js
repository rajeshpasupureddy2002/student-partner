require('dotenv').config();
const db = require('./src/config/db');
const util = require('util');
const query = util.promisify(db.query).bind(db);

async function runMigration() {
    try {
        console.log('--- UPDATING USERS TABLE ROLE ENUM ---');
        // We update to include parent and teacher.
        const sql = "ALTER TABLE users MODIFY COLUMN role ENUM('student', 'parent', 'teacher', 'admin') DEFAULT 'student'";
        await query(sql);
        console.log('Migration successful: Role enum updated.');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

runMigration();
