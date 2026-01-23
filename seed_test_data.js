require('dotenv').config();
const db = require('./src/config/db');
const util = require('util');
const { hashPassword } = require('./src/utils/hash');
const query = util.promisify(db.query).bind(db);

async function seedTestData() {
    try {
        console.log('--- SEEDING TEST DATA ---');

        const password = await hashPassword('password123');

        // 1. Create Users
        console.log('Creating users...');
        await query("INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE id=id",
            ['Admin User', 'admin@test.com', password, 'admin']);
        await query("INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE id=id",
            ['Teacher User', 'teacher@test.com', password, 'teacher']);
        await query("INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE id=id",
            ['Student User', 'student@test.com', password, 'student']);
        await query("INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE id=id",
            ['Parent User', 'parent@test.com', password, 'parent']);

        const users = await query("SELECT id, email, role FROM users WHERE email IN ('admin@test.com', 'teacher@test.com', 'student@test.com', 'parent@test.com')");
        const userMap = {};
        users.forEach(u => userMap[u.role] = u.id);

        // 2. Academic Structure
        console.log('Creating academic structure...');
        await query("INSERT INTO classes (name) VALUES ('Class 10') ON DUPLICATE KEY UPDATE id=id");
        const classRow = await query("SELECT id FROM classes WHERE name = 'Class 10'");
        const classId = classRow[0].id;

        await query("INSERT INTO sections (class_id, name) VALUES (?, 'Section A') ON DUPLICATE KEY UPDATE id=id", [classId]);
        const sectionRow = await query("SELECT id FROM sections WHERE class_id = ? AND name = 'Section A'", [classId]);
        const sectionId = sectionRow[0].id;

        await query("INSERT INTO subjects (name, code) VALUES ('Mathematics', 'MATH101') ON DUPLICATE KEY UPDATE id=id");
        const subjectRow = await query("SELECT id FROM subjects WHERE code = 'MATH101'");
        const subjectId = subjectRow[0].id;

        // 3. Mappings
        console.log('Creating mappings...');
        await query("INSERT INTO subject_allocation (teacher_id, class_id, section_id, subject_id, academic_year) VALUES (?, ?, ?, ?, '2025-26') ON DUPLICATE KEY UPDATE id=id",
            [userMap['teacher'], classId, sectionId, subjectId]);

        await query("INSERT INTO student_enrollment (student_id, class_id, section_id, academic_year, roll_number) VALUES (?, ?, ?, '2025-26', '101') ON DUPLICATE KEY UPDATE id=id",
            [userMap['student'], classId, sectionId]);

        // 4. Sample Data
        console.log('Creating sample data...');
        await query("INSERT INTO leaves (user_id, role, reason, start_date, end_date, status) VALUES (?, 'student', 'Fever', CURDATE(), DATE_ADD(CURDATE(), INTERVAL 2 DAY), 'pending')",
            [userMap['student']]);

        await query("INSERT INTO materials (title, description, uploader_id, class_id, section_id, subject_id, type, due_date) VALUES (?, ?, ?, ?, ?, ?, 'assignment', DATE_ADD(CURDATE(), INTERVAL 7 DAY))",
            ['Math Assignment 1', 'Solve Chapter 1', userMap['teacher'], classId, sectionId, subjectId]);

        console.log('Seeding completed successfully.');
        process.exit(0);
    } catch (err) {
        console.error('Seeding failed:', err);
        process.exit(1);
    }
}

seedTestData();
