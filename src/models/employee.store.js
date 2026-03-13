const employees = new Map();
let nextId = 1;

function createEmployee(data) {
    const id = nextId++;
    const now = new Date().toISOString();
    const employee = {
        id,
        name: data.name,
        email: data.email,
        department: data.department,
        role: data.role,
        hireDate: data.hireDate,
        salary: data.salary,
        createdAt: now,
        updatedAt: now,
    };
    employees.set(id, employee);
    return employee;
}

function getEmployee(id) {
    return employees.get(id) || null;
}

function getAllEmployees() {
    return Array.from(employees.values());
}

function updateEmployee(id, data) {
    const existing = employees.get(id);
    if (!existing) return null;

    const updated = {
        ...existing,
        name: data.name ?? existing.name,
        email: data.email ?? existing.email,
        department: data.department ?? existing.department,
        role: data.role ?? existing.role,
        hireDate: data.hireDate ?? existing.hireDate,
        salary: data.salary ?? existing.salary,
        updatedAt: new Date().toISOString(),
    };
    employees.set(id, updated);
    return updated;
}

function deleteEmployee(id) {
    const existing = employees.get(id);
    if (!existing) return false;
    employees.delete(id);
    return true;
}

function searchEmployees({ department, role }) {
    let results = Array.from(employees.values());
    if (department) {
        results = results.filter(e => e.department.toLowerCase() === department.toLowerCase());
    }
    if (role) {
        results = results.filter(e => e.role.toLowerCase() === role.toLowerCase());
    }
    return results;
}

function getStats() {
    const all = Array.from(employees.values());
    const total = all.length;

    const departmentCounts = {};
    const roleCounts = {};
    let totalSalary = 0;

    for (const emp of all) {
        departmentCounts[emp.department] = (departmentCounts[emp.department] || 0) + 1;
        roleCounts[emp.role] = (roleCounts[emp.role] || 0) + 1;
        totalSalary += emp.salary;
    }

    return {
        total,
        averageSalary: total > 0 ? Math.round((totalSalary / total) * 100) / 100 : 0,
        byDepartment: departmentCounts,
        byRole: roleCounts,
    };
}

function clearAll() {
    employees.clear();
    nextId = 1;
}

module.exports = {
    createEmployee,
    getEmployee,
    getAllEmployees,
    updateEmployee,
    deleteEmployee,
    searchEmployees,
    getStats,
    clearAll,
};
