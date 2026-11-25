# System Architecture — Transparent Local Governance & Budgeting (CivicLedger)

> **Data Disclaimer:** All initial seeded datasets in this system represent clearly labeled **sample / demonstration municipal data** and must not be interpreted as real-world government expenditure.

---

## 1. System Architecture Diagram

```mermaid
flowchart LR
    subgraph Client["Client Layer (React + Vite + Tailwind + Recharts)"]
        Visitor["Public Visitor"]
        Citizen["Registered Citizen"]
        Admin["Government Administrator"]
        UI["React SPA (16 Pages, AuthContext, Axios)"]
        Visitor --> UI
        Citizen --> UI
        Admin --> UI
    end

    subgraph API["Application Layer (Node.js + Express REST API)"]
        Sec["Helmet + CORS + Rate Limiter"]
        AuthMW["JWT & Role Authorization Middleware"]
        Routes["Express Route Handlers (/api/*)"]
        Ctrl["Business Logic Controllers"]
        Upload["Multer File Upload Handler"]
        CSV["CSV Export Utility"]
        Err["Centralized Error Handler"]
        Sec --> AuthMW --> Routes --> Ctrl
        Routes --> Upload
        Ctrl --> CSV
        Ctrl --> Err
    end

    subgraph Data["Data Layer (MongoDB / Mongoose)"]
        Users[(Users)]
        Depts[(Departments)]
        Budgets[(Budgets)]
        Exps[(Expenditures)]
        Props[(Proposals)]
        Votes[(Votes)]
        Projs[(Projects)]
        FB[(Feedback)]
        Notif[(Notifications)]
    end

    UI <-->|"HTTPS / JSON + Bearer JWT"| Sec
    Ctrl <-->|"Mongoose ODM"| Users
    Ctrl <-->|"Mongoose ODM"| Depts
    Ctrl <-->|"Mongoose ODM"| Budgets
    Ctrl <-->|"Mongoose ODM"| Exps
    Ctrl <-->|"Mongoose ODM"| Props
    Ctrl <-->|"Mongoose ODM"| Votes
    Ctrl <-->|"Mongoose ODM"| Projs
    Ctrl <-->|"Mongoose ODM"| FB
    Ctrl <-->|"Mongoose ODM"| Notif
```

### End-to-End Request Data Flow

`Citizen/Admin → React Frontend → Express REST API → Authentication Middleware → Controllers → MongoDB → API Response → React Dashboard`

---

## 2. Frontend Architecture

- **Framework & Tooling:** React 18 with Vite, Tailwind CSS, React Router v6, Recharts, Lucide React, and Axios.
- **State & Context:**
  - `AuthContext` (`frontend/src/context/AuthContext.jsx`): Persists JWT token and safe user metadata in `localStorage`, validates sessions on load via `GET /api/auth/me`, and exposes `isAuthenticated`, `isAdmin`, `login`, `register`, `logout`, and `unreadNotifications`.
  - `ToastContext` (`frontend/src/context/ToastContext.jsx`): Global accessible toast feedback for API successes and errors.
- **Layouts & Route Guards:**
  - `MainLayout`: Public & Citizen shell containing the demonstration disclaimer bar, responsive `Navbar` with notifications bell, `<Outlet />`, and `Footer`.
  - `AdminLayout`: Dedicated administration shell with collapsible sidebar (`Overview`, `Budget Allocation`, `Department Spending`, `Citizen Proposals`, `Project Tracking`, `Reports & Analytics`, `Feedback Desk`, `Citizen Accounts`).
  - `ProtectedRoute`: Enforces authentication and optional `requireAdmin` role verification before rendering protected routes.

---

## 3. Backend Architecture

Organized cleanly inside `backend/`:

- `config/db.js`: Connects to MongoDB Atlas (`MONGODB_URI`) or `mongodb-memory-server` when `USE_IN_MEMORY_DB=true`.
- `models/`: 9 Mongoose schemas with field validation, timestamps, indexes, and unique constraints.
- `middleware/`:
  - `auth.js`: `protect`, `optionalAuth`, `authorize(...roles)`, `signToken`.
  - `errorHandler.js`: `validateRequest` (`express-validator`), `notFoundHandler`, and centralized `errorHandler` translating Mongoose duplicate keys (`11000`), validation errors, and Multer limits into clean JSON responses.
  - `upload.js`: Multer disk storage with MIME type allowlist and 5 MB per-file cap.
- `controllers/` & `routes/`: Dedicated REST modules for Auth, Users/Notifications, Departments, Budgets, Expenditures, Proposals, Votes, Projects, Feedback, and Reports.
- `utils/`: `AppError`, `asyncHandler`, `csvExport` (formula-injection safe CSV serializer), `notify`, and `seedData`.

---

## 4. Database Architecture (ERD)

```mermaid
erDiagram
    USERS ||--o{ PROPOSALS : submits
    USERS ||--o{ VOTES : casts
    USERS ||--o{ BUDGETS : creates
    USERS ||--o{ EXPENDITURES : records
    USERS ||--o{ FEEDBACK : submits
    USERS ||--o{ NOTIFICATIONS : receives
    DEPARTMENTS ||--o{ BUDGETS : allocated_in
    DEPARTMENTS ||--o{ EXPENDITURES : incurs
    DEPARTMENTS ||--o{ PROJECTS : manages
    BUDGETS ||--o{ EXPENDITURES : funds
    BUDGETS ||--o{ PROJECTS : funds
    PROPOSALS ||--o{ VOTES : receives
    PROPOSALS ||--o| PROJECTS : converted_to
    PROJECTS ||--o{ EXPENDITURES : tracks
```

