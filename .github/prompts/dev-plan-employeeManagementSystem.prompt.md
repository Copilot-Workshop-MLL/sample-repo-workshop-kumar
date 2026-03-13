# Employee Management System — Agent Development Plan

> Step-by-step implementation guide for coding agents.
> Each step is a self-contained, testable unit with clear inputs, outputs, and verification criteria.

## Prerequisites

- Existing repo with `auth.js`, `factorial.js`, their tests, and `package.json` (Express, JWT, Jest, supertest)
- Node.js 18+ installed
- `npm install` completed

## Conventions

- **Test-first**: write/run tests before moving to the next step
- **One module per step**: each step produces exactly one file
- **Verification gate**: every step ends with a command the agent must run to confirm success
- **No forward dependencies**: steps only depend on prior steps, never on later ones
- **Original files untouched**: `auth.js`, `auth.test.js`, `factorial.js`, `factorial.test.js` remain as-is

---

## Step 1 — User Store (extract from auth.js)

**File:** `src/models/user.store.js`

**Functions to implement:**

| Function | Signature | Returns | Notes |
|----------|-----------|---------|-------|
| `hashPassword` | `(password: string, salt: string) → string` | hex string | PBKDF2-SHA512, 100k iterations, 64-byte key |
| `createUser` | `(username: string, password: string) → void` | — | Generates random 16-byte salt, hashes password, stores in Map |
| `getUser` | `(username: string) → object \| undefined` | `{ username, password, salt }` | Lookup by key |
| `hasUser` | `(username: string) → boolean` | boolean | Existence check |

**Exports:** `{ users, hashPassword, createUser, getUser, hasUser }`

**Verification:**
```bash
node -e "
const { createUser, getUser, hasUser, hashPassword } = require('./src/models/user.store');
createUser('alice', 'pass123');
console.assert(hasUser('alice'), 'user should exist');
console.assert(!hasUser('bob'), 'bob should not exist');
const u = getUser('alice');
console.assert(u.username === 'alice', 'username match');
console.assert(hashPassword('pass123', u.salt) === u.password, 'password match');
console.log('✓ user.store.js OK');
"
```

---

## Step 2 — Employee Store

**File:** `src/models/employee.store.js`

**Functions to implement (in this order):**

| # | Function | Signature | Returns | Notes |
|---|----------|-----------|---------|-------|
| 1 | `createEmployee` | `(data) → employee` | Full employee with `id`, `createdAt`, `updatedAt` | Auto-increment ID starting at 1 |
| 2 | `getEmployee` | `(id: number) → employee \| null` | Single employee or null | |
| 3 | `getAllEmployees` | `() → employee[]` | Array of all employees | |
| 4 | `updateEmployee` | `(id: number, data) → employee \| null` | Updated employee or null if not found | Use `??` (nullish coalescing) for partial updates; update `updatedAt` |
| 5 | `deleteEmployee` | `(id: number) → boolean` | true if deleted, false if not found | |
| 6 | `searchEmployees` | `({ department?, role? }) → employee[]` | Filtered array | Case-insensitive comparison |
| 7 | `getStats` | `() → stats` | `{ total, averageSalary, byDepartment, byRole }` | `averageSalary` rounded to 2 decimal places; 0 when empty |
| 8 | `clearAll` | `() → void` | — | Resets Map and ID counter; used in tests |

**Employee shape:**
```js
{ id, name, email, department, role, hireDate, salary, createdAt, updatedAt }
```

