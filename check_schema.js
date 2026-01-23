require('dotenv').config();
const db = require('./src/config/db');

db.query('DESCRIBE users', (err, results) => {
    if (err) {
        console.error('Error describing users table:', err);
    } else {
        console.log(JSON.stringify(results, null, 2));
    }
    db.end();
});
