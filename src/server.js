const app = require('./app');

if (!process.env.JWT_SECRET) {
    console.error('Warning: JWT_SECRET not set. Using default (not for production).');
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Employee Management System running on http://localhost:${PORT}`);
});