**Verification:**
```bash
node -e "
const s = require('./src/models/employee.store');
const e1 = s.createEmployee({ name:'A', email:'a@b.com', department:'Eng', role:'Dev', hireDate:'2024-01-01', salary:80000 });
console.assert(e1.id === 1, 'first ID is 1');
console.assert(e1.createdAt, 'has createdAt');
const e2 = s.createEmployee({ name:'B', email:'b@b.com', department:'Sales', role:'Mgr', hireDate:'2024-06-01', salary:90000 });
console.assert(s.getAllEmployees().length === 2, '2 employees');
console.assert(s.getEmployee(1).name === 'A', 'get by id');
console.assert(s.getEmployee(999) === null, 'null for missing');
s.updateEmployee(1, { name:'A2', email:'a@b.com', department:'Eng', role:'Dev', hireDate:'2024-01-01', salary:85000 });
console.assert(s.getEmployee(1).name === 'A2', 'updated');
console.assert(s.searchEmployees({ department:'eng' }).length === 1, 'search case-insensitive');
const stats = s.getStats();
console.assert(stats.total === 2, 'stats total');
console.assert(stats.averageSalary === 87500, 'avg salary');
console.assert(s.deleteEmployee(1), 'delete returns true');
console.assert(!s.deleteEmployee(1), 'double delete returns false');
s.clearAll();
console.assert(s.getAllEmployees().length === 0, 'cleared');
console.log('✓ employee.store.js OK');
"
```

---

## Step 3 — Auth Middleware

**File:** `src/middleware/auth.middleware.js`

**Functions to implement:**

| Function | Signature | Behavior |
|----------|-----------|----------|
| `authenticateToken` | `(req, res, next)` | Extract `Bearer <token>` from `Authorization` header → verify with `jwt.verify` → attach `req.user` → call `next()`. Return 401 if no token, 403 if invalid/expired. |

**Exports:** `{ authenticateToken, JWT_SECRET }`

**Notes:**
- `JWT_SECRET` reads from `process.env.JWT_SECRET`, falls back to `'test-secret-do-not-use-in-production'`
- Token format: `Authorization: Bearer <token>` — use `startsWith('Bearer ')` then `.slice(7)`

**Verification:**
```bash
node -e "
const { authenticateToken, JWT_SECRET } = require('./src/middleware/auth.middleware');
console.assert(typeof authenticateToken === 'function', 'is function');
console.assert(typeof JWT_SECRET === 'string', 'JWT_SECRET is string');
console.log('✓ auth.middleware.js OK');
"
```

---

## Step 4 — Validation Middleware

**File:** `src/middleware/validation.middleware.js`

**Functions to implement:**

| Function | Signature | Behavior |
|----------|-----------|----------|
| `validateEmployee` | `(req, res, next)` | Validate `req.body` fields. Collect all errors into an array. If any, return `400 { errors: [...] }`. Otherwise `next()`. |

**Validation rules (each produces a distinct error string):**

| Field | Rule | Error message |
|-------|------|---------------|
| `name` | required, string, non-empty after trim | `'Name is required.'` |
| `email` | required, matches `/^[^\s@]+@[^\s@]+\.[^\s@]+$/` | `'A valid email is required.'` |
| `department` | required, string, non-empty after trim | `'Department is required.'` |
| `role` | required, string, non-empty after trim | `'Role is required.'` |
| `hireDate` | required, `Date.parse()` must not be `NaN` | `'A valid hire date is required.'` |
| `salary` | required, typeof `number`, > 0 | `'Salary must be a positive number.'` |

**Exports:** `{ validateEmployee }`

**Verification:**
```bash
node -e "
const { validateEmployee } = require('./src/middleware/validation.middleware');
// Simulate Express req/res/next
let result;
const res = { status: (s) => ({ json: (d) => { result = { status: s, body: d }; } }) };
validateEmployee({ body: {} }, res, () => { result = 'next'; });
console.assert(result.status === 400, 'empty body → 400');
console.assert(result.body.errors.length === 6, '6 errors for empty body');
result = null;
validateEmployee({ body: { name:'A', email:'a@b.com', department:'Eng', role:'Dev', hireDate:'2024-01-01', salary:50000 } }, res, () => { result = 'next'; });
console.assert(result === 'next', 'valid body → next()');
console.log('✓ validation.middleware.js OK');
"
```

---

## Step 5 — Auth Routes

**File:** `src/routes/auth.routes.js`

**Depends on:** Step 1 (user.store), Step 3 (auth.middleware for `JWT_SECRET`)

**Endpoints to implement:**

