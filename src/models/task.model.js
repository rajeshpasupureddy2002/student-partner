const db = require('../config/db');
const util = require('util');

const query = util.promisify(db.query).bind(db);

const Task = {
    create: async (userId, taskData) => {
        const sql = `
            INSERT INTO tasks (user_id, title, due_date, priority, status)
            VALUES (?, ?, ?, ?, ?)
        `;
        const params = [
            userId,
            taskData.title,
            taskData.due_date,
            taskData.priority || 'medium',
            taskData.status || 'pending'
        ];
        const result = await query(sql, params);
        return { id: result.insertId, ...taskData };
    },

    findByUserId: async (userId) => {
        const sql = `
            SELECT * FROM tasks
            WHERE user_id = ?
            ORDER BY due_date ASC
        `;
        return await query(sql, [userId]);
    },

    updateStatus: async (taskId, status) => {
        const sql = `
            UPDATE tasks
            SET status = ?
            WHERE id = ?
        `;
        await query(sql, [status, taskId]);
        return true;
    },

    delete: async (taskId) => {
        const sql = `DELETE FROM tasks WHERE id = ?`;
        await query(sql, [taskId]);
        return true;
    }
};

module.exports = Task;
