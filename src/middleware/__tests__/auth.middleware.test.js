const jwt = require('jsonwebtoken');
const { authenticateToken, JWT_SECRET } = require('../auth.middleware');

function createRes() {
    return {
        statusCode: null,
        body: null,
        status(code) {
            this.statusCode = code;
            return this;
        },
        json(payload) {
            this.body = payload;
            return this;
        },
    };
}

describe('auth.middleware', () => {
    test('attaches user and calls next for a valid token', () => {
        const token = jwt.sign({ username: 'alice' }, JWT_SECRET, { expiresIn: '1h' });
        const req = { headers: { authorization: `Bearer ${token}` } };
        const res = createRes();
        const next = jest.fn();

        authenticateToken(req, res, next);

        expect(req.user.username).toBe('alice');
        expect(next).toHaveBeenCalledTimes(1);
        expect(res.statusCode).toBeNull();
    });

    test('returns 401 when the authorization header is missing', () => {
        const req = { headers: {} };
        const res = createRes();
        const next = jest.fn();

        authenticateToken(req, res, next);

        expect(res.statusCode).toBe(401);
        expect(res.body).toEqual({ error: 'Access token is required.' });
        expect(next).not.toHaveBeenCalled();
    });

    test('returns 401 when the authorization header is not a bearer token', () => {
        const req = { headers: { authorization: 'Token abc123' } };
        const res = createRes();
        const next = jest.fn();

        authenticateToken(req, res, next);

        expect(res.statusCode).toBe(401);
        expect(res.body).toEqual({ error: 'Access token is required.' });
        expect(next).not.toHaveBeenCalled();
    });

    test('returns 403 when the token is invalid', () => {
        const req = { headers: { authorization: 'Bearer invalid-token' } };
        const res = createRes();
        const next = jest.fn();

        authenticateToken(req, res, next);

        expect(res.statusCode).toBe(403);
        expect(res.body).toEqual({ error: 'Invalid or expired token.' });
        expect(next).not.toHaveBeenCalled();
    });
});