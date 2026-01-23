require('dotenv').config();
const db = require('./src/config/db');
const util = require('util');
const fs = require('fs');
const path = require('path');
const query = util.promisify(db.query).bind(db);

async function runRoleExpansion() {
    try {
        console.log('--- STARTING ROLE EXPANSION MIGRATION ---');

        const sqlPath = path.join(__dirname, 'src', 'databases', 'role_expansion.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        // Remove comments and split by semicolon
        const cleanSql = sql.replace(/--.*$/gm, '');
        const statements = cleanSql
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0);

        for (const statement of statements) {
            try {
                console.log(`Executing: ${statement.substring(0, 100)}...`);
                await query(statement);
            } catch (statementErr) {
                console.error(`FAILED STATEMENT: ${statement}`);
                console.error('ERROR DETAIL:', statementErr);
                throw statementErr;
            }
        }

        console.log('Migration successful: All tables created/updated.');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

runRoleExpansion();
