const express = require('express');
const path = require('path');
require('dotenv').config(); // ✅ MUST be at top
const db = require('./src/config/db');

const { engine } = require('express-handlebars');
const cookieParser = require('cookie-parser');

const app = express();
const PORT = process.env.PORT || 3000;

/* =====================
   MIDDLEWARE
===================== */
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

// Request Logger (For Debugging 404s)
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

/* =====================
   STATIC FILES
===================== */
app.use(express.static(path.join(__dirname, 'src/public')));

/* =====================
   VIEW ENGINE (HBS)
===================== */
app.engine(
  'hbs',
  engine({
    extname: 'hbs',
    defaultLayout: 'main',
    layoutsDir: path.join(__dirname, 'src/views/layouts'),
    partialsDir: path.join(__dirname, 'src/views/partials'),
    helpers: {
      eq: (v1, v2) => v1 === v2,
      formatDate: (date) => {
        if (!date) return '';
        const d = new Date(date);
        return d.toLocaleDateString('en-US', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        });
      }
    }
  })
);

app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'src/views'));

/* =====================
   ROUTES
===================== */
const publicRoutes = require('./src/routes/public.routes');
const authRoutes = require('./src/routes/auth.routes');
const dashboardRoutes = require('./src/routes/dashboard.routes'); // ✅ FIXED PATH

app.use('/', publicRoutes);
app.use('/', authRoutes);
app.use('/', dashboardRoutes); // ✅ dashboard route here

/* =====================
   404 HANDLER
===================== */
app.use((req, res) => {
  res.status(404).render('errors/404', {
    title: 'Page Not Found',
    layout: false
  });
});

/* =====================
   500 ERROR HANDLER
===================== */
app.use((err, req, res, next) => {
  console.error('🚨 Server Error:', err.stack);
  res.status(500).render('errors/500', {
    title: 'Server Error',
    layout: false
  });
});

/* =====================
   SERVER
===================== */
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
  console.log('✅ MySQL Connected Successfully');
});
