require('dotenv').config();
const fs = require('fs');
const path = require('path');
const db = require('./src/config/db');

const schemaPath = path.join(__dirname, 'src', 'databases', 'update_schema.sql');
const schema = fs.readFileSync(schemaPath, 'utf8');

// Simple split by semicolon. Warning: might break if ; is inside strings.
const queries = schema.split(';').filter(q => q.trim().length > 0);

console.log(`Running ${queries.length} queries...`);

db.connect(async (err) => {
    if (err) {
        console.error('Connection failed:', err);
        process.exit(1);
    }
    console.log('Connected to MySQL');

    for (let i = 0; i < queries.length; i++) {
        const query = queries[i];
        if (query.trim().startsWith('/*') || query.trim().startsWith('--')) continue;

        try {
            await new Promise((resolve, reject) => {
                db.query(query, (err, res) => {
                    if (err) {
                        // Ignore duplicate column errors (code 1060) or table already exists
                        if (err.code === 'ER_DUP_FIELDNAME' || err.code === 'ER_TABLE_EXISTS_ERROR') {
                            console.log(`Skipping duplicate/existing: ${err.sqlMessage}`);
                            resolve();
                        } else {
                            reject(err);
                        }
                    } else {
                        console.log(`Query ${i + 1} executed successfully.`);
                        resolve();
                    }
                });
            });
        } catch (error) {
            console.error(`Error on query ${i + 1}:`, error);
        }
    }

    console.log('Migration complete.');
    db.end();
});
