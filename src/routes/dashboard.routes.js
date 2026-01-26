const express = require("express");
const router = express.Router();
const authMiddleware = require("../utils/authMiddleware");
const db = require("../config/db");
const util = require("util");

const query = util.promisify(db.query).bind(db);

// Protected Route using Middleware
// Models
const User = require("../models/user.model");
const Task = require("../models/task.model");
const Attendance = require("../models/attendance.model");
const Academic = require("../models/academic.model");
const Leave = require("../models/leave.model");
const Assignment = require("../models/assignment.model");
const Result = require("../models/result.model");
const Announcement = require("../models/announcement.model");
const Meeting = require("../models/meeting.model");
const { sendAnnouncementEmail } = require("../utils/sendEmail");
const { sendSMS } = require("../utils/sendSMS");

const { hashPassword, comparePassword } = require("../utils/hash");

// Protected Route using Middleware
router.get("/dashboard", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const date = new Date();
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const monthNames = ["January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    const currentMonthLabel = `${monthNames[date.getMonth()]} ${year}`;

    let dashboardData = {
      title: `${userRole.charAt(0).toUpperCase() + userRole.slice(1)} Dashboard`,
      layout: "dashboard",
      user: {
        ...req.user,
        avatar: "https://ui-avatars.com/api/?name=" + encodeURIComponent(req.user.name) + "&background=random"
      },
      currentMonth: currentMonthLabel,
      month: month,
      year: year,
      active: 'overview'
    };

    // Role-Specific Data Fetching
    if (userRole === 'student') {
      const enrollment = await Academic.getStudentEnrollment(userId);
      let subjects = [];
      let assignments = [];
      if (enrollment) {
        // Here we could fetch subjects by section, for now let's mock or fetch if available
        // subjects = await Academic.getSubjectsBySection(enrollment.section_id); 
        assignments = await Assignment.getMaterialsBySection(enrollment.section_id);
      }

      const attendanceRecords = await Attendance.getMonthly(userId, month, year);
      const leaveHistory = await Leave.getByUser(userId);

      // Calendar Logic (Existing)
      const firstDay = new Date(year, date.getMonth(), 1).getDay();
      const startDayIndex = (firstDay + 6) % 7;
      const daysInMonth = new Date(year, date.getMonth() + 1, 0).getDate();
      const calendar = [];
      const attendanceMap = {};
      attendanceRecords.forEach(rec => { attendanceMap[new Date(rec.date).getDate()] = rec.status; });

      for (let i = 0; i < startDayIndex; i++) calendar.push({ isEmpty: true });
      for (let i = 1; i <= daysInMonth; i++) {
        calendar.push({ date: i, status: attendanceMap[i] || "none", isEmpty: false, isToday: i === date.getDate() });
      }

      dashboardData.calendar = calendar;
      dashboardData.assignments = assignments.filter(m => m.type === 'assignment');
      dashboardData.leaves = leaveHistory;
      dashboardData.tasks = await Task.findByUserId(userId, userRole);
      dashboardData.stats = {
        attendance: attendanceRecords.length > 0 ? Math.round((attendanceRecords.filter(r => r.status === 'present').length / attendanceRecords.length) * 100) + "%" : "0%",
        assignments: assignments.filter(m => m.type === 'assignment').length,
        gpa: "N/A"
      };
    }
    else if (userRole === 'teacher') {
      const allocations = await Academic.getTeacherAllocations(userId);
      const studentLeaves = await Leave.getAllPending(); // Ideally filtered by classes teacher manages

      dashboardData.allocations = allocations;
      dashboardData.studentLeaves = studentLeaves;
      dashboardData.tasks = await Task.findByUserId(userId, userRole);
      dashboardData.stats = {
        classes: allocations.length,
        pendingLeaves: studentLeaves.length
      };
    }
    else if (userRole === 'admin') {
      const userCounts = await query(`
        SELECT role, COUNT(*) as count 
        FROM users 
        GROUP BY role
      `);

      const counts = { student: 0, teacher: 0, parent: 0, admin: 0 };
      userCounts.forEach(c => { counts[c.role] = c.count; });

      const pendingUsersCount = await query("SELECT COUNT(*) as count FROM users WHERE status = 'pending'");
      const pendingLeaves = await Leave.getAllPending();

      dashboardData.stats = {
        totalUsers: Object.values(counts).reduce((a, b) => a + b, 0),
        totalTeachers: counts.teacher,
        totalStudents: counts.student,
        totalParents: counts.parent,
        pendingApprovals: pendingUsersCount[0].count,
        pendingLeaves: pendingLeaves.length
      };

      dashboardData.pendingLeaves = pendingLeaves.slice(0, 5); // Show only top 5
      dashboardData.recentUsers = await query("SELECT name, role, created_at FROM users ORDER BY created_at DESC LIMIT 5");
      dashboardData.tasks = await Task.findByUserId(userId, userRole);
      dashboardData.systemHealth = {
        lastBackup: "2026-01-23 10:00 AM",
        securityStatus: "Optimal",
        serverUptime: "14 days"
      };
    }
    else if (userRole === 'parent') {
      // Logic for linked children
      dashboardData.children = []; // To be implemented with parent_child_mapping
    }

    res.render("auth/dashboard", dashboardData);
  } catch (err) {
    console.error("DASHBOARD ERROR:", err);
    res.status(500).render("errors/500");
  }
});

