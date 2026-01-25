require('dotenv').config();
const db = require('./src/config/db');

db.query('SHOW TABLES', (err, results) => {
    if (err) { console.error(err); return; }
    console.log('Available Tables:', results.map(r => Object.values(r)[0]));
    process.exit(0);
});
