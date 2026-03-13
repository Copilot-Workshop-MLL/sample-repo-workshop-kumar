# Plan: Employee Management System

## TL;DR
Build a full-stack Employee Management System on top of the existing Express + JWT auth codebase. Uses organized folder structure, in-memory data store, vanilla HTML/CSS/JS frontend served by Express, and RESTful API. Extends the existing `auth.js` authentication to protect employee CRUD routes.

## Architecture Overview

```
Backend:  Express.js REST API (extends existing auth.js)
Frontend: Vanilla HTML/CSS/JS (served statically by Express)
Auth:     JWT-based (reuse existing authenticateToken middleware from auth.js)
Storage:  In-memory Map (consistent with current user store pattern)
Testing:  Jest + supertest (existing setup)
Session:  localStorage token + username, validated through /api/auth/profile before redirecting
```

## Steps

### Phase 1: Project Restructuring
> Goal: Move from flat files to organized folder structure. No logic changes.

1. Create folder structure:
   ```
   src/
     app.js              ← Express app setup (middleware, route mounting)
     server.js           ← Entry point (listen only, uses app.js)
     routes/
       auth.routes.js    ← Auth endpoints (extracted from auth.js)
       employee.routes.js ← Employee CRUD + search endpoints
     middleware/
       auth.middleware.js ← authenticateToken (extracted from auth.js)
       validation.middleware.js ← Input validation for employee fields
     models/
       user.store.js     ← In-memory user Map + hashPassword (extracted from auth.js)
       employee.store.js ← In-memory employee Map + CRUD operations
   public/
     index.html          ← Login / Register page
     dashboard.html      ← Dashboard with stats
     employees.html      ← Employee list, search, CRUD forms
     css/
       styles.css        ← Responsive styles (flexbox/grid, mobile-first)
     js/
       api.js            ← Fetch wrapper with JWT header injection
       auth.js           ← Login/register/logout UI logic
       dashboard.js      ← Dashboard stats rendering
       employees.js      ← Employee CRUD + search UI logic
   ```

2. Extract from existing `auth.js`:
   - `authenticateToken` → `src/middleware/auth.middleware.js`
   - `users` Map + `hashPassword` → `src/models/user.store.js`
   - Register/Login/Profile routes → `src/routes/auth.routes.js`
   - Express app setup → `src/app.js`
   - Server listen → `src/server.js`

3. Update `package.json`:
   - Add `"start": "node src/server.js"` script
   - Add `"dev": "node --watch src/server.js"` (Node 18+ built-in watch)

4. Keep original `auth.js`, `factorial.js` and their test files untouched (workshop reference)

### Phase 2: Employee Data Model & Store (*parallel with Phase 3*)
> Goal: Define employee data operations

5. Create `src/models/employee.store.js` with:
   - In-memory `Map` keyed by auto-incrementing ID
   - Functions: `createEmployee(data)`, `getEmployee(id)`, `getAllEmployees()`, `updateEmployee(id, data)`, `deleteEmployee(id)`, `searchEmployees({ department, role })`
   - Employee shape: `{ id, name, email, department, role, hireDate, salary, createdAt, updatedAt }`
   - ID generation via incrementing counter

### Phase 3: Input Validation Middleware (*parallel with Phase 2*)
> Goal: Validate employee input at the middleware level

6. Create `src/middleware/validation.middleware.js`:
   - `validateEmployee(req, res, next)` — validates required fields (name, email, department, role, hireDate, salary)
   - Email format validation (reuse `validateEmail` regex pattern from factorial.js)
   - Salary must be a positive number
   - hireDate must be a valid date string
   - Returns 400 with specific field errors

### Phase 4: Employee API Routes (*depends on Phase 2 & 3*)
> Goal: RESTful endpoints for employee CRUD + search

7. Create `src/routes/employee.routes.js`:
   - `POST   /api/employees`       — Create employee (auth + validation)
   - `GET    /api/employees`       — List all employees (auth), supports `?department=X&role=Y` query filters
   - `GET    /api/employees/:id`   — Get single employee (auth)
   - `PUT    /api/employees/:id`   — Update employee (auth + validation)
   - `DELETE /api/employees/:id`   — Delete employee (auth)
   - `GET    /api/employees/stats` — Dashboard stats: total count, department breakdown, role breakdown, avg salary (auth)
   - All routes protected by `authenticateToken` middleware

8. Mount in `src/app.js`:
   - `app.use('/api/auth', authRoutes)`
   - `app.use('/api/employees', employeeRoutes)`
   - `app.use(express.static('public'))` for frontend

### Phase 5: Frontend — Auth Pages (*parallel with Phase 6*)
> Goal: Login/register UI

9. Create `public/index.html`:
   - Login form (username + password)
   - Register form (toggle-able)
  - On success, store JWT + username in localStorage, redirect to dashboard
  - Do not auto-redirect just because a token exists; validate it first to avoid redirect loops
   - Responsive layout

10. Create `public/js/api.js`:
    - `apiFetch(url, options)` — wrapper around fetch that injects `Authorization: Bearer <token>` header
  - Handles 401/403 by redirecting to login for protected pages only
  - Supports `authRedirect: false` for `/api/auth/login` and `/api/auth/register`
  - Stores current username and exposes a helper to restore/validate session from `/api/auth/profile`
    - JSON parsing helper

