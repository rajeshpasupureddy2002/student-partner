require('dotenv').config();
const db = require('./src/config/db');

const tables = ['parent_child_mapping', 'subject_allocation', 'student_enrollment'];

tables.forEach(table => {
    db.query(`DESCRIBE ${table}`, (err, columns) => {
        if (err) { console.error(err); return; }
        console.log(`\nTable: ${table}`);
        console.table(columns);
    });
});
