const db = require('../config/db');
const util = require('util');

const query = util.promisify(db.query).bind(db);

const Meeting = {
    create: async (data) => {
        const sql = `
            INSERT INTO meetings (title, description, meeting_date, start_time, end_time, target_role, created_by)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        const params = [
            data.title,
            data.description,
            data.meeting_date,
            data.start_time,
            data.end_time,
            data.target_role || 'all',
            data.created_by
        ];
        return await query(sql, params);
    },

    getByRole: async (role) => {
        const sql = `
            SELECT m.*, u.name as creator_name 
            FROM meetings m
            JOIN users u ON m.created_by = u.id
            WHERE m.target_role = 'all' OR m.target_role = ?
            ORDER BY m.meeting_date ASC, m.start_time ASC
        `;
        return await query(sql, [role]);
    },

    getUpcoming: async (limit = 5) => {
        const sql = `
            SELECT m.*, u.name as creator_name 
            FROM meetings m
            JOIN users u ON m.created_by = u.id
            WHERE m.meeting_date >= CURDATE()
            ORDER BY m.meeting_date ASC, m.start_time ASC
            LIMIT ?
        `;
        return await query(sql, [limit]);
    }
};

module.exports = Meeting;
