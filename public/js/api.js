const API_BASE = '/api';

function getToken() {
    return localStorage.getItem('token');
}

function getCurrentUser() {
    return localStorage.getItem('username');
}

function setToken(token) {
    localStorage.setItem('token', token);
}

function setCurrentUser(username) {
    localStorage.setItem('username', username);
}

function clearToken() {
    localStorage.removeItem('token');
}

function clearSession() {
    clearToken();
    localStorage.removeItem('username');
}

function isLoggedIn() {
    return !!getToken();
}

async function apiFetch(path, options = {}) {
    const { authRedirect = true, ...fetchOptions } = options;
    const headers = { 'Content-Type': 'application/json', ...options.headers };
    const token = getToken();
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${API_BASE}${path}`, { ...fetchOptions, headers });

    if (res.status === 401 || res.status === 403) {
        if (authRedirect) {
            clearSession();
            if (window.location.pathname !== '/') {
                window.location.href = '/';
            }
        }

        const errorData = res.status === 204 ? null : await res.json().catch(() => null);
        throw { status: res.status, data: errorData };
    }

    if (res.status === 204) return null;

    const data = await res.json();
    if (!res.ok) {
        throw { status: res.status, data };
    }
    return data;
}

async function restoreSession() {
    if (!getToken()) {
        return null;
    }

    try {
        const profile = await apiFetch('/auth/profile', { authRedirect: false });
        setCurrentUser(profile.username);
        return profile;
    } catch (err) {
        clearSession();
        return null;
    }
}

async function requireAuth() {
    if (!isLoggedIn()) {
        window.location.href = '/';
        return null;
    }

    const profile = await restoreSession();
    if (!profile) {
        window.location.href = '/';
        return null;
    }

    return profile;
}