// ---------- Leave Request Routes ----------
// Render leave application form for students
router.get('/dashboard/leaves/apply', authMiddleware, async (req, res) => {
  try {
    res.render('leave_form', {
      title: 'Apply for Leave',
      layout: 'dashboard',
      user: req.user,
      active: 'leaves'
    });
  } catch (err) {
    console.error('LEAVE FORM ERROR:', err);
    res.status(500).render('errors/500');
  }
});

// Handle leave submission
router.post('/dashboard/leaves/apply', authMiddleware, async (req, res) => {
  try {
    const { reason, start_date, end_date } = req.body;
    await Leave.apply({
      user_id: req.user.id,
      role: req.user.role,
      reason,
      start_date,
      end_date
    });
    res.redirect('/dashboard?success=Leave request submitted');
  } catch (err) {
    console.error('LEAVE SUBMIT ERROR:', err);
    res.redirect('/dashboard?error=Failed to submit leave');
  }
});

// Approve a pending leave (teacher/admin)
router.post('/dashboard/leaves/:id/approve', authMiddleware, async (req, res) => {
  try {
    if (!['teacher', 'admin'].includes(req.user.role)) return res.status(403).send('Forbidden');
    const leaveId = req.params.id;
    const remarks = req.body.remarks || '';
    await Leave.updateStatus(leaveId, 'approved', req.user.id, remarks);
    res.redirect('back');
  } catch (err) {
    console.error('APPROVE LEAVE ERROR:', err);
    res.redirect('back');
  }
});

// Reject a pending leave (teacher/admin)
router.post('/dashboard/leaves/:id/reject', authMiddleware, async (req, res) => {
  try {
    if (!['teacher', 'admin'].includes(req.user.role)) return res.status(403).send('Forbidden');
    const leaveId = req.params.id;
    const remarks = req.body.remarks || '';
    await Leave.updateStatus(leaveId, 'rejected', req.user.id, remarks);
    res.redirect('back');
  } catch (err) {
    console.error('REJECT LEAVE ERROR:', err);
    res.redirect('back');
  }
});

