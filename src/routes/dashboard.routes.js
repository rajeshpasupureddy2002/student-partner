const express = require("express");
const router = express.Router();

router.get("/dashboard", (req, res) => {
  res.render("auth/dashboard", {
    title: "Dashboard",
    layout: "dashboard",     // ✅ important
    user: req.user || {      // ✅ fallback avoids crash
      name: "Student",
      email: "student@example.com"
    }
  });
});

module.exports = router;
