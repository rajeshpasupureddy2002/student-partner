require('dotenv').config();
const db = require('./src/config/db');

db.connect((err) => {
    if (err) {
        console.error('Connection failed:', err);
        process.exit(1);
    }
    console.log('Connected to MySQL');

    const sql = "ALTER TABLE users ADD COLUMN profile_image VARCHAR(255) NULL";

    db.query(sql, (err, result) => {
        if (err) {
            if (err.code === 'ER_DUP_FIELDNAME') {
                console.log('Column already exists.');
            } else {
                console.error('Migration failed:', err);
            }
        } else {
            console.log('✅ Successfully added profile_image column');
        }
        db.end();
    });
});