| # | Method | Path | Auth? | Request body | Response | Status |
|---|--------|------|-------|-------------|----------|--------|
| 1 | POST | `/register` | No | `{ username, password }` | `{ message }` | 201 / 400 / 409 |
| 2 | POST | `/login` | No | `{ username, password }` | `{ token }` | 200 / 400 / 401 |
| 3 | GET | `/profile` | Yes* | — | `{ username }` | 200 |

*Profile auth is applied at the app level (Step 7), not in this router.

**Implementation order:**
1. `POST /register` — validate input → check duplicate → `createUser()` → 201
2. `POST /login` — validate input → `getUser()` → `hashPassword()` compare → `jwt.sign()` → return token
3. `GET /profile` — read `req.user.username` → return it

**Token config:** `jwt.sign({ username }, JWT_SECRET, { expiresIn: '1h' })`

**Exports:** Express `Router`

**Verification:** Deferred to Step 9 (tests), but can smoke test:
```bash
node -e "
const r = require('./src/routes/auth.routes');
console.assert(typeof r === 'function', 'exports router');
console.log('✓ auth.routes.js OK');
"
```

---

## Step 6 — Employee Routes

**File:** `src/routes/employee.routes.js`

**Depends on:** Step 2 (employee.store), Step 4 (validation middleware)

**Endpoints to implement (in this exact order — `/stats` before `/:id`):**

| # | Method | Path | Middleware | Response | Status codes |
|---|--------|------|-----------|----------|-------------|
| 1 | GET | `/stats` | — | `{ total, averageSalary, byDepartment, byRole }` | 200 |
| 2 | GET | `/` | — | `employee[]` | 200 |
| 3 | GET | `/:id` | — | `employee` | 200 / 400 / 404 |
| 4 | POST | `/` | `validateEmployee` | `employee` | 201 / 400 |
| 5 | PUT | `/:id` | `validateEmployee` | `employee` | 200 / 400 / 404 |
| 6 | DELETE | `/:id` | — | (empty) | 204 / 400 / 404 |

**Key implementation details:**
- `GET /` supports `?department=X&role=Y` query params → delegates to `searchEmployees()` if either present
- `/:id` routes must `parseInt(req.params.id, 10)` and check `isNaN()` → 400
- Auth is applied at the app level (Step 7), not in this router
- `/stats` must be declared **before** `/:id` to avoid Express matching `"stats"` as an ID

**Exports:** Express `Router`

**Verification:**
```bash
node -e "
const r = require('./src/routes/employee.routes');
console.assert(typeof r === 'function', 'exports router');
console.log('✓ employee.routes.js OK');
"
```

---

## Step 7 — App Setup (wiring)

**File:** `src/app.js`

**Depends on:** Steps 3, 5, 6

**Implementation order:**
1. Create Express app
2. `app.use(express.json())`
3. `app.use(express.static(path.join(__dirname, '..', 'public')))` — serve frontend
4. Mount `/api/auth` with conditional auth (only `/profile` needs `authenticateToken`)
5. Mount `/api/employees` with `authenticateToken` applied to all routes
6. `module.exports = app` (no `.listen()` here)

**Auth routing detail:**
```js
app.use('/api/auth', (req, res, next) => {
    if (req.path === '/profile') return authenticateToken(req, res, next);
    next();
}, authRoutes);

app.use('/api/employees', authenticateToken, employeeRoutes);
```

**Exports:** `app`

**Verification:**
```bash
node -e "
const app = require('./src/app');
console.assert(typeof app === 'function', 'exports express app');
console.assert(typeof app.listen === 'function', 'has listen method');
console.log('✓ app.js OK');
"
```

---

## Step 8 — Server Entry Point

**File:** `src/server.js`

**Depends on:** Step 7

**Implementation:**
- Require `./app`
- Log warning if `JWT_SECRET` env var is not set
- Listen on `process.env.PORT || 3000`
- Log startup message

**This file is never required by tests** — it only runs via `npm start`.

**Verification:**
```bash
node -e "
// Just check it parses without error (don't actually listen)
delete require.cache[require.resolve('./src/server')];
// We can't import it without starting the server, so just verify app.js works
const app = require('./src/app');
console.log('✓ server.js dependencies OK');
"
```

---

