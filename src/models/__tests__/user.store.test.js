const { users, hashPassword, createUser, getUser, hasUser } = require('../user.store');

describe('user.store', () => {
    beforeEach(() => {
        users.clear();
    });

    test('hashPassword returns the same hash for the same password and salt', () => {
        const salt = 'fixed-salt';
        const first = hashPassword('secret123', salt);
        const second = hashPassword('secret123', salt);

        expect(first).toBe(second);
        expect(first).toMatch(/^[a-f0-9]+$/);
    });

    test('createUser stores a hashed password and salt', () => {
        createUser('alice', 'password123');

        const user = getUser('alice');

        expect(user).toBeDefined();
        expect(user.username).toBe('alice');
        expect(user.password).not.toBe('password123');
        expect(user.salt).toHaveLength(32);
        expect(hashPassword('password123', user.salt)).toBe(user.password);
    });

    test('getUser returns undefined for a missing user', () => {
        expect(getUser('missing-user')).toBeUndefined();
    });

    test('hasUser reports whether a user exists', () => {
        createUser('bob', 'pw');

        expect(hasUser('bob')).toBe(true);
        expect(hasUser('charlie')).toBe(false);
    });
});