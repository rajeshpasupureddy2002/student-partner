const db = require('../config/db');
const util = require('util');

const query = util.promisify(db.query).bind(db);

const Result = {
    add: async (data) => {
        const sql = `
            INSERT INTO exam_results (student_id, subject_id, exam_name, marks_obtained, max_marks, remarks)
            VALUES (?, ?, ?, ?, ?, ?)
        `;
        return await query(sql, [data.student_id, data.subject_id, data.exam_name, data.marks_obtained, data.max_marks, data.remarks]);
    },

    getStudentResults: async (studentId) => {
        const sql = `
            SELECT er.*, s.name as subject_name
            FROM exam_results er
            JOIN subjects s ON er.subject_id = s.id
            WHERE er.student_id = ?
            ORDER BY er.created_at DESC
        `;
        return await query(sql, [studentId]);
    }
};

module.exports = Result;
