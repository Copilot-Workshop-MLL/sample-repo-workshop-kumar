const { factorial, Invoice, formatDate, addUser, createConsignment, validateEmail } = require('./factorial');

describe('factorial', () => {
    test('returns 120 for factorial(5)', () => {
        expect(factorial(5)).toBe(120);
    });

    test('returns 1 for factorial(0)', () => {
        expect(factorial(0)).toBe(1);
    });

    test('returns 1 for factorial(1)', () => {
        expect(factorial(1)).toBe(1);
    });

    test('returns error message for negative numbers', () => {
        expect(factorial(-3)).toBe('Factorial is not defined for negative numbers.');
    });

    test('returns 720 for factorial(6)', () => {
        expect(factorial(6)).toBe(720);
    });
});

describe('Invoice', () => {
    let invoice;

    beforeEach(() => {
        invoice = new Invoice(100, '2024-12-31', 'John Doe');
    });

    test('stores amount, dueDate, and customerName', () => {
        expect(invoice.amount).toBe(100);
        expect(invoice.dueDate).toBe('2024-12-31');
        expect(invoice.customerName).toBe('John Doe');
    });

    test('calculates total with 10% tax', () => {
        expect(invoice.calculateTotalWithTax(0.1)).toBe(110);
    });

    test('calculates total with 0% tax', () => {
        expect(invoice.calculateTotalWithTax(0)).toBe(100);
    });

    test('calculates total with 25% tax', () => {
        expect(invoice.calculateTotalWithTax(0.25)).toBe(125);
    });
});

describe('formatDate', () => {
    test('formats date as MM/DD/YYYY', () => {
        expect(formatDate('2024-12-31')).toBe('12/31/2024');
    });

    test('pads single-digit months and days', () => {
        expect(formatDate('2024-01-05')).toBe('01/05/2024');
    });
});

describe('addUser', () => {
    test('returns success when user has name and email', () => {
        const user = { name: 'Alice', email: 'alice@example.com' };
        expect(addUser(user)).toBe('User added successfully.');
    });

    test('returns error when name is missing', () => {
        const user = { email: 'alice@example.com' };
        expect(addUser(user)).toBe('User must have a name and email.');
    });

    test('returns error when email is missing', () => {
        const user = { name: 'Alice' };
        expect(addUser(user)).toBe('User must have a name and email.');
    });

    test('returns error when both fields are missing', () => {
        expect(addUser({})).toBe('User must have a name and email.');
    });
});

describe('createConsignment', () => {
    test('returns error when user has no permissions', () => {
        const user = {};
        expect(createConsignment(user)).toBe(
            'Error: You do not have the necessary permissions to create a consignment.'
        );
    });

    test('returns error when user lacks required permission', () => {
        const user = { permissions: ['READ_CONSIGNMENT'] };
        expect(createConsignment(user)).toBe(
            'Error: You do not have the necessary permissions to create a consignment.'
        );
    });

    test('does not return error when user has CREATE_CONSIGNMENT permission', () => {
        const user = { permissions: ['CREATE_CONSIGNMENT'] };
        expect(createConsignment(user)).not.toBe(
            'Error: You do not have the necessary permissions to create a consignment.'
        );
    });
});

describe('validateEmail', () => {
    test('returns true for valid email', () => {
        expect(validateEmail('user@example.com')).toBe(true);
    });

    test('returns false for email without @', () => {
        expect(validateEmail('invalid-email')).toBe(false);
    });

    test('returns false for email without domain', () => {
        expect(validateEmail('user@')).toBe(false);
    });

    test('returns false for email without local part', () => {
        expect(validateEmail('@example.com')).toBe(false);
    });

    test('returns false for email with spaces', () => {
        expect(validateEmail('user @example.com')).toBe(false);
    });
});
