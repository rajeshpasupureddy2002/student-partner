require('dotenv').config();
const db = require('./src/config/db');
const util = require('util');
const query = util.promisify(db.query).bind(db);

const User = require('./src/models/user.model');

async function migrate() {
    try {
        console.log('Starting Registration ID Migration...');

        // Fetch users without registration_id
        const users = await query('SELECT * FROM users WHERE registration_id IS NULL OR registration_id = ""');
        console.log(`Found ${users.length} users to migrate.`);

        for (const user of users) {
            // We need to temporarily mock the generation logic or reuse it. 
            // Since generateRegistrationId checks count, doing this sequentially works.
            // However, created_at ordering would be better for "sequence".
        }

        // Re-fetching all users ordered by created_at to assign IDs sequentially based on join date
        const allUsers = await query("SELECT * FROM users ORDER BY created_at ASC");

        // Group by role to manage counters
        const roleCounters = {
            'student': 0,
            'teacher': 0,
            'parent': 0,
            'admin': 0
        };

        const roleMap = {
            'student': 'ST',
            'teacher': 'TR',
            'parent': 'PR',
            'admin': 'AD'
        };

        for (const user of allUsers) {
            if (user.registration_id) {
                // Determine if we should overwrite or skip. 
                // If it exists, let's assume it's correct or valid. 
                // But for a full "make changes in entire db", maybe we ensure format is correct?
                // Let's only update NULL ones but use the counters to maintain sequence relative to *creation*.

                // Oops, if we only update NULLs, we might conflict if we don't know the current max sequence.
                // Better approach: Check if it's null.
            }
        }

        // SIMPLER APPROACH for safer migration:
        // 1. Get users with NULL registration_id
        // 2. For each, generate a new ID using the model's function which checks the DB for current count.
        // This effectively appends them to the end of the sequence.

        for (const user of users) {
            const regId = await User.generateRegistrationId(user.role);
            await query('UPDATE users SET registration_id = ? WHERE id = ?', [regId, user.id]);
            console.log(`Updated User ${user.id} (${user.role}) -> ${regId}`);
        }

        console.log('Migration Complete.');
        process.exit();

    } catch (err) {
        console.error('Migration Failed:', err);
        process.exit(1);
    }
}

migrate();