## Step 9 — Auth Route Tests

**File:** `src/routes/__tests__/auth.routes.test.js`

**Depends on:** Steps 5, 7

**Test suites and cases (11 tests total):**

### Suite: `POST /api/auth/register`
| # | Test name | Setup | Assert |
|---|-----------|-------|--------|
| 1 | registers a new user successfully | send `{ username, password }` | 201, `message` field |
| 2 | returns 400 when username is missing | send `{ password }` | 400, error message |
| 3 | returns 400 when password is missing | send `{ username }` | 400, error message |
| 4 | returns 409 when username already exists | register twice | 409, error message |

### Suite: `POST /api/auth/login`
| # | Test name | Setup | Assert |
|---|-----------|-------|--------|
| 5 | returns a JWT token for valid credentials | register then login | 200, `token` defined, decode matches username |
| 6 | returns 401 for wrong password | register, login with wrong pw | 401, error message |
| 7 | returns 401 for non-existent user | login unknown user | 401, error message |
| 8 | returns 400 when fields are missing | send `{}` | 400, error message |

### Suite: `GET /api/auth/profile`
| # | Test name | Setup | Assert |
|---|-----------|-------|--------|
| 9 | returns user profile with valid token | register → login → get profile with Bearer token | 200, `username` field |
| 10 | returns 401 without token | GET without header | 401 |
| 11 | returns 403 with invalid token | set `Bearer invalid-token` | 403 |

**Verification:**
```bash
npx jest src/routes/__tests__/auth.routes.test.js --verbose
# Expect: 3 suites, 11 tests, all passing
```

---

## Step 10 — Employee Route Tests

**File:** `src/routes/__tests__/employee.routes.test.js`

**Depends on:** Steps 6, 7, 9 (for auth token setup pattern)

**Setup:**
- `beforeAll`: register + login to get a JWT token
- `beforeEach`: call `employeeStore.clearAll()` to reset state between tests

**Test data:**
```js
const validEmployee = {
    name: 'Jane Doe', email: 'jane@example.com',
    department: 'Engineering', role: 'Developer',
    hireDate: '2024-01-15', salary: 85000,
};
```

**Test suites and cases (19 tests total):**

### Suite: `POST /api/employees` (5 tests)
| # | Test | Assert |
|---|------|--------|
| 1 | creates an employee | 201, has `id`, `name`, `createdAt` |
| 2 | returns 400 for missing fields | 400, `errors` array non-empty |
| 3 | returns 400 for invalid email | 400, errors contains email message |
| 4 | returns 400 for negative salary | 400, errors contains salary message |
| 5 | returns 401 without token | 401 |

### Suite: `GET /api/employees` (5 tests)
| # | Test | Setup | Assert |
|---|------|-------|--------|
| 6 | returns all employees | create 2 | 200, length 2 |
| 7 | filters by department | create 2 diff depts | 200, length 1, correct dept |
| 8 | filters by role | create 2 diff roles | 200, length 1, correct role |
| 9 | filters by department AND role | create 2 | 200, length 1 |
| 10 | returns empty array for non-matching filter | create 1 | 200, length 0 |

### Suite: `GET /api/employees/:id` (3 tests)
| # | Test | Assert |
|---|------|--------|
| 11 | returns a single employee | 200, correct name |
| 12 | returns 404 for non-existent ID | 404 |
| 13 | returns 400 for invalid ID (`abc`) | 400 |

### Suite: `PUT /api/employees/:id` (3 tests)
| # | Test | Assert |
|---|------|--------|
| 14 | updates an employee | 200, new name + salary, `updatedAt` present |
| 15 | returns 404 for non-existent ID | 404 |
| 16 | returns 400 for invalid data | 400 |

### Suite: `DELETE /api/employees/:id` (2 tests)
| # | Test | Assert |
|---|------|--------|
| 17 | deletes an employee | 204, then GET → 404 |
| 18 | returns 404 for non-existent ID | 404 |

### Suite: `GET /api/employees/stats` (2 tests)
| # | Test | Assert |
|---|------|--------|
| 19 | returns empty stats when no employees | 200, `total: 0, averageSalary: 0` |
| 20 | returns correct stats | create 2 → check total, averageSalary, byDepartment, byRole |

