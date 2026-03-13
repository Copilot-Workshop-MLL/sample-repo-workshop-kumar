const request = require('supertest');
const jwt = require('jsonwebtoken');
const { app } = require('./auth');

describe('POST /api/auth/register', () => {
    test('registers a new user successfully', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send({ username: 'testuser', password: 'password123' });

        expect(res.status).toBe(201);
        expect(res.body.message).toBe('User registered successfully.');
    });

    test('returns 400 when username is missing', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send({ password: 'password123' });

        expect(res.status).toBe(400);
        expect(res.body.error).toBe('Username and password are required.');
    });

    test('returns 400 when password is missing', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send({ username: 'testuser2' });

        expect(res.status).toBe(400);
        expect(res.body.error).toBe('Username and password are required.');
    });

    test('returns 409 when username already exists', async () => {
        await request(app)
            .post('/api/auth/register')
            .send({ username: 'duplicate', password: 'password123' });

        const res = await request(app)
            .post('/api/auth/register')
            .send({ username: 'duplicate', password: 'password456' });

        expect(res.status).toBe(409);
        expect(res.body.error).toBe('Username already exists.');
    });
});

describe('POST /api/auth/login', () => {
    beforeAll(async () => {
        await request(app)
            .post('/api/auth/register')
            .send({ username: 'loginuser', password: 'mypassword' });
    });

    test('returns a JWT token for valid credentials', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ username: 'loginuser', password: 'mypassword' });

        expect(res.status).toBe(200);
        expect(res.body.token).toBeDefined();

        const decoded = jwt.decode(res.body.token);
        expect(decoded.username).toBe('loginuser');
    });

    test('returns 401 for wrong password', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ username: 'loginuser', password: 'wrongpassword' });

        expect(res.status).toBe(401);
        expect(res.body.error).toBe('Invalid credentials.');
    });

    test('returns 401 for non-existent user', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ username: 'nouser', password: 'password' });

        expect(res.status).toBe(401);
        expect(res.body.error).toBe('Invalid credentials.');
    });

    test('returns 400 when fields are missing', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({});

        expect(res.status).toBe(400);
        expect(res.body.error).toBe('Username and password are required.');
    });
});

describe('GET /api/auth/profile', () => {
    let token;

    beforeAll(async () => {
        await request(app)
            .post('/api/auth/register')
            .send({ username: 'profileuser', password: 'pass123' });

        const res = await request(app)
            .post('/api/auth/login')
            .send({ username: 'profileuser', password: 'pass123' });

        token = res.body.token;
    });

    test('returns user profile with valid token', async () => {
        const res = await request(app)
            .get('/api/auth/profile')
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.username).toBe('profileuser');
    });

    test('returns 401 without token', async () => {
        const res = await request(app)
            .get('/api/auth/profile');

        expect(res.status).toBe(401);
        expect(res.body.error).toBe('Access token is required.');
    });

    test('returns 403 with invalid token', async () => {
        const res = await request(app)
            .get('/api/auth/profile')
            .set('Authorization', 'Bearer invalid-token');

        expect(res.status).toBe(403);
        expect(res.body.error).toBe('Invalid or expired token.');
    });
});
