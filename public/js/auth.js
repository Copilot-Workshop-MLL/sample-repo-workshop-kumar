document.addEventListener('DOMContentLoaded', async () => {
    // Only redirect if the stored token is still valid.
    const profile = await restoreSession();
    if (profile) {
        window.location.href = '/dashboard.html';
        return;
    }

    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const loginSection = document.getElementById('login-section');
    const registerSection = document.getElementById('register-section');
    const showRegister = document.getElementById('show-register');
    const showLogin = document.getElementById('show-login');
    const alertBox = document.getElementById('alert');

    function showAlert(message, type = 'error') {
        alertBox.textContent = message;
        alertBox.className = `alert alert-${type}`;
        alertBox.classList.remove('hidden');
        setTimeout(() => alertBox.classList.add('hidden'), 4000);
    }

    showRegister.addEventListener('click', (e) => {
        e.preventDefault();
        loginSection.classList.add('hidden');
        registerSection.classList.remove('hidden');
        alertBox.classList.add('hidden');
    });

    showLogin.addEventListener('click', (e) => {
        e.preventDefault();
        registerSection.classList.add('hidden');
        loginSection.classList.remove('hidden');
        alertBox.classList.add('hidden');
    });

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('login-username').value.trim();
        const password = document.getElementById('login-password').value;

        try {
            const data = await apiFetch('/auth/login', {
                method: 'POST',
                body: JSON.stringify({ username, password }),
                authRedirect: false,
            });
            setToken(data.token);
            setCurrentUser(username);
            window.location.href = '/dashboard.html';
        } catch (err) {
            showAlert(err.data?.error || 'Login failed.');
        }
    });

    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('reg-username').value.trim();
        const password = document.getElementById('reg-password').value;

        try {
            await apiFetch('/auth/register', {
                method: 'POST',
                body: JSON.stringify({ username, password }),
                authRedirect: false,
            });
            showAlert('Registration successful! Please log in.', 'success');
            registerSection.classList.add('hidden');
            loginSection.classList.remove('hidden');
        } catch (err) {
            showAlert(err.data?.error || 'Registration failed.');
        }
    });
});
