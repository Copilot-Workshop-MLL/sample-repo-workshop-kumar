const crypto = require('crypto');

const users = new Map();

function hashPassword(password, salt) {
    return crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
}

function createUser(username, password) {
    const salt = crypto.randomBytes(16).toString('hex');
    const hashedPassword = hashPassword(password, salt);
    users.set(username, { username, password: hashedPassword, salt });
}

function getUser(username) {
    return users.get(username);
}

function hasUser(username) {
    return users.has(username);
}

module.exports = { users, hashPassword, createUser, getUser, hasUser };
