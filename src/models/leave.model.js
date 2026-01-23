const db = require('../config/db');
const util = require('util');

const query = util.promisify(db.query).bind(db);

const Leave = {
    apply: async (data) => {
        const sql = `
            INSERT INTO leaves (user_id, role, reason, start_date, end_date, status)
            VALUES (?, ?, ?, ?, ?, 'pending')
        `;
        return await query(sql, [data.user_id, data.role, data.reason, data.start_date, data.end_date]);
    },

    getByUser: async (userId) => {
        return await query('SELECT * FROM leaves WHERE user_id = ? ORDER BY created_at DESC', [userId]);
    },

    getAllPending: async () => {
        const sql = `
            SELECT l.*, u.name as applicant_name
            FROM leaves l
            JOIN users u ON l.user_id = u.id
            WHERE l.status = 'pending'
            ORDER BY l.created_at ASC
        `;
        return await query(sql);
    },

    updateStatus: async (leaveId, status, approvedBy, remarks) => {
        const sql = `
            UPDATE leaves
            SET status = ?, approved_by = ?, remarks = ?
            WHERE id = ?
        `;
        return await query(sql, [status, approvedBy, remarks, leaveId]);
    },

    cancel: async (leaveId, userId) => {
        return await query('DELETE FROM leaves WHERE id = ? AND user_id = ? AND status = ?', [leaveId, userId, 'pending']);
    }
};

module.exports = Leave;
