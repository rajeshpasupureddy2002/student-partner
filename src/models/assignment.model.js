const db = require('../config/db');
const util = require('util');

const query = util.promisify(db.query).bind(db);

const Assignment = {
    // Materials & Assignments
    createMaterial: async (data) => {
        const sql = `
            INSERT INTO materials (title, description, file_path, uploader_id, class_id, section_id, subject_id, type, due_date)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        return await query(sql, [data.title, data.description, data.file_path, data.uploader_id, data.class_id, data.section_id, data.subject_id, data.type, data.due_date]);
    },

    getMaterialsBySection: async (sectionId) => {
        const sql = `
            SELECT m.*, u.name as uploader_name, s.name as subject_name
            FROM materials m
            JOIN users u ON m.uploader_id = u.id
            JOIN subjects s ON m.subject_id = s.id
            WHERE m.section_id = ?
            ORDER BY m.created_at DESC
        `;
        return await query(sql, [sectionId]);
    },

    // Submissions
    submit: async (data) => {
        const sql = `
            INSERT INTO submissions (material_id, student_id, file_path, content)
            VALUES (?, ?, ?, ?)
        `;
        return await query(sql, [data.material_id, data.student_id, data.file_path, data.content]);
    },

    getSubmissionsForMaterial: async (materialId) => {
        const sql = `
            SELECT sub.*, u.name as student_name
            FROM submissions sub
            JOIN users u ON sub.student_id = u.id
            WHERE sub.material_id = ?
        `;
        return await query(sql, [materialId]);
    },

    gradeSubmission: async (submissionId, data) => {
        const sql = `
            UPDATE submissions
            SET status = 'graded', grade = ?, feedback = ?
            WHERE id = ?
        `;
        return await query(sql, [data.grade, data.feedback, submissionId]);
    }
};

module.exports = Assignment;
