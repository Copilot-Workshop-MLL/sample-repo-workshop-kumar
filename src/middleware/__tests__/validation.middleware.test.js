const { validateEmployee } = require('../validation.middleware');

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

describe('validation.middleware', () => {
    test('calls next for a valid employee payload', () => {
        const req = {
            body: {
                name: 'Jane Doe',
                email: 'jane@example.com',
                department: 'Engineering',
                role: 'Developer',
                hireDate: '2024-01-15',
                salary: 85000,
            },
        };
        const res = createRes();
        const next = jest.fn();

        validateEmployee(req, res, next);

        expect(next).toHaveBeenCalledTimes(1);
        expect(res.statusCode).toBeNull();
    });

    test('returns all validation errors for an empty payload', () => {
        const req = { body: {} };
        const res = createRes();
        const next = jest.fn();

        validateEmployee(req, res, next);

        expect(res.statusCode).toBe(400);
        expect(res.body.errors).toEqual([
            'Name is required.',
            'A valid email is required.',
            'Department is required.',
            'Role is required.',
            'A valid hire date is required.',
            'Salary must be a positive number.',
        ]);
        expect(next).not.toHaveBeenCalled();
    });

    test('rejects whitespace-only strings, invalid email, invalid date, and non-positive salary', () => {
        const req = {
            body: {
                name: '   ',
                email: 'bad-email',
                department: '',
                role: '   ',
                hireDate: 'not-a-date',
                salary: 0,
            },
        };
        const res = createRes();
        const next = jest.fn();

        validateEmployee(req, res, next);

        expect(res.statusCode).toBe(400);
        expect(res.body.errors).toContain('Name is required.');
        expect(res.body.errors).toContain('A valid email is required.');
        expect(res.body.errors).toContain('Department is required.');
        expect(res.body.errors).toContain('Role is required.');
        expect(res.body.errors).toContain('A valid hire date is required.');
        expect(res.body.errors).toContain('Salary must be a positive number.');
        expect(next).not.toHaveBeenCalled();
    });
});