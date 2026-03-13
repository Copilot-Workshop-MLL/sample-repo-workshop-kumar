document.addEventListener('DOMContentLoaded', async () => {
    const profile = await requireAuth();
    if (!profile) {
        return;
    }

    renderGreeting(profile.username);
    loadStats();

    document.getElementById('logout-btn').addEventListener('click', () => {
        clearSession();
        window.location.href = '/';
    });
});

function renderGreeting(username) {
    document.getElementById('welcome-title').textContent = `Hey ${username}, how are you doing today?`;
    document.getElementById('welcome-subtitle').textContent =
        'Welcome back to your employee dashboard.';
}

async function loadStats() {
    try {
        const stats = await apiFetch('/employees/stats');
        document.getElementById('total-employees').textContent = stats.total;
        document.getElementById('avg-salary').textContent =
            stats.averageSalary ? `$${stats.averageSalary.toLocaleString()}` : '$0';

        renderBreakdown('dept-breakdown', stats.byDepartment);
        renderBreakdown('role-breakdown', stats.byRole);
    } catch (err) {
        console.error('Failed to load stats', err);
    }
}

function renderBreakdown(elementId, data) {
    const list = document.getElementById(elementId);
    list.innerHTML = '';
    const entries = Object.entries(data);
    if (entries.length === 0) {
        list.innerHTML = '<li><span>No data yet</span><span>—</span></li>';
        return;
    }
    for (const [key, count] of entries.sort((a, b) => b[1] - a[1])) {
        const li = document.createElement('li');
        li.innerHTML = `<span>${key}</span><span>${count}</span>`;
        list.appendChild(li);
    }
}
