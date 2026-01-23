const db = require('../config/db');
const util = require('util');

const query = util.promisify(db.query).bind(db);

const Attendance = {
    // Mark or Update attendance for a specific date
    mark: async (userId, date, status) => {
        const sql = `
            INSERT INTO attendance (user_id, date, status)
            VALUES (?, ?, ?)
            ON DUPLICATE KEY UPDATE status = VALUES(status)
        `;
        await query(sql, [userId, date, status]);
        return true;
    },

    // Get attendance for a specific month (and year)
    getMonthly: async (userId, month, year) => {
        const sql = `
            SELECT * FROM attendance
            WHERE user_id = ?
            AND MONTH(date) = ?
            AND YEAR(date) = ?
        `;
        return await query(sql, [userId, month, year]);
    },

    // Remove attendance for a specific date
    remove: async (userId, date) => {
        const sql = `DELETE FROM attendance WHERE user_id = ? AND date = ?`;
        await query(sql, [userId, date]);
        return true;
    }
};

module.exports = Attendance;