**Verification:**
```bash
npx jest src/routes/__tests__/employee.routes.test.js --verbose
# Expect: 6 suites, ~20 tests, all passing
```

---

## Step 11 — Update package.json

**File:** `package.json` (edit, not create)

**Changes:**
```json
"scripts": {
  "start": "node src/server.js",
  "dev": "node --watch src/server.js",
  "test": "jest",
  "test:watch": "jest --watch",
  "test:coverage": "jest --coverage"
}
```

**Verification:**
```bash
npm test
# Expect: 4 suites (auth.test.js, factorial.test.js, auth.routes.test.js, employee.routes.test.js)
# All passing, 0 failures
```

---

## Step 12 — Frontend: API Helper

**File:** `public/js/api.js`

**Functions to implement:**

| Function | Purpose |
|----------|---------|
| `getToken()` | Read JWT from `localStorage` |
| `setToken(token)` | Write JWT to `localStorage` |
| `clearToken()` | Remove JWT from `localStorage` |
| `isLoggedIn()` | Returns `!!getToken()` |
| `apiFetch(path, options)` | Fetch wrapper: injects `Authorization` header, handles 401/403 redirect, parses JSON, returns `null` on 204 |
| `requireAuth()` | Redirect to `/` if not logged in |

**No exports** — these are globals loaded via `<script>` tag.

**Verification:** Manual — load in browser console after Step 15.

---

## Step 13 — Frontend: Auth Page

**Files:** `public/index.html`, `public/js/auth.js`

**`index.html` structure:**
- `<div class="auth-wrapper">` → `<div class="auth-card">`
- Login form: `#login-form` with `#login-username`, `#login-password`
- Register form: `#register-form` with `#reg-username`, `#reg-password` (initially `.hidden`)
- Toggle links: `#show-register`, `#show-login`
- Alert area: `#alert`
- Scripts: `api.js`, `auth.js`

**`auth.js` behavior:**
1. On load: if `isLoggedIn()`, redirect to `/dashboard.html`
2. Toggle between login/register sections
3. Login submit → `apiFetch('/auth/login', ...)` → `setToken()` → redirect
4. Register submit → `apiFetch('/auth/register', ...)` → show success → switch to login
5. Error display with 4-second auto-hide

**Verification:** Start server (`npm start`), open `http://localhost:3000`, register, log in, verify redirect to dashboard.

---

## Step 14 — Frontend: Dashboard

**Files:** `public/dashboard.html`, `public/js/dashboard.js`

**`dashboard.html` structure:**
- Navbar: brand + links (Dashboard, Employees) + Logout button (`#logout-btn`)
- Stats grid: `#total-employees`, `#avg-salary`
- Breakdown cards: `#dept-breakdown`, `#role-breakdown` (each a `<ul class="breakdown-list">`)
- Scripts: `api.js`, `dashboard.js`

**`dashboard.js` behavior:**
1. On load: `requireAuth()`, call `loadStats()`
2. `loadStats()` → `apiFetch('/employees/stats')` → populate stat cards + breakdown lists
3. `renderBreakdown(elementId, data)` → sorted `<li>` items with label + count
4. Logout button → `clearToken()` → redirect to `/`

**Verification:** After login, navigate to `/dashboard.html`. Verify stats render (initially zeros). Add employees via API (`curl`), refresh, verify stats update.

---

## Step 15 — Frontend: Employees Page

**Files:** `public/employees.html`, `public/js/employees.js`

**`employees.html` structure:**
- Navbar (same as dashboard)
- Header row: `<h2>Employees</h2>` + `#add-btn`
- Filters: `#filter-dept` (select), `#filter-role` (select), `#clear-filters` (button)
- Table: `#employee-tbody` with 8 columns (ID, Name, Email, Department, Role, Hire Date, Salary, Actions)
- Modal: `#modal-overlay` (initially `.hidden`) → `#employee-form` with fields (`#emp-id` hidden, `#emp-name`, `#emp-email`, `#emp-department`, `#emp-role`, `#emp-hireDate`, `#emp-salary`) + Cancel/Save buttons

