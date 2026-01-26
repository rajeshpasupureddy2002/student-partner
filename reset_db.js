require('dotenv').config();
const db = require('./src/config/db');

async function resetDatabase() {
    console.log('⚠️  Starting Database Reset...');

    const tables = [
        'users',
        'student_enrollment',
        'parent_child_mapping',
        'subject_allocation',
        'attendance',
        'leaves',
        'tasks',
        'announcements',
        'meetings',
        'submissions',
        'exam_results',
        'password_reset_tokens'
    ];

    try {
        // Disable Foreign Key Checks to allow truncation
        await db.promise().query('SET FOREIGN_KEY_CHECKS = 0');

        for (const table of tables) {
            try {
                await db.promise().query(`TRUNCATE TABLE ${table}`);
                console.log(`✅ Truncated ${table}`);
            } catch (err) {
                // Ignore if table doesn't exist, but log error
                if (err.code === 'ER_NO_SUCH_TABLE') {
                    console.log(`⚠️  Table ${table} does not exist, skipping.`);
                } else {
                    console.error(`❌ Error truncating ${table}:`, err.message);
                }
            }
        }

        // Re-enable Foreign Key Checks
        await db.promise().query('SET FOREIGN_KEY_CHECKS = 1');

        console.log('\n✨ Database reset complete. Users table ID auto-increment is now 1.');
        console.log('You can now register new users starting with ID 1.');
        process.exit(0);

    } catch (err) {
        console.error('FATAL ERROR:', err);
        process.exit(1);
    }
}

resetDatabase();