// Mark Attendance Route
router.post("/dashboard/attendance/:day", authMiddleware, async (req, res) => {
  try {
    const { status } = req.body;
    const { day } = req.params;
    const date = new Date();
    const formattedDate = `${date.getFullYear()}-${date.getMonth() + 1}-${day}`;

    if (status === 'none') {
      await Attendance.remove(req.user.id, formattedDate);
    } else {
      await Attendance.mark(req.user.id, formattedDate, status);
    }
    res.json({ success: true, status: status });
  } catch (err) {
    console.error("MARK ATTENDANCE ERROR:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Fetch Calendar Data (JSON)
router.get("/dashboard/calendar-data", authMiddleware, async (req, res) => {
  try {
    const { month, year } = req.query;
    const userId = req.user.id;

    const records = await Attendance.getMonthly(userId, month, year);
    res.json({ success: true, records: records });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Add Task Route
router.post("/dashboard/task", authMiddleware, async (req, res) => {
  try {
    const { title, date, priority } = req.body;
    await Task.create(req.user.id, {
      title,
      due_date: date,
      priority,
      status: 'pending'
    });
    res.redirect("/dashboard");
  } catch (err) {
    console.error("ADD TASK ERROR:", err);
    res.redirect("/dashboard?error=Failed to add task");
  }
});

// Update Task Route
router.post("/dashboard/task/:id/edit", authMiddleware, async (req, res) => {
  try {
    const { title, date, priority, status } = req.body;
    await Task.update(req.params.id, {
      title,
      due_date: date,
      priority,
      status: status || 'pending'
    });
    res.redirect("/dashboard?success=Task updated");
  } catch (err) {
    console.error("UPDATE TASK ERROR:", err);
    res.redirect("/dashboard?error=Failed to update task");
  }
});

// Delete Task Route
router.post("/dashboard/task/:id/delete", authMiddleware, async (req, res) => {
  try {
    await Task.delete(req.params.id);
    res.redirect("/dashboard?success=Task deleted");
  } catch (err) {
    console.error("DELETE TASK ERROR:", err);
    res.redirect("/dashboard?error=Failed to delete task");
  }
});

// Settings Page
router.get("/dashboard/settings", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.render("auth/settings", {
      title: "Settings",
      layout: "dashboard",
      user: user,
      success: req.query.success,
      error: req.query.error,
      active: 'settings'
    });
  } catch (err) {
    console.error("SETTINGS PAGE ERROR:", err);
    res.status(500).render("errors/500");
  }
});

// Update Profile
const upload = require("../utils/fileUpload");

// Update Profile
router.post("/dashboard/settings", authMiddleware, upload.single('profile_image'), async (req, res) => {
  try {
    const data = req.body;
    if (req.file) {
      data.profile_image = '/uploads/' + req.file.filename;
    }
    await User.updateProfile(req.user.id, data);
    res.redirect("/dashboard/settings?success=Profile updated successfully");
  } catch (err) {
    console.error("UPDATE PROFILE ERROR:", err);
    res.redirect("/dashboard/settings?error=Failed to update profile");
  }
});

/* =====================
   ADMIN: USER OVERSIGHT
   ===================== */

// List Students
router.get("/admin/students", authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin') return res.redirect("/dashboard");
  try {
    // Fetch all students with basic class info
    const sql = `
            SELECT u.id, u.registration_id, u.name, u.email, u.profile_image, 
                   c.name as class_name, s.name as section_name
            FROM users u
            LEFT JOIN student_enrollment se ON u.id = se.student_id
            LEFT JOIN classes c ON se.class_id = c.id
            LEFT JOIN sections s ON se.section_id = s.id
            WHERE u.role = 'student'
            ORDER BY u.name ASC
        `;
    const students = await query(sql);

    res.render("admin/students_list", {
      title: "Student Management",
      layout: "dashboard",
      user: req.user,
      active: 'students',
      students
    });
  } catch (err) {
    console.error("ADMIN STUDENTS LIST ERROR:", err);
    res.status(500).render("errors/500");
  }
});

// List Teachers
router.get("/admin/teachers", authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin') return res.redirect("/dashboard");
  try {
    // Fetch teachers with stats
    const sql = `
            SELECT u.id, u.registration_id, u.name, u.email, u.phone, u.profile_image,
                   (SELECT COUNT(*) FROM subject_allocation sa WHERE sa.teacher_id = u.id) as class_count
            FROM users u
            WHERE u.role = 'teacher'
            ORDER BY u.name ASC
        `;
    const teachers = await query(sql);

    res.render("admin/teachers_list", {
      title: "Teacher Management",
      layout: "dashboard",
      user: req.user,
      active: 'teachers',
      teachers
    });
  } catch (err) {
    console.error("ADMIN TEACHERS LIST ERROR:", err);
    res.status(500).render("errors/500");
  }
});

// Student Detail View for Admin
router.get("/admin/student/:id", authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin') return res.redirect("/dashboard");
  try {
    const studentId = req.params.id;
    const student = await User.findById(studentId);
    if (!student) return res.status(404).render("errors/404");

    const enrollment = await Academic.getStudentEnrollment(studentId);
    const attendance = await Attendance.getMonthly(studentId, new Date().getMonth() + 1, new Date().getFullYear());
    const results = await Result.getByStudent(studentId);
    const leaves = await Leave.getByUser(studentId);

    // Fetch Parent Details
    const parentSql = `
        SELECT u.* 
        FROM users u 
        JOIN parent_child_mapping pcm ON u.id = pcm.parent_id 
        WHERE pcm.student_id = ?
    `;
    const parents = await query(parentSql, [studentId]);
    const parent = parents.length ? parents[0] : null;

    res.render("admin/user_profile", {
      title: `Student: ${student.name}`,
      layout: "dashboard",
      user: req.user,
      targetUser: student,
      role: 'student',
      enrollment,
      attendance,
      results,
      leaves,
      parent, // Pass parent info
      active: 'students' // Updated active state
    });
  } catch (err) {
    console.error("ADMIN STUDENT VIEW ERROR:", err);
    res.status(500).render("errors/500");
  }
});

// Teacher Detail View for Admin
router.get("/admin/teacher/:id", authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin') return res.redirect("/dashboard");
  try {
    const teacherId = req.params.id;
    const teacher = await User.findById(teacherId);
    if (!teacher) return res.status(404).render("errors/404");

    const allocations = await Academic.getTeacherAllocations(teacherId);
    const leaves = await Leave.getByUser(teacherId);

    res.render("admin/user_profile", {
      title: `Teacher: ${teacher.name}`,
      layout: "dashboard",
      user: req.user,
      targetUser: teacher,
      role: 'teacher',
      allocations,
      leaves,
      active: 'users'
    });
  } catch (err) {
    console.error("ADMIN TEACHER VIEW ERROR:", err);
    res.status(500).render("errors/500");
  }
});

/* =====================
   ADMIN: ACADEMIC MGMT
   ===================== */

// Class-wise detail view
router.get("/admin/academic", authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin') return res.redirect("/dashboard");
  try {
    const classes = await Academic.getClasses();
    const classesWithDetails = await Promise.all(classes.map(async (c) => {
      const sections = await Academic.getSectionsByClass(c.id);
      const studentCount = await query("SELECT COUNT(*) as count FROM student_enrollment WHERE class_id = ?", [c.id]);
      return { ...c, sections, studentCount: studentCount[0].count };
    }));

    res.render("admin/academic", {
      title: "Academic Management",
      layout: "dashboard",
      user: req.user,
      classes: classesWithDetails,
      active: 'academic'
    });
  } catch (err) {
    console.error("ADMIN ACADEMIC VIEW ERROR:", err);
    res.status(500).render("errors/500");
  }
});