**`employees.js` behavior:**
1. On load: `requireAuth()`, `loadEmployees()`
2. `loadEmployees()` → `apiFetch('/employees')` → store in `allEmployees` → `populateFilterOptions()` → `renderTable()`
3. `renderTable(employees)` → build `<tr>` rows with **HTML-escaped** values + Edit/Delete buttons
4. `escapeHtml(str)` → uses `document.createElement('div').textContent = str` pattern (XSS prevention)
5. `populateFilterOptions()` → extract unique departments/roles → fill `<select>` options
6. `applyFilters()` → client-side filter from `allEmployees`
7. `openModal(employee?)` → fill form for edit or clear for add
8. `handleSubmit()` → POST (create) or PUT (update) → close modal → reload
9. `removeEmployee(id)` → `confirm()` → DELETE → reload

**Verification:** Start server, log in, add employees, verify table renders. Edit an employee, verify change. Delete with confirmation. Filter by department/role. Resize to mobile width, verify responsive layout.

---

## Step 16 — Frontend: Styles

**File:** `public/css/styles.css`

**Sections to implement (in order):**

| # | Section | Key properties |
|---|---------|----------------|
| 1 | Reset & Base | `box-sizing: border-box`, system font stack, `#f0f2f5` background |
| 2 | Navbar | `#1a1a2e` background, sticky, flex between brand + nav |
| 3 | Layout | `.container` max-width 1100px, centered |
| 4 | Stats grid | CSS Grid `auto-fit minmax(220px, 1fr)` |
| 5 | Auth forms | `.auth-wrapper` centered flex, `.auth-card` white box shadow |
| 6 | Form inputs | Full-width, focus ring `#4361ee` |
| 7 | Buttons | `.btn-primary` (#4361ee), `.btn-success` (#2a9d8f), `.btn-danger` (#e63946) |
| 8 | Alerts | `.alert-error` (red), `.alert-success` (green) |
| 9 | Table | Collapsed borders, hover row highlight, `overflow-x: auto` |
| 10 | Modal | Fixed overlay, centered white card, scrollable |
| 11 | Responsive | `@media (max-width: 768px)`: stack navbar, 2-col stats. `@media (max-width: 480px)`: 1-col stats, smaller table padding |

**Verification:** Open each page at various widths (1200px, 768px, 480px). All content should be accessible and readable.

---

## Full Test Run — Final Gate

```bash
npm test
```

**Expected output:**
```
 PASS  src/routes/__tests__/employee.routes.test.js
 PASS  src/routes/__tests__/auth.routes.test.js
 PASS  ./auth.test.js
 PASS  ./factorial.test.js

Test Suites: 4 passed, 4 total
Tests:       65 passed, 65 total
```

---

## Dependency Graph

```
Step 1  user.store ──────────┐
Step 2  employee.store ──┐   │
Step 3  auth.middleware ──┤   │
Step 4  validation.mw ───┤   │
                          │   │
Step 5  auth.routes ──────┤←──┘ (needs Step 1, 3)
Step 6  employee.routes ──┤←──── (needs Step 2, 4)
                          │
Step 7  app.js ───────────┤←──── (needs Step 3, 5, 6)
Step 8  server.js ────────┤←──── (needs Step 7)
                          │
Step 9  auth tests ───────┤←──── (needs Step 7)
Step 10 employee tests ───┤←──── (needs Step 7)
Step 11 package.json ─────┘
                          
Step 12 api.js ───────────┐
Step 13 auth page ────────┤←──── (needs Step 12)
Step 14 dashboard page ───┤←──── (needs Step 12)
Step 15 employees page ───┤←──── (needs Step 12)
Step 16 styles ───────────┘      (independent)
```

**Parallelizable groups:**
- Steps 1–4 (all independent)
- Steps 5–6 (independent of each other, depend on 1–4)
- Steps 9–10 (independent of each other, depend on 7)
- Steps 12, 16 (independent)
- Steps 13–15 (independent of each other, depend on 12)