11. Create `public/js/auth.js`:
    - Login/register form handlers
    - Logout (clear localStorage, redirect)

### Phase 6: Frontend — Dashboard & Employee Management (*parallel with Phase 5 for HTML/CSS, depends on Phase 5 for api.js*)
> Goal: Main application UI

12. Create `public/dashboard.html`:
  - Friendly landing section saying `Hey <username>, how are you doing today?`
    - Stats cards: total employees, department breakdown, average salary
    - Navigation to employee list
    - Fetches from `/api/employees/stats`

13. Create `public/employees.html`:
    - Employee table with all fields
    - Search/filter bar (department dropdown, role dropdown)
    - Add Employee modal/form
    - Edit Employee (inline or modal)
    - Delete with confirmation
    - Fetches from `/api/employees` endpoints

14. Create `public/css/styles.css`:
    - Mobile-first responsive design
    - CSS Grid/Flexbox layout
    - Form styling, table styling, modal styling
    - Navigation bar

15. Create `public/js/dashboard.js` and `public/js/employees.js`:
  - DOM manipulation for rendering data and signed-in user state
    - Event handlers for CRUD operations
    - Search/filter logic (client-side filtering + API query params)

### Phase 7: Testing (*depends on Phase 4*)
> Goal: API test coverage

16. Create `src/routes/__tests__/employee.routes.test.js`:
    - Test all CRUD operations (create, read, update, delete)
    - Test search/filter by department and role
    - Test stats endpoint
    - Test auth protection (401 without token)
    - Test validation errors (400 for invalid input)
    - Follow existing patterns from `auth.test.js` (supertest + Jest)

17. Create `src/routes/__tests__/auth.routes.test.js`:
    - Migrate/adapt existing `auth.test.js` tests to work with the restructured code
    - Ensure backward compatibility

## Relevant Files

### Existing files to reuse/reference
- `auth.js` — Extract `authenticateToken`, `hashPassword`, user `Map`, routes into separate modules
- `auth.test.js` — Reference testing patterns (supertest assertions, beforeAll setup)
- `factorial.js` — Reuse `validateEmail` regex pattern in validation middleware
- `package.json` — Add new scripts, no new dependencies needed (Express, JWT, Jest, supertest already present)

### New files to create
- `src/app.js` — Express app configuration, middleware, route mounting
- `src/server.js` — Server entry point
- `src/routes/auth.routes.js` — Auth routes (extracted from auth.js)
- `src/routes/employee.routes.js` — Employee CRUD + search + stats routes
- `src/middleware/auth.middleware.js` — JWT auth middleware (extracted from auth.js)
- `src/middleware/validation.middleware.js` — Employee input validation
- `src/models/user.store.js` — User data store (extracted from auth.js)
- `src/models/employee.store.js` — Employee data store with CRUD + search functions
- `public/index.html` — Login/register page
- `public/dashboard.html` — Stats dashboard
- `public/employees.html` — Employee list + CRUD UI
- `public/css/styles.css` — Responsive styles
- `public/js/api.js` — Fetch wrapper with auth
- `public/js/auth.js` — Auth UI logic
- `public/js/dashboard.js` — Dashboard rendering
- `public/js/employees.js` — Employee management UI

## Verification

1. Run `npm test` — all existing tests in `auth.test.js` and `factorial.test.js` still pass (originals untouched)
2. Run `npm test` — new employee route tests pass (CRUD, search, validation, auth protection)
3. Manual: Start server with `npm start`, register a user, login, verify JWT returned
4. Manual: Create, read, update, delete employees via the UI
5. Manual: Filter by department and role, verify results
6. Manual: Check dashboard stats update after adding/removing employees
7. Manual: Resize browser to mobile width, verify responsive layout
8. Manual: Access `/api/employees` without token, verify 401 response

## Decisions
- **Keep original files**: `auth.js`, `auth.test.js`, `factorial.js`, `factorial.test.js` remain untouched as workshop reference material
- **In-memory storage**: Data resets on server restart — acceptable for a workshop/demo project
- **No new dependencies**: Everything achievable with existing Express, JWT, Jest, supertest
- **Vanilla frontend**: No build step, no framework — keeps focus on fundamentals, served directly by Express static middleware
- **Stats endpoint separate from list**: `/api/employees/stats` is a dedicated route to avoid computing aggregations on every list request
- **Session validation before redirect**: the frontend should validate stored tokens via `/api/auth/profile` before sending users to the dashboard, preventing refresh loops after failed or expired logins
- **Friendly landing page**: the dashboard doubles as a post-login landing page and should greet the user by username while keeping logout accessible

## Further Considerations
1. **Database persistence**: If data persistence is needed later, the `employee.store.js` module can be swapped for SQLite (via `better-sqlite3`) with the same interface — the route layer won't change.
2. **Role-based access control**: Currently any authenticated user can perform any operation. Could add admin vs. viewer roles by extending the JWT payload and adding a `requireRole('admin')` middleware.
3. **Pagination**: The `GET /api/employees` endpoint returns all employees. For larger datasets, add `?page=1&limit=20` query params — but unnecessary for a workshop demo.
