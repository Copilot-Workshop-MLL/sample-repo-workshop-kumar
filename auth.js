const express = require('express');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const app = express();
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'test-secret-do-not-use-in-production';

const TOKEN_EXPIRY = '1h';

// Simulated user store (replace with a real database)
const users = new Map();

function hashPassword(password, salt) {
    return crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
}

// Register endpoint
app.post('/api/auth/register', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required.' });
    }

    if (users.has(username)) {
        return res.status(409).json({ error: 'Username already exists.' });
    }

    const salt = crypto.randomBytes(16).toString('hex');
    const hashedPassword = hashPassword(password, salt);

    users.set(username, { username, password: hashedPassword, salt });

    return res.status(201).json({ message: 'User registered successfully.' });
});

// Login endpoint
app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required.' });
    }

    const user = users.get(username);
    if (!user) {
        return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const hashedPassword = hashPassword(password, user.salt);
    if (hashedPassword !== user.password) {
        return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const token = jwt.sign({ username: user.username }, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });

    return res.json({ token });
});

// Middleware to authenticate JWT tokens
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
        return res.status(401).json({ error: 'Access token is required.' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(403).json({ error: 'Invalid or expired token.' });
    }
}

// Protected route example
app.get('/api/auth/profile', authenticateToken, (req, res) => {
    return res.json({ username: req.user.username });
});

if (require.main === module) {
    if (!process.env.JWT_SECRET) {
        console.error('JWT_SECRET environment variable is required');
        process.exit(1);
    }
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}

module.exports = { app, authenticateToken };