// Create Section
router.post("/admin/section/create", authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ success: false });
  try {
    const { class_id, name } = req.body;
    await Academic.createSection(class_id, name);
    res.redirect("/admin/academic?success=Section created");
  } catch (err) {
    res.redirect("/admin/academic?error=Failed to create section");
  }
});

/* =====================
   ADMIN: SCHEDULING
   ==================== */

// Meeting Scheduling
router.post("/admin/meetings/schedule", authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ success: false });
  try {
    const meetingData = {
      ...req.body,
      created_by: req.user.id
    };
    await Meeting.create(meetingData);
    res.redirect("/dashboard?success=Meeting scheduled");
  } catch (err) {
    res.redirect("/dashboard?error=Failed to schedule meeting");
  }
});

// Assign Task to Role
router.post("/admin/tasks/role-assign", authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ success: false });
  try {
    const { title, due_date, priority, target_role } = req.body;
    await Task.create(null, {
      title,
      due_date,
      priority,
      target_role,
      status: 'pending'
    });
    res.redirect("/dashboard?success=Task assigned to " + target_role);
  } catch (err) {
    res.redirect("/dashboard?error=Failed to assign task");
  }
});

// Change Password
router.post("/dashboard/settings/password", authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    const user = await User.findById(req.user.id);

    if (newPassword !== confirmPassword) {
      return res.redirect("/dashboard/settings?error=Passwords do not match");
    }

    const isMatch = await comparePassword(currentPassword, user.password);
    if (!isMatch) {
      return res.redirect("/dashboard/settings?error=Incorrect current password");
    }

    const hashed = await hashPassword(newPassword);
    await User.updatePassword(req.user.id, hashed);
    res.redirect("/dashboard/settings?success=Password changed successfully");
  } catch (err) {
    console.error("CHANGE PASSWORD ERROR:", err);
    res.redirect("/dashboard/settings?error=Failed to change password");
  }
});

// Leave Oversight Route
router.get("/admin/leaves", authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin') return res.redirect("/dashboard");
  try {
    const pendingLeaves = await Leave.getAllPending();
    // Assuming we might want history too, let's fetch all or just pending for now, or add a method for history
    const historyLeaves = await query(`
        SELECT l.*, u.name as applicant_name 
        FROM leaves l 
        JOIN users u ON l.user_id = u.id 
        WHERE l.status != 'pending' 
        ORDER BY l.created_at DESC LIMIT 20
    `);

    res.render("admin/leaves", {
      title: "Leave Oversight",
      layout: "dashboard",
      user: req.user,
      active: 'leaves',
      pendingLeaves,
      historyLeaves
    });
  } catch (err) {
    console.error("ADMIN LEAVES ERROR:", err);
    res.status(500).render("errors/500");
  }
});

