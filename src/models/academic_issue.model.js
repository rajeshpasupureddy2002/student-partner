const db = require('../config/db');
const util = require('util');

const query = util.promisify(db.query).bind(db);

const AcademicIssue = {
    create: async (data) => {
        const sql = `
            INSERT INTO academic_issues (reporter_id, category, issue_type, description, priority, status)
            VALUES (?, ?, ?, ?, ?, ?)
        `;
        return await query(sql, [
            data.reporter_id,
            data.category,
            data.issue_type,
            data.description,
            data.priority || 'medium',
            data.status || 'pending'
        ]);
    },

    findAll: async () => {
        const sql = `
            SELECT ai.*, u.name as reporter_name, u.role as reporter_role 
            FROM academic_issues ai
            JOIN users u ON ai.reporter_id = u.id
            ORDER BY ai.created_at DESC
        `;
        return await query(sql);
    },

    findByUser: async (userId) => {
        const sql = `
            SELECT * FROM academic_issues 
            WHERE reporter_id = ? 
            ORDER BY created_at DESC
        `;
        return await query(sql, [userId]);
    },

    findById: async (id) => {
        const sql = `
            SELECT ai.*, u.name as reporter_name, u.email as reporter_email
            FROM academic_issues ai
            JOIN users u ON ai.reporter_id = u.id
            WHERE ai.id = ?
        `;
        const rows = await query(sql, [id]);
        return rows[0];
    },

    updateStatus: async (id, status, notes) => {
        const sql = `
            UPDATE academic_issues 
            SET status = ?, resolution_notes = ? 
            WHERE id = ?
        `;
        return await query(sql, [status, notes, id]);
    },

    getStats: async () => {
        const sql = `
            SELECT status, COUNT(*) as count 
            FROM academic_issues 
            GROUP BY status
        `;
        return await query(sql);
    }
};

module.exports = AcademicIssue;
