require('dotenv').config();
const db = require('./src/config/db');
const util = require('util');
const fs = require('fs');
const query = util.promisify(db.query).bind(db);

async function checkSchema() {
    let output = '';
    try {
        output += '--- USERS SCHEMA ---\n';
        const users = await query('DESCRIBE users');
        users.forEach(col => output += `${col.Field}: ${col.Type}\n`);

        output += '\n--- TASKS SCHEMA ---\n';
        const tasks = await query('DESCRIBE tasks');
        tasks.forEach(col => output += `${col.Field}: ${col.Type}\n`);

        fs.writeFileSync('schema_output.txt', output);
        console.log('Output written to schema_output.txt');
        process.exit(0);
    } catch (err) {
        fs.writeFileSync('schema_output.txt', err.toString());
        process.exit(1);
    }
}

checkSchema();