// Announcement Creation
router.post("/announcements/create", authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ success: false });
  try {
    const { title, content, target_role, comms_mode, target_student_id } = req.body;

    // 1. Create DB entry
    await Announcement.create({
      title,
      content,
      target_role: target_student_id ? 'student' : target_role,
      created_by: req.user.id
    });

    // 2. Resolve Recipients
    let recipients = [];
    if (target_student_id) {
      const student = await User.findById(target_student_id);
      if (student) recipients = [student];
    } else {
      recipients = await User.findByRole(target_role);
    }

    // 3. Trigger Notifications
    for (const recipient of recipients) {
      if (comms_mode === 'email' && recipient.notifications_email !== 0) {
        sendAnnouncementEmail(recipient.email, title, content, recipient.name)
          .catch(err => console.error(`Failed to send email to ${recipient.email}:`, err));
      } else if (comms_mode === 'sms' && recipient.notifications_sms !== 0 && recipient.phone) {
        sendSMS(recipient.phone, `${title}: ${content.substring(0, 100)}...`)
          .catch(err => console.error(`Failed to send SMS to ${recipient.phone}:`, err));
      }
    }

    res.redirect("/admin/announcements?success=Announcement published and broadcast triggered");
  } catch (err) {
    console.error("ANNOUNCEMENT CREATE ERROR:", err);
    res.redirect("/admin/announcements?error=Failed to publish");
  }
});

router.get("/admin/announcements", authMiddleware, (req, res) => {
  if (req.user.role !== 'admin') return res.redirect("/dashboard");
  res.render("admin/announcements", {
    title: "Announcement Center",
    layout: "dashboard",
    user: req.user,
    active: 'announcements'
  });
});

// Security & Audit View
router.get("/admin/security", authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin') return res.redirect("/dashboard");
  try {
    const recentUsers = await query("SELECT name, role, registration_id, created_at FROM users ORDER BY created_at DESC LIMIT 20");
    res.render("admin/security", {
      title: "Security & Audit Center",
      layout: "dashboard",
      user: req.user,
      recentUsers,
      active: 'security'
    });
  } catch (err) {
    res.status(500).render("errors/500");
  }
});

// Student Search API (for intelligent broadcasting)
router.get("/admin/users/search", authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ success: false });

  try {
    const searchTerm = req.query.q;
    // Search by ID or Name (Using Real Schema Mapping)
    const sql = `
      SELECT u.id, u.name, u.email, 
             (SELECT email FROM users WHERE role = 'parent' AND id IN (SELECT parent_id FROM parent_child_mapping WHERE student_id = u.id) LIMIT 1) as parent_email,
             (SELECT u2.email FROM users u2 
              JOIN subject_allocation sa ON u2.id = sa.teacher_id 
              JOIN student_enrollment se ON sa.class_id = se.class_id AND sa.section_id = se.section_id
              WHERE se.student_id = u.id LIMIT 1) as teacher_email
      FROM users u
      WHERE u.role = 'student' AND (u.name LIKE ? OR u.id LIKE ?)
      LIMIT 10
    `;
    const results = await query(sql, [`%${searchTerm}%`, `%${searchTerm}%`]);
    res.json({ success: true, users: results });
  } catch (err) {
    console.error("USER SEARCH ERROR:", err);
    res.status(500).json({ success: false });
  }
});

// Print Report Route
router.get("/admin/report/:role/:id", authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin') return res.redirect("/dashboard");
  try {
    const { role, id } = req.params;
    const user = await User.findById(id);
    if (!user) return res.status(404).send("User not found");

    let reportData = {
      title: `Report - ${user.name}`,
      layout: false, // No dashboard layout
      user: user,
      role: role,
      date: new Date().toLocaleDateString()
    };

    if (role === 'student') {
      reportData.enrollment = await Academic.getStudentEnrollment(id);
      const attendance = await Attendance.getMonthly(id, new Date().getMonth() + 1, new Date().getFullYear());
      reportData.attendance_percentage = attendance.length > 0
        ? Math.round((attendance.filter(r => r.status === 'present').length / attendance.length) * 100)
        : 0;

      const leaves = await Leave.getByUser(id);
      reportData.pending_leaves = leaves.filter(l => l.status === 'pending').length;

      // Parent Info
      const parentSql = `SELECT u.* FROM users u JOIN parent_child_mapping pcm ON u.id = pcm.parent_id WHERE pcm.student_id = ?`;
      const parents = await query(parentSql, [id]);
      reportData.parent = parents.length ? parents[0] : null;

    } else if (role === 'teacher') {
      reportData.allocations = await Academic.getTeacherAllocations(id);
    }

    res.render("admin/report_print", reportData);
  } catch (err) {
    console.error("REPORT GENERATION ERROR:", err);
    res.status(500).send("Server Error");
  }
});

// End of file
module.exports = router;
