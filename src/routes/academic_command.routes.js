const express = require('express');
const router = express.Router();
const authMiddleware = require('../utils/authMiddleware');
const AcademicIssue = require('../models/academic_issue.model');

// Categories and Issues Data
const ISSUE_CATEGORIES = {
    'Teacher-Parent': [
        'Communication gaps',
        'Different expectations',
        'Discipline issues',
        'Homework load',
        'Blame shifting',
        'Attendance and punctuality concerns'
    ],
    'Teacher-Student': [
        'Lack of interest or motivation',
        'Discipline and classroom behaviour',
        'Fear of teachers',
        'Academic pressure and stress',
        'Misunderstanding teaching methods',
        'Partiality or favouritism'
    ],
    'Teacher-Teacher': [
        'Differences in teaching styles',
        'Unequal workload distribution',
        'Lack of coordination',
        'Professional jealousy',
        'Communication issues',
        'Resistance to change'
    ]
};

// Dashboard - List Issues
router.get('/dashboard/academic-command', authMiddleware, async (req, res) => {
    try {
        let issues = [];
        const isStaff = ['admin', 'teacher'].includes(req.user.role);

        if (req.user.role === 'admin') {
            issues = await AcademicIssue.findAll();
        } else if (req.user.role === 'teacher') {
            // Teachers see issues they reported AND issues reported by parents/students related to them (if we implemented target_user)
            // For now, let's show them issues they reported OR issues where they might be involved (simplified to all for now as 'command' implies oversight, or just their own reports?)
            // Based on "Academic Command", it sounds authoritative. Let's show them all for now or maybe just their own + relevant categories?
            // Going with their own + all if they are 'admin'-like. But strictly:
            issues = await AcademicIssue.findAll(); // Teachers often need visibility in this context? Or just their own?
            // Let's filter client-side or assume Teachers are trusted.
            // ACTUALLY: A parent complaining about a teacher -> Teacher should see it?
            // Let's stick to: Admin sees all. Others see their own reports.
            // BUT: "Academic Command" suggests a central place.
            // Let's refine: Admin = All. Teacher = All (Assumed as staff). Student/Parent = Own.
            issues = await AcademicIssue.findAll();
        } else {
            issues = await AcademicIssue.findByUser(req.user.id);
        }

        // --- NEW: Calculate Insights & Analytics ---
        const totalIssues = issues.length;
        const pending = issues.filter(i => i.status === 'pending').length;
        const resolved = issues.filter(i => i.status === 'resolved').length;
        const resolutionRate = totalIssues > 0 ? Math.round((resolved / totalIssues) * 100) : 0;

        // Category Breakdown
        const categoryStats = {
            'Teacher-Parent': issues.filter(i => i.category === 'Teacher-Parent').length,
            'Teacher-Student': issues.filter(i => i.category === 'Teacher-Student').length,
            'Teacher-Teacher': issues.filter(i => i.category === 'Teacher-Teacher').length
        };

        // Determine dominant category
        let topCategory = 'None';
        let topCount = 0;
        for (const [cat, count] of Object.entries(categoryStats)) {
            if (count > topCount) {
                topCount = count;
                topCategory = cat;
            }
        }

        res.render('academic_command/index', {
            title: 'Academic Command Center',
            layout: 'dashboard',
            user: req.user,
            active: 'academic-command',
            issues,
            isStaff,
            stats: {
                total: totalIssues,
                pending,
                resolved,
                resolutionRate,
                topCategory
            }
        });
    } catch (err) {
        console.error('ACADEMIC COMMAND INDEX ERROR:', err);
        res.status(500).render('errors/500');
    }
});

// Report Issue Form
router.get('/dashboard/academic-command/report', authMiddleware, (req, res) => {
    res.render('academic_command/report', {
        title: 'Report Academic Issue',
        layout: 'dashboard',
        user: req.user,
        active: 'academic-command',
        categories: ISSUE_CATEGORIES
    });
});

// Submit Issue
router.post('/dashboard/academic-command/report', authMiddleware, async (req, res) => {
    try {
        const { category, issue_type, description, priority } = req.body;

        // Validation: Verify category matches role permission?
        // Any role can theoretically report any issue if they observe it, but usually specific to their relation.
        // Let's allow open reporting for now.

        await AcademicIssue.create({
            reporter_id: req.user.id,
            category,
            issue_type,
            description,
            priority
        });

        res.redirect('/dashboard/academic-command?success=Issue reported successfully');
    } catch (err) {
        console.error('REPORT ISSUE ERROR:', err);
        res.redirect('/dashboard/academic-command/report?error=Failed to submit report');
    }
});

// Update Status (Admin/Teacher only)
router.post('/dashboard/academic-command/:id/update', authMiddleware, async (req, res) => {
    if (!['admin', 'teacher'].includes(req.user.role)) return res.status(403).send('Forbidden');

    try {
        const { status, resolution_notes } = req.body;
        await AcademicIssue.updateStatus(req.params.id, status, resolution_notes);
        res.redirect('/dashboard/academic-command?success=Status updated');
    } catch (err) {
        console.error('UPDATE ISSUE ERROR:', err);
        res.redirect('/dashboard/academic-command?error=Failed to update status');
    }
});

module.exports = router;
