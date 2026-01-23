require('dotenv').config();
const db = require('./src/config/db');
const fs = require('fs');
const path = require('path');
const util = require('util');

const query = util.promisify(db.query).bind(db);

async function runMigration() {
    try {
        const sqlPath = path.join(__dirname, 'src/databases/admin_expansion.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        // Split by semicolon but ignore inside quotes or comments
        const statements = sql.split(/;(?=(?:(?:[^'"]*['"]){2})*[^'"]*$)(?![^/*]*\*\/)/);

        for (let statement of statements) {
            if (statement.trim()) {
                console.log('Executing:', statement.trim().substring(0, 50) + '...');
                await query(statement);
            }
        }

        console.log('✅ Admin expansion migration completed successfully');
        process.exit(0);
    } catch (err) {
        console.error('❌ Migration failed:', err);
        process.exit(1);
    }
}

runMigration();
