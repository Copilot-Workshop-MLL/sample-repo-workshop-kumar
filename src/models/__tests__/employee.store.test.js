const employeeStore = require('../employee.store');

describe('employee.store', () => {
    beforeEach(() => {
        employeeStore.clearAll();
    });

    test('createEmployee stores a new employee with generated metadata', () => {
        const employee = employeeStore.createEmployee({
            name: 'Jane Doe',
            email: 'jane@example.com',
            department: 'Engineering',
            role: 'Developer',
            hireDate: '2024-01-15',
            salary: 85000,
        });

        expect(employee.id).toBe(1);
        expect(employee.createdAt).toBeDefined();
        expect(employee.updatedAt).toBeDefined();
        expect(employeeStore.getAllEmployees()).toHaveLength(1);
    });

    test('getEmployee returns null for an unknown id', () => {
        expect(employeeStore.getEmployee(99)).toBeNull();
    });

    test('updateEmployee updates only supplied fields and refreshes updatedAt', () => {
        const employee = employeeStore.createEmployee({
            name: 'Sam',
            email: 'sam@example.com',
            department: 'HR',
            role: 'Coordinator',
            hireDate: '2024-03-10',
            salary: 50000,
        });

        const updated = employeeStore.updateEmployee(employee.id, {
            role: 'Manager',
            salary: 65000,
        });

        expect(updated).not.toBe(employee);
        expect(updated.role).toBe('Manager');
        expect(updated.salary).toBe(65000);
        expect(updated.department).toBe('HR');
        expect(updated.updatedAt >= employee.updatedAt).toBe(true);
    });

    test('updateEmployee returns null when the employee is missing', () => {
        expect(employeeStore.updateEmployee(123, { role: 'Lead' })).toBeNull();
    });

    test('deleteEmployee removes an employee and returns status', () => {
        const employee = employeeStore.createEmployee({
            name: 'Ravi',
            email: 'ravi@example.com',
            department: 'Finance',
            role: 'Analyst',
            hireDate: '2024-02-01',
            salary: 70000,
        });

        expect(employeeStore.deleteEmployee(employee.id)).toBe(true);
        expect(employeeStore.deleteEmployee(employee.id)).toBe(false);
        expect(employeeStore.getAllEmployees()).toHaveLength(0);
    });

    test('searchEmployees filters by department and role case-insensitively', () => {
        employeeStore.createEmployee({
            name: 'Ana',
            email: 'ana@example.com',
            department: 'Engineering',
            role: 'Developer',
            hireDate: '2024-01-01',
            salary: 82000,
        });
        employeeStore.createEmployee({
            name: 'Ben',
            email: 'ben@example.com',
            department: 'Engineering',
            role: 'Manager',
            hireDate: '2024-01-02',
            salary: 98000,
        });

        expect(employeeStore.searchEmployees({ department: 'engineering' })).toHaveLength(2);
        expect(employeeStore.searchEmployees({ role: 'developer' })).toHaveLength(1);
        expect(
            employeeStore.searchEmployees({ department: 'ENGINEERING', role: 'MANAGER' })
        ).toHaveLength(1);
    });

    test('getStats returns aggregate counts and average salary', () => {
        employeeStore.createEmployee({
            name: 'A',
            email: 'a@example.com',
            department: 'Engineering',
            role: 'Developer',
            hireDate: '2024-01-01',
            salary: 80000,
        });
        employeeStore.createEmployee({
            name: 'B',
            email: 'b@example.com',
            department: 'Sales',
            role: 'Manager',
            hireDate: '2024-01-03',
            salary: 90000,
        });

        expect(employeeStore.getStats()).toEqual({
            total: 2,
            averageSalary: 85000,
            byDepartment: { Engineering: 1, Sales: 1 },
            byRole: { Developer: 1, Manager: 1 },
        });
    });
});