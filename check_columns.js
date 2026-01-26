require('dotenv').config();
const db = require('./src/config/db');

db.connect((err) => {
    if (err) {
        console.error('Connection failed:', err);
        process.exit(1);
    }
    console.log('Connected to MySQL');

    db.query('DESCRIBE users', (err, rows) => {
        if (err) {
            console.error(err);
        } else {
            const columns = rows.map(r => r.Field);
            console.log('Columns in users table:', columns);
            if (columns.includes('profile_image')) {
                console.log('✅ profile_image column EXISTS');
            } else {
                console.log('❌ profile_image column MISSING');
            }
        }
        db.end();
    });
});
