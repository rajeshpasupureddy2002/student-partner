const express = require("express");
const router = express.Router();
const authMiddleware = require("../utils/authMiddleware");

// Protected Route using Middleware
router.get("/dashboard", authMiddleware, (req, res) => {

  // Mock Data (until we have real tables for tasks/calendar)
  // Calendar Logic
  const date = new Date();
  const year = date.getFullYear();
  const month = date.getMonth();
  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const currentMonth = `${monthNames[month]} ${year}`;

  // Get first day of the month (0=Sun, 1=Mon, ..., 6=Sat)
  const firstDay = new Date(year, month, 1).getDay();
  // Helper to calculate empty slots before the 1st of the month
  // UI shows Mon as first column. 
  // If 1st is Mon (1), empty slots = 0.
  // If 1st is Sun (0), empty slots = 6.
  // Formula: (day + 6) % 7
  const startDayIndex = (firstDay + 6) % 7;

  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const calendar = [];

  // Fill empty slots
  for (let i = 0; i < startDayIndex; i++) {
    calendar.push({ isEmpty: true });
  }

  // Fill days
  for (let i = 1; i <= daysInMonth; i++) {
    const checkDate = new Date(year, month, i);
    const dayOfWeek = checkDate.getDay();

    let status = 'present'; // Default

    // Simple Mock Logic: Weekends are weekoff
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      status = 'weekoff';
    } else {
      // Randomly assign absent/holiday for demo purposes
      const rand = Math.random();
      if (rand < 0.1) status = 'absent';
      else if (rand < 0.15) status = 'holiday';
    }

    calendar.push({ date: i, status: status, isEmpty: false });
  }

  const tasks = [
    { title: "Complete Project Proposal", due: "Today, 5:00 PM", priority: "high" },
    { title: "Team Meeting", due: "Tomorrow, 10:00 AM", priority: "medium" },
    { title: "Submit Assignment", due: "Friday", priority: "high" },
    { title: "Review Code", due: "Next Week", priority: "medium" }
  ];

  res.render("auth/dashboard", {
    title: "Student Dashboard",
    layout: "dashboard",
    // Use Real User Data from Middleware
    user: {
      name: req.user.name,
      email: req.user.email,
      avatar: "https://ui-avatars.com/api/?name=" + encodeURIComponent(req.user.name) + "&background=random"
    },
    currentMonth: currentMonth,
    calendar: calendar,
    tasks: tasks,
    stats: {
      attendance: "85%",
      assignments: "12",
      gpa: "3.8"
    }
  });
});

/* ========================
   SETTINGS ROUTES
======================== */
const User = require("../models/user.model");

// GET Settings Page
router.get("/dashboard/settings", authMiddleware, (req, res) => {
  res.render("auth/settings", {
    title: "Settings - Student Partner",
    layout: "dashboard",
    user: req.user, // Passes all fields including new ones
    success: req.query.success,
    error: req.query.error
  });
});

// POST Update Settings
router.post("/dashboard/settings", authMiddleware, async (req, res) => {
  try {
    const { name, phone, bio, college, major, linkedin, github, notifications_email, notifications_push } = req.body;

    // Prepare data object
    const updateData = {
      name,
      phone,
      bio,
      college,
      major,
      linkedin,
      github,
      notifications_email: notifications_email === 'on',
      notifications_push: notifications_push === 'on'
    };

    await User.updateProfile(req.user.id, updateData);

    res.redirect("/dashboard/settings?success=Profile updated successfully");
  } catch (err) {
    console.error("SETTINGS UPDATE ERROR:", err);
    res.redirect("/dashboard/settings?error=Failed to update profile");
  }
});

module.exports = router;
