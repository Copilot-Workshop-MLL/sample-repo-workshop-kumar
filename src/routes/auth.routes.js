const express = require('express');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../middleware/auth.middleware');
const { hashPassword, createUser, getUser, hasUser } = require('../models/user.store');

const router = express.Router();

const TOKEN_EXPIRY = '1h';

// Register
router.post('/register', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required.' });
    }

    if (hasUser(username)) {
        return res.status(409).json({ error: 'Username already exists.' });
    }

    createUser(username, password);
    return res.status(201).json({ message: 'User registered successfully.' });
});

// Login
router.post('/login', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required.' });
    }

    const user = getUser(username);
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

// Profile (protected — authenticateToken applied at app level)
router.get('/profile', (req, res) => {
    return res.json({ username: req.user.username });
});

module.exports = router;
