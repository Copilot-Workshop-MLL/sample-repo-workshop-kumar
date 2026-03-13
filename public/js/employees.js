let allEmployees = [];

document.addEventListener('DOMContentLoaded', async () => {
    const profile = await requireAuth();
    if (!profile) {
        return;
    }

    const userLabel = document.getElementById('user-label');
    if (userLabel) {
        userLabel.textContent = `Signed in as ${profile.username}`;
    }

    loadEmployees();

    document.getElementById('logout-btn').addEventListener('click', () => {
        clearSession();
        window.location.href = '/';
    });

    document.getElementById('add-btn').addEventListener('click', () => openModal());
    document.getElementById('modal-cancel').addEventListener('click', closeModal);
    document.getElementById('employee-form').addEventListener('submit', handleSubmit);

    document.getElementById('filter-dept').addEventListener('change', applyFilters);
    document.getElementById('filter-role').addEventListener('change', applyFilters);
    document.getElementById('clear-filters').addEventListener('click', () => {
        document.getElementById('filter-dept').value = '';
        document.getElementById('filter-role').value = '';
        renderTable(allEmployees);
    });
});

async function loadEmployees() {
    try {
        allEmployees = await apiFetch('/employees');
        populateFilterOptions();
        renderTable(allEmployees);
    } catch (err) {
        console.error('Failed to load employees', err);
    }
}

function populateFilterOptions() {
    const departments = [...new Set(allEmployees.map(e => e.department))].sort();
    const roles = [...new Set(allEmployees.map(e => e.role))].sort();

    fillSelect('filter-dept', departments);
    fillSelect('filter-role', roles);
}

function fillSelect(id, options) {
    const select = document.getElementById(id);
    const current = select.value;
    // Keep the first "All" option
    select.innerHTML = '<option value="">All</option>';
    for (const opt of options) {
        const el = document.createElement('option');
        el.value = opt;
        el.textContent = opt;
        if (opt === current) el.selected = true;
        select.appendChild(el);
    }
}

function applyFilters() {
    const dept = document.getElementById('filter-dept').value;
    const role = document.getElementById('filter-role').value;
    let filtered = allEmployees;
    if (dept) filtered = filtered.filter(e => e.department === dept);
    if (role) filtered = filtered.filter(e => e.role === role);
    renderTable(filtered);
}

function renderTable(employees) {
    const tbody = document.getElementById('employee-tbody');
    tbody.innerHTML = '';

    if (employees.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;color:#6c757d;">No employees found.</td></tr>';
        return;
    }

    for (const emp of employees) {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${emp.id}</td>
            <td>${escapeHtml(emp.name)}</td>
            <td>${escapeHtml(emp.email)}</td>
            <td>${escapeHtml(emp.department)}</td>
            <td>${escapeHtml(emp.role)}</td>
            <td>${emp.hireDate}</td>
            <td>$${Number(emp.salary).toLocaleString()}</td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="editEmployee(${emp.id})">Edit</button>
                <button class="btn btn-sm btn-danger" onclick="removeEmployee(${emp.id})">Delete</button>
            </td>`;
        tbody.appendChild(tr);
    }
}

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// ===== Modal =====
function openModal(employee = null) {
    const modal = document.getElementById('modal-overlay');
    const title = document.getElementById('modal-title');
    const form = document.getElementById('employee-form');

    form.reset();
    document.getElementById('emp-id').value = '';

    if (employee) {
        title.textContent = 'Edit Employee';
        document.getElementById('emp-id').value = employee.id;
        document.getElementById('emp-name').value = employee.name;
        document.getElementById('emp-email').value = employee.email;
        document.getElementById('emp-department').value = employee.department;
        document.getElementById('emp-role').value = employee.role;
        document.getElementById('emp-hireDate').value = employee.hireDate;
        document.getElementById('emp-salary').value = employee.salary;
    } else {
        title.textContent = 'Add Employee';
    }

    modal.classList.remove('hidden');
}

function closeModal() {
    document.getElementById('modal-overlay').classList.add('hidden');
    document.getElementById('form-alert').classList.add('hidden');
}

async function handleSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('emp-id').value;
    const payload = {
        name: document.getElementById('emp-name').value.trim(),
        email: document.getElementById('emp-email').value.trim(),
        department: document.getElementById('emp-department').value.trim(),
        role: document.getElementById('emp-role').value.trim(),
        hireDate: document.getElementById('emp-hireDate').value,
        salary: parseFloat(document.getElementById('emp-salary').value),
    };

    const alertEl = document.getElementById('form-alert');

    try {
        if (id) {
            await apiFetch(`/employees/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
        } else {
            await apiFetch('/employees', { method: 'POST', body: JSON.stringify(payload) });
        }
        closeModal();
        loadEmployees();
    } catch (err) {
        const msg = err.data?.errors?.join(' ') || err.data?.error || 'Failed to save.';
        alertEl.textContent = msg;
        alertEl.className = 'alert alert-error';
        alertEl.classList.remove('hidden');
    }
}

async function editEmployee(id) {
    const emp = allEmployees.find(e => e.id === id);
    if (emp) openModal(emp);
}

async function removeEmployee(id) {
    if (!confirm('Are you sure you want to delete this employee?')) return;
    try {
        await apiFetch(`/employees/${id}`, { method: 'DELETE' });
        loadEmployees();
    } catch (err) {
        alert(err.data?.error || 'Failed to delete.');
    }
}
