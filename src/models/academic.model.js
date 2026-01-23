const db = require('../config/db');
const util = require('util');

const query = util.promisify(db.query).bind(db);

const Academic = {
    // Classes
    getClasses: async () => {
        return await query('SELECT * FROM classes ORDER BY name');
    },

    createClass: async (name) => {
        return await query('INSERT INTO classes (name) VALUES (?)', [name]);
    },

    // Sections
    getSectionsByClass: async (classId) => {
        return await query('SELECT * FROM sections WHERE class_id = ? ORDER BY name', [classId]);
    },

    createSection: async (classId, name) => {
        return await query('INSERT INTO sections (class_id, name) VALUES (?, ?)', [classId, name]);
    },

    // Subjects
    getSubjects: async () => {
        return await query('SELECT * FROM subjects ORDER BY name');
    },

    createSubject: async (name, code) => {
        return await query('INSERT INTO subjects (name, code) VALUES (?, ?)', [name, code]);
    },

    // Allocations
    allocateTeacher: async (data) => {
        const sql = `
            INSERT INTO subject_allocation (teacher_id, class_id, section_id, subject_id, academic_year)
            VALUES (?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE teacher_id = VALUES(teacher_id)
        `;
        return await query(sql, [data.teacher_id, data.class_id, data.section_id, data.subject_id, data.academic_year]);
    },

    getTeacherAllocations: async (teacherId) => {
        const sql = `
            SELECT sa.*, c.name as class_name, s.name as section_name, sub.name as subject_name
            FROM subject_allocation sa
            JOIN classes c ON sa.class_id = c.id
            JOIN sections s ON sa.section_id = s.id
            JOIN subjects sub ON sa.subject_id = sub.id
            WHERE sa.teacher_id = ?
        `;
        return await query(sql, [teacherId]);
    },

    // Enrollments
    enrollStudent: async (data) => {
        const sql = `
            INSERT INTO student_enrollment (student_id, class_id, section_id, academic_year, roll_number)
            VALUES (?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE class_id = VALUES(class_id), section_id = VALUES(section_id), roll_number = VALUES(roll_number)
        `;
        return await query(sql, [data.student_id, data.class_id, data.section_id, data.academic_year, data.roll_number]);
    },

    getStudentEnrollment: async (studentId) => {
        const sql = `
            SELECT se.*, c.name as class_name, s.name as section_name
            FROM student_enrollment se
            JOIN classes c ON se.class_id = c.id
            JOIN sections s ON se.section_id = s.id
            WHERE se.student_id = ?
            ORDER BY se.created_at DESC LIMIT 1
        `;
        const rows = await query(sql, [studentId]);
        return rows.length ? rows[0] : null;
    }
};

module.exports = Academic;
