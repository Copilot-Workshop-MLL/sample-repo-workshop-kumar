const express = require('express');
const { validateEmployee } = require('../middleware/validation.middleware');
const employeeStore = require('../models/employee.store');

const router = express.Router();

// GET /stats — must be before /:id to avoid matching "stats" as an id
router.get('/stats', (req, res) => {
    const stats = employeeStore.getStats();
    return res.json(stats);
});

// GET / — list all, with optional ?department=X&role=Y filters
router.get('/', (req, res) => {
    const { department, role } = req.query;
    if (department || role) {
        return res.json(employeeStore.searchEmployees({ department, role }));
    }
    return res.json(employeeStore.getAllEmployees());
});

// GET /:id
router.get('/:id', (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid employee ID.' });
    }
    const employee = employeeStore.getEmployee(id);
    if (!employee) {
        return res.status(404).json({ error: 'Employee not found.' });
    }
    return res.json(employee);
});

// POST / — create
router.post('/', validateEmployee, (req, res) => {
    const employee = employeeStore.createEmployee(req.body);
    return res.status(201).json(employee);
});

// PUT /:id — update
router.put('/:id', validateEmployee, (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid employee ID.' });
    }
    const updated = employeeStore.updateEmployee(id, req.body);
    if (!updated) {
        return res.status(404).json({ error: 'Employee not found.' });
    }
    return res.json(updated);
});

// DELETE /:id
router.delete('/:id', (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid employee ID.' });
    }
    const deleted = employeeStore.deleteEmployee(id);
    if (!deleted) {
        return res.status(404).json({ error: 'Employee not found.' });
    }
    return res.status(204).send();
});

module.exports = router;