### Key Integrity Constraints
- `User.email`: Unique, lowercase, indexed; `password` uses `select: false` and `bcryptjs` salt-10 hashing.
- `Vote`: Compound unique index `{ proposal: 1, citizen: 1 }` enforcing **one vote per citizen per proposal** at the database engine level (`409 Conflict` on duplicate attempt).
- `Proposal.submittedBy` on public endpoints populates only `name` and `ward` — never `email`, `phone`, or `address`.

---

## 5. Authentication Workflow

```mermaid
sequenceDiagram
    actor User as Citizen / Admin
    participant FE as React Frontend
    participant API as Express Auth API
    participant DB as MongoDB

    User->>FE: Submit Register or Login form
    FE->>API: POST /api/auth/register or /login
    API->>DB: Query / Create User (bcrypt hash)
    DB-->>API: User document
    API->>API: Verify password & sign JWT (7d)
    API-->>FE: 200/201 { token, user (safe fields) }
    FE->>FE: Store token in localStorage & AuthContext
    FE->>API: Subsequent calls with Authorization: Bearer <token>
    API->>API: protect() verifies JWT & authorize() checks role
```

---

## 6. Citizen Proposal Workflow

```mermaid
flowchart TD
    A[Citizen fills Proposal Form + Attachments] --> B[POST /api/proposals]
    B --> C[Saved in MongoDB with status: Pending]
    C --> D[Appears in Admin Review Queue]
    D --> E{Admin Decision}
    E -->|Under Review| F[Status updated + Citizen Notified]
    E -->|Rejected| G[Status: Rejected + Remarks + Citizen Notified]
    E -->|Approved| H[Status: Approved + Voting Deadline Set]
    H --> I[Appears on Public Voting Ballot]
    H -.->|Optional Admin Action| J[Linked Public Project Created]
```

---

## 7. Participatory Voting Workflow

```mermaid
sequenceDiagram
    actor Citizen
    participant FE as Voting Page
    participant API as /api/votes/:proposalId
    participant DB as MongoDB (Votes + Proposals)

    Citizen->>FE: Click "Vote for Proposal"
    FE->>API: POST /api/votes/:proposalId (Bearer JWT)
    API->>DB: Verify Proposal status === "Approved" & deadline active
    API->>DB: Check existing Vote & insert { proposal, citizen }
    alt Duplicate Vote
        DB-->>API: E11000 Duplicate Key Error
        API-->>FE: 409 Conflict ("You have already voted")
    else First Valid Vote
        DB-->>API: Vote inserted
        API->>DB: Recount Votes & update Proposal.voteCount
        API-->>FE: 201 Created { voteCount }
        FE->>FE: Update leaderboard, chart & disable Vote button
    end
```

---

## 8. Budget Management & Spending Workflow

```mermaid
flowchart LR
    A[Admin Creates Annual Budget] --> B[Admin Registers Departments]
    B --> C[Admin Allocates Funds <= Total Ceiling]
    C --> D[Admin Publishes Budget]
    D --> E[Public Dashboard Displays Live Allocations]
    F[Admin Records Expenditure] --> G[Linked to Budget, Dept, & Optional Project]
    G --> H[Project.amountSpent Incremented]
    H --> E
```

---

## 9. API Architecture Summary

| Resource | Base Path | Public Access | Authenticated Citizen | Admin Only |
|---|---|---|---|---|
| Auth | `/api/auth` | Register, Login | Me, Profile, Password | — |
| Users | `/api/users` | — | My Notifications | List Users, Suspend/Activate |
| Departments | `/api/departments` | List Active | List Active | Create, Update |
| Budgets | `/api/budgets` | Published List & Dashboard | Published List & Dashboard | Create, Update, Publish, Allocate |
| Expenditures | `/api/expenditures` | Search, Filter, Sort Ledger | Search, Filter, Sort Ledger | Record, Delete |
| Proposals | `/api/proposals` | List & View (public fields) | Submit Proposal | Update Status / Remarks |
| Votes | `/api/votes` | View Ballot & Standings | Cast Vote, My Votes | Cast Vote |
| Projects | `/api/projects` | List & Track Progress | List & Track Progress | Create Project, Update Progress |
| Feedback | `/api/feedback` | Submit Inquiry/Complaint | View Own Tickets | View All & Respond |
| Reports | `/api/reports` | Summary JSON & CSV Export | Summary JSON & CSV Export | Summary JSON & CSV Export |

---

## 10. Deployment Architecture

```mermaid
flowchart TB
    Browser["User Browser"] --> Vercel["Vercel (React + Vite Static SPA)"]
    Vercel -->|"VITE_API_URL (HTTPS)"| Render["Render Web Service (Node.js + Express API)"]
    Render -->|"MONGODB_URI (TLS)"| Atlas["MongoDB Atlas Cluster"]
```

- **Frontend (Vercel):** Serves optimized static assets built via `npm run build` with `vercel.json` SPA fallback rewrites.
- **Backend (Render):** Runs `node server.js` configured via `render.yaml` and environment variables (`MONGODB_URI`, `JWT_SECRET`, `CORS_ORIGINS`).
- **Database (MongoDB Atlas):** Managed cloud cluster storing all 9 collections with TLS encryption and automated indexing.
