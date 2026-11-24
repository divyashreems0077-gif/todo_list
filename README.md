# Lila — Full-Stack Todo List Application

A minimal, responsive full-stack task management web application built with **React**, **TypeScript**, **Tailwind CSS**, **Node.js**, and **Express**, using local JSON file persistence for development.

## Features

- **Authentication**: User registration, sign in, sign out, `bcryptjs` password hashing, and JWT Bearer token authentication.
- **User-Scoped Tasks**: Every API route verifies the caller's JWT and restricts reads, edits, toggles, and deletions strictly to the authenticated user's tasks.
- **Task CRUD & Filtering**: Create tasks with title and description, edit existing tasks, mark tasks as completed or pending, delete tasks with confirmation, and filter by **All**, **Pending**, or **Completed**, plus live search and sorting.
- **Dashboard Metrics**: Live counts for Total, Pending, and Completed tasks with completion percentage progress.
- **White & Lavender UI**: Minimalist single-elevation workspace with responsive sidebar navigation, skeleton loading states, empty states, and inline error handling.

## Project Structure

```
.
├── server.ts                      # Express entry point (mounts API + Vite/dist frontend on port 3000)
├── index.html                     # HTML entry point & fonts
├── package.json                   # Root dependencies & scripts
├── .env.example                   # Environment variable template
├── .gitignore                     # Ignores node_modules, dist, .env*, and runtime JSON files
├── backend/
│   ├── package.json               # Backend ESM configuration
│   ├── middleware/
│   │   ├── auth.ts                # JWT Bearer verification middleware
│   │   └── validate.ts            # Zod request body validation schemas
│   ├── routes/
│   │   ├── auth.ts                # /api/auth/register, /login, /me, /logout
│   │   └── tasks.ts               # /api/tasks GET, POST, PATCH/PUT, DELETE
│   ├── types/
│   │   └── index.ts               # Backend TypeScript interfaces
│   ├── utils/
│   │   ├── jwt.ts                 # JWT signing & verification utilities
│   │   └── storage.ts             # Modular JSON file storage repository
│   └── data/                      # Created automatically at runtime (users.json, tasks.json)
└── src/
    ├── App.tsx                    # Workspace shell & state orchestration
    ├── main.tsx                   # React root mount
    ├── index.css                  # Tailwind CSS v4 styles
    ├── api/
    │   └── client.ts              # Typed REST API client
    ├── types/
    │   └── todo.ts                # Frontend TypeScript interfaces
    └── components/
        ├── AuthView.tsx           # Login & registration form
        ├── Sidebar.tsx            # Desktop sidebar & mobile drawer navigation
        ├── SummaryStrip.tsx       # Dashboard task counters
        ├── TaskCard.tsx           # Individual task card with toggle/edit/delete
        ├── TaskModal.tsx          # Create & edit task modal
        └── DeleteConfirmModal.tsx # Delete confirmation modal
```

## Running Locally

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment variables** (optional):
   ```bash
   cp .env.example .env
   ```
   You may also set a persistent `JWT_SECRET` in `.env` so tokens remain valid across server restarts (if omitted, the server generates an ephemeral in-memory secret on startup).

3. **Start the full-stack development server**:
   ```bash
   npm run dev
   ```
   The Express API and React frontend will both be served at **http://localhost:3000**.

4. **Type-check and build for production**:
   ```bash
   npm run lint
   npm run build
   NODE_ENV=production npm start
   ```

## REST API Endpoints

| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| `POST` | `/api/auth/register` | Public | Create user account, hash password with bcrypt, return JWT |
| `POST` | `/api/auth/login` | Public | Verify credentials, return JWT |
| `GET` | `/api/auth/me` | Bearer JWT | Return current authenticated user profile |
| `POST` | `/api/auth/logout` | Bearer JWT | Acknowledge sign out |
| `GET` | `/api/tasks` | Bearer JWT | List tasks owned by the current user |
| `POST` | `/api/tasks` | Bearer JWT | Create a new task for the current user |
| `PATCH` / `PUT` | `/api/tasks/:id` | Bearer JWT | Update task title, description, or completion status |
| `DELETE` | `/api/tasks/:id` | Bearer JWT | Delete a task owned by the current user |

## Production & Vercel Deployment Notes

**Important: Local JSON file storage does not persist on Vercel.**

Vercel runs backend code inside ephemeral serverless functions with a read-only deployment bundle and transient `/tmp` storage. Any writes to `backend/data/users.json` or `backend/data/tasks.json` will fail in read-only directories or disappear between function invocations and deployments.

Before deploying to Vercel (or any serverless platform):

1. **Replace the JSON storage repository (`backend/utils/storage.ts`)**:
   All data access in this project is isolated behind `userRepository` and `taskRepository` in `backend/utils/storage.ts`. Keep the exact same method signatures (`findByEmail`, `findById`, `create`, `listByUser`, `updateForUser`, `deleteForUser`) and swap the implementation to a managed persistent database such as:
   - **PostgreSQL** (e.g., Neon, Vercel Postgres, RDS) via `pg` or Drizzle ORM
   - **LibSQL / Turso** via `@libsql/client`
   - **Redis / KV** (e.g., Upstash Redis) for simple key-value persistence
2. **Set a persistent `JWT_SECRET`**:
   Add a strong random `JWT_SECRET` in Vercel Project Settings -> Environment Variables so all serverless function instances share the same signing key.
3. **Adapt Express routing if deploying as Vercel Functions**:
   Export the Express `app` inside an `api/index.ts` handler for Vercel serverless routing, and let Vercel serve the Vite `dist/` build as static assets.
