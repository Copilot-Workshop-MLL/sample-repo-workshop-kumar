const request = require('supertest');
const app = require('../../app');
const employeeStore = require('../../models/employee.store');

let token;

beforeAll(async () => {
    // Register and login to get a token
    await request(app)
        .post('/api/auth/register')
        .send({ username: 'emptestuser', password: 'testpass123' });

    const res = await request(app)
        .post('/api/auth/login')
        .send({ username: 'emptestuser', password: 'testpass123' });

    token = res.body.token;
});

beforeEach(() => {
    employeeStore.clearAll();
});

const validEmployee = {
    name: 'Jane Doe',
    email: 'jane@example.com',
    department: 'Engineering',
    role: 'Developer',
    hireDate: '2024-01-15',
    salary: 85000,
};

describe('POST /api/employees', () => {
    test('creates an employee', async () => {
        const res = await request(app)
            .post('/api/employees')
            .set('Authorization', `Bearer ${token}`)
            .send(validEmployee);

        expect(res.status).toBe(201);
        expect(res.body.id).toBe(1);
        expect(res.body.name).toBe('Jane Doe');
        expect(res.body.email).toBe('jane@example.com');
        expect(res.body.department).toBe('Engineering');
        expect(res.body.createdAt).toBeDefined();
    });

    test('returns 400 for missing fields', async () => {
        const res = await request(app)
            .post('/api/employees')
            .set('Authorization', `Bearer ${token}`)
            .send({ name: 'Incomplete' });

        expect(res.status).toBe(400);
        expect(res.body.errors).toBeDefined();
        expect(res.body.errors.length).toBeGreaterThan(0);
    });

    test('returns 400 for invalid email', async () => {
        const res = await request(app)
            .post('/api/employees')
            .set('Authorization', `Bearer ${token}`)
            .send({ ...validEmployee, email: 'not-an-email' });

        expect(res.status).toBe(400);
        expect(res.body.errors).toContain('A valid email is required.');
    });

    test('returns 400 for negative salary', async () => {
        const res = await request(app)
            .post('/api/employees')
            .set('Authorization', `Bearer ${token}`)
            .send({ ...validEmployee, salary: -5000 });

        expect(res.status).toBe(400);
        expect(res.body.errors).toContain('Salary must be a positive number.');
    });

    test('returns 401 without token', async () => {
        const res = await request(app)
            .post('/api/employees')
            .send(validEmployee);

        expect(res.status).toBe(401);
    });
});

describe('GET /api/employees', () => {
    beforeEach(() => {
        employeeStore.createEmployee(validEmployee);
        employeeStore.createEmployee({
            ...validEmployee,
            name: 'John Smith',
            email: 'john@example.com',
            department: 'Marketing',
            role: 'Manager',
        });
    });

    test('returns all employees', async () => {
        const res = await request(app)
            .get('/api/employees')
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body).toHaveLength(2);
    });

    test('filters by department', async () => {
        const res = await request(app)
            .get('/api/employees?department=Engineering')
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body).toHaveLength(1);
        expect(res.body[0].department).toBe('Engineering');
    });

    test('filters by role', async () => {
        const res = await request(app)
            .get('/api/employees?role=Manager')
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body).toHaveLength(1);
        expect(res.body[0].role).toBe('Manager');
    });

    test('filters by department and role', async () => {
        const res = await request(app)
            .get('/api/employees?department=Marketing&role=Manager')
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body).toHaveLength(1);
    });

    test('returns empty array for non-matching filter', async () => {
        const res = await request(app)
            .get('/api/employees?department=Finance')
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body).toHaveLength(0);
    });
});

describe('GET /api/employees/:id', () => {
    test('returns a single employee', async () => {
        employeeStore.createEmployee(validEmployee);

        const res = await request(app)
            .get('/api/employees/1')
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.name).toBe('Jane Doe');
    });

    test('returns 404 for non-existent employee', async () => {
        const res = await request(app)
            .get('/api/employees/999')
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(404);
    });

    test('returns 400 for invalid ID', async () => {
        const res = await request(app)
            .get('/api/employees/abc')
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(400);
    });
});

describe('PUT /api/employees/:id', () => {
    beforeEach(() => {
        employeeStore.createEmployee(validEmployee);
    });

    test('updates an employee', async () => {
        const res = await request(app)
            .put('/api/employees/1')
            .set('Authorization', `Bearer ${token}`)
            .send({ ...validEmployee, name: 'Jane Updated', salary: 95000 });

        expect(res.status).toBe(200);
        expect(res.body.name).toBe('Jane Updated');
        expect(res.body.salary).toBe(95000);
        expect(res.body.updatedAt).toBeDefined();
    });

    test('returns 404 for non-existent employee', async () => {
        const res = await request(app)
            .put('/api/employees/999')
            .set('Authorization', `Bearer ${token}`)
            .send(validEmployee);

        expect(res.status).toBe(404);
    });

    test('returns 400 for invalid data', async () => {
        const res = await request(app)
            .put('/api/employees/1')
            .set('Authorization', `Bearer ${token}`)
            .send({ name: 'Only Name' });

        expect(res.status).toBe(400);
    });
});

describe('DELETE /api/employees/:id', () => {
    beforeEach(() => {
        employeeStore.createEmployee(validEmployee);
    });

    test('deletes an employee', async () => {
        const res = await request(app)
            .delete('/api/employees/1')
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(204);

        const getRes = await request(app)
            .get('/api/employees/1')
            .set('Authorization', `Bearer ${token}`);

        expect(getRes.status).toBe(404);
    });

    test('returns 404 for non-existent employee', async () => {
        const res = await request(app)
            .delete('/api/employees/999')
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(404);
    });
});

describe('GET /api/employees/stats', () => {
    test('returns empty stats when no employees', async () => {
        const res = await request(app)
            .get('/api/employees/stats')
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.total).toBe(0);
        expect(res.body.averageSalary).toBe(0);
    });

    test('returns correct stats', async () => {
        employeeStore.createEmployee(validEmployee);
        employeeStore.createEmployee({
            ...validEmployee,
            name: 'Bob',
            email: 'bob@example.com',
            department: 'Marketing',
            role: 'Manager',
            salary: 95000,
        });

        const res = await request(app)
            .get('/api/employees/stats')
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.total).toBe(2);
        expect(res.body.averageSalary).toBe(90000);
        expect(res.body.byDepartment).toEqual({ Engineering: 1, Marketing: 1 });
        expect(res.body.byRole).toEqual({ Developer: 1, Manager: 1 });
    });
});
