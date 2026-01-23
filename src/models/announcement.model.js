const db = require('../config/db');
const util = require('util');

const query = util.promisify(db.query).bind(db);

const Announcement = {
    create: async (data) => {
        const sql = `
            INSERT INTO announcements (title, content, target_role, created_by)
            VALUES (?, ?, ?, ?)
        `;
        return await query(sql, [data.title, data.content, data.target_role, data.created_by]);
    },

    getForRole: async (role) => {
        const sql = `
            SELECT a.*, u.name as author_name
            FROM announcements a
            JOIN users u ON a.created_by = u.id
            WHERE a.target_role IN ('all', ?)
            ORDER BY a.created_at DESC
        `;
        return await query(sql, [role]);
    }
};

module.exports = Announcement;
