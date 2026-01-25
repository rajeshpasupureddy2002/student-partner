require('dotenv').config();
const db = require('./src/config/db');

db.query('SHOW TABLES', (err, results) => {
    if (err) {
        console.error(err);
        process.exit(1);
    }
    console.log('TABLES:', results);

    results.forEach(row => {
        const tableName = Object.values(row)[0];
        db.query(`DESCRIBE ${tableName}`, (err, columns) => {
            if (!err) {
                console.log(`\nTable: ${tableName}`);
                console.table(columns);
            }
        });
    });
});
