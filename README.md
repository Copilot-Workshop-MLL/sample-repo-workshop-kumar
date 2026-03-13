# Employee Management System

A small full-stack Employee Management System built with Express, JWT authentication, and a vanilla HTML/CSS/JavaScript frontend.

The application supports user registration and login, a post-login dashboard, employee CRUD operations, filtering, and test coverage for both core logic and API behavior.

## Features

- User registration and login with JWT-based authentication
- Session-aware frontend that validates stored tokens before redirecting
- Friendly dashboard landing page with greeting, summary cards, and breakdown stats
- Employee create, read, update, and delete operations
- Search and filtering by department and role
- Input validation for employee data
- Unit tests for models and middleware
- Route tests for authentication and employee APIs

## Tech stack

- Backend: Node.js + Express
- Frontend: Vanilla HTML, CSS, and JavaScript
- Authentication: JSON Web Tokens (`jsonwebtoken`)
- Testing: Jest + Supertest
- Storage: In-memory Maps for users and employees

## Project structure

```text
.
├── .github/
│   └── agents/
│       ├── code-reviewer-agent.md
│       ├── readme-creator-agent.md
│       └── test-writer-agent.md
├── public/
│   ├── index.html
│   ├── dashboard.html
│   ├── employees.html
│   ├── css/
│   │   └── styles.css
│   └── js/
│       ├── api.js
│       ├── auth.js
│       ├── dashboard.js
│       └── employees.js
├── src/
│   ├── app.js
│   ├── server.js
│   ├── middleware/
│   │   ├── auth.middleware.js
│   │   └── validation.middleware.js
│   ├── models/
│   │   ├── user.store.js
│   │   ├── employee.store.js
│   │   └── __tests__/
│   └── routes/
│       ├── auth.routes.js
│       ├── employee.routes.js
│       └── __tests__/
├── docs/
│   └── current-application.md
├── README.md
└── package.json
```

## Getting started

### 1. Install dependencies

```bash
npm install
```

### 2. Start the application

```bash
npm start
```

The server runs on `http://localhost:3000` by default.

### 3. Use the application

1. Open `http://localhost:3000`
2. Register a new user or log in with an existing one
3. After login, you will land on the dashboard
4. Open the Employees page to manage employee records

## Available scripts

```bash
npm start
```

Starts the production server.

```bash
npm run dev
```

Starts the server in watch mode.

```bash
npm test
```

Runs the full Jest suite, including unit tests and route tests.

```bash
npm run test:unit
```

Runs only the unit tests for core business logic and middleware.

```bash
npm run test:watch
```

Runs tests in watch mode.

```bash
npm run test:coverage
```

Generates a coverage report.

## Test coverage

### Unit tests

- User store behavior, including password hashing and in-memory persistence
- Employee store behavior, including CRUD operations, filtering, and stats aggregation
- JWT auth middleware behavior for valid, missing, and invalid tokens
- Employee validation middleware behavior for valid and invalid payloads

### Route tests

- Authentication endpoints: register, login, profile
- Employee endpoints: CRUD, filtering, auth protection, and stats

## API overview

### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/profile`

### Employees

- `GET /api/employees/stats`
- `GET /api/employees`
- `GET /api/employees/:id`
- `POST /api/employees`
- `PUT /api/employees/:id`
- `DELETE /api/employees/:id`

## Documentation

- Application walkthrough, user flow, and sequence diagrams: [docs/current-application.md](docs/current-application.md)
- Development implementation plan: [plan.md](plan.md)

## Custom agents

This repository also includes project-scoped agent definition files under `.github/agents/`.

- `code-reviewer-agent.md` is intended for review-focused workflows
- `readme-creator-agent.md` is intended for documentation and README updates
- `test-writer-agent.md` is intended for generating and improving automated tests

These files can be used to standardize how coding agents behave when working on this repository.

## Current limitations

- Data is stored in memory, so it resets when the server restarts
- There is no database persistence yet
- There are no user roles or permissions beyond basic authentication

## Notes for development

- The login page validates any stored token before redirecting to avoid stale-session loops
- The dashboard acts as the landing page after login
- Logout clears the local session and returns the user to the login page