const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateEmployee(req, res, next) {
    const { name, email, department, role, hireDate, salary } = req.body;
    const errors = [];

    if (!name || typeof name !== 'string' || !name.trim()) {
        errors.push('Name is required.');
    }

    if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email)) {
        errors.push('A valid email is required.');
    }

    if (!department || typeof department !== 'string' || !department.trim()) {
        errors.push('Department is required.');
    }

    if (!role || typeof role !== 'string' || !role.trim()) {
        errors.push('Role is required.');
    }

    if (!hireDate || isNaN(Date.parse(hireDate))) {
        errors.push('A valid hire date is required.');
    }

    if (salary === undefined || salary === null || typeof salary !== 'number' || salary <= 0) {
        errors.push('Salary must be a positive number.');
    }

    if (errors.length > 0) {
        return res.status(400).json({ errors });
    }

    next();
}

module.exports = { validateEmployee };
