const express = require('express');
const path = require('path');
const { authenticateToken } = require('./middleware/auth.middleware');
const authRoutes = require('./routes/auth.routes');
const employeeRoutes = require('./routes/employee.routes');

const app = express();

app.use(express.json());

// Serve static frontend files
app.use(express.static(path.join(__dirname, '..', 'public')));

// Public auth routes (register + login don't need auth)
app.use('/api/auth', (req, res, next) => {
    // Profile route requires auth; register and login do not
    if (req.path === '/profile') {
        return authenticateToken(req, res, next);
    }
    next();
}, authRoutes);

// All employee routes require authentication
app.use('/api/employees', authenticateToken, employeeRoutes);

module.exports = app;
