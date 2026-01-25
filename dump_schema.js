require('dotenv').config();
const db = require('./src/config/db');
const fs = require('fs');

const tables = ['parent_child_mapping', 'subject_allocation', 'student_enrollment', 'users'];
let output = '';

const check = (index) => {
    if (index >= tables.length) {
        fs.writeFileSync('schema_dump.txt', output);
        process.exit(0);
    }
    const table = tables[index];
    db.query(`DESCRIBE ${table}`, (err, columns) => {
        output += `\nTable: ${table}\n` + JSON.stringify(columns, null, 2) + '\n';
        check(index + 1);
    });
};

check(0);
