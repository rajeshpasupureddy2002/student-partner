const db = require('../config/db');
const util = require('util');

const query = util.promisify(db.query).bind(db);

const Task = {
    create: async (userId, taskData) => {
        const sql = `
            INSERT INTO tasks (user_id, title, due_date, priority, status, target_role)
            VALUES (?, ?, ?, ?, ?, ?)
        `;
        const params = [
            userId, // Can be null for role-wide tasks
            taskData.title,
            taskData.due_date,
            taskData.priority || 'medium',
            taskData.status || 'pending',
            taskData.target_role || 'none'
        ];
        const result = await query(sql, params);
        return { id: result.insertId, ...taskData };
    },

    findByUserId: async (userId, role) => {
        const sql = `
            SELECT * FROM tasks
            WHERE user_id = ? OR target_role = ?
            ORDER BY id DESC
        `;
        return await query(sql, [userId, role]);
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

    update: async (taskId, taskData) => {
        const sql = `
            UPDATE tasks
            SET title = ?, due_date = ?, priority = ?, status = ?
            WHERE id = ?
        `;
        const params = [
            taskData.title,
            taskData.due_date,
            taskData.priority,
            taskData.status || 'pending',
            taskId
        ];
        await query(sql, params);
        return true;
    },

    delete: async (taskId) => {
        const sql = `DELETE FROM tasks WHERE id = ?`;
        await query(sql, [taskId]);
        return true;
    }
};

module.exports = Task;
