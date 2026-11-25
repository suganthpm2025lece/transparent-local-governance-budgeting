# API Documentation — CivicLedger REST API

Base URL (Local): `http://localhost:5000/api`  
Authentication: Bearer JWT passed via `Authorization: Bearer <token>` header.

---

## 1. Health Check
- **GET `/api/health`** — Returns `{ success: true, status: "healthy", timestamp }`.

---

## 2. Authentication (`/api/auth`)
| Method | Endpoint | Access | Body / Params | Response |
|---|---|---|---|---|
| POST | `/auth/register` | Public | `{ name, email, password, phone?, ward?, address? }` | `201` `{ token, user }` (role forced to `citizen`) |
| POST | `/auth/login` | Public | `{ email, password }` | `200` `{ token, user }` |
| GET | `/auth/me` | Protected | Bearer token | `200` `{ user, unreadNotifications }` |
| PUT | `/auth/profile` | Protected | `{ name?, phone?, ward?, address? }` | `200` `{ user }` |
| PUT | `/auth/password` | Protected | `{ currentPassword, newPassword }` | `200` `{ message }` |

---

## 3. Users & Notifications (`/api/users`)
| Method | Endpoint | Access | Query / Body | Response |
|---|---|---|---|---|
| GET | `/users` | Admin | `?search=&role=&isActive=` | `200` `{ count, users }` |
| PATCH | `/users/:id/status` | Admin | `{ isActive?, role? }` | `200` `{ user }` |
| GET | `/users/notifications` | Protected | — | `200` `{ unreadCount, notifications }` |
| PATCH | `/users/notifications/:id/read` | Protected | `:id` or `"all"` | `200` `{ message }` |

---

## 4. Departments (`/api/departments`)
| Method | Endpoint | Access | Body | Response |
|---|---|---|---|---|
| GET | `/departments` | Public | `?includeInactive=true` (Admin) | `200` `{ count, departments }` |
| POST | `/departments` | Admin | `{ name, code, description?, headOfDepartment?, contactEmail?, color? }` | `201` `{ department }` |
| PUT | `/departments/:id` | Admin | Updatable department fields | `200` `{ department }` |

---

## 5. Budgets (`/api/budgets`)
| Method | Endpoint | Access | Query / Body | Response |
|---|---|---|---|---|
| GET | `/budgets/dashboard` | Public | `?fiscalYear=&budgetId=` | `200` Summary KPIs, department breakdown, monthly trend, recent activity |
| GET | `/budgets` | Public/Admin | `?fiscalYear=&status=` | `200` Published budgets (Admin sees drafts too) |
| GET | `/budgets/:id` | Public/Admin | — | `200` `{ budget }` |
| POST | `/budgets` | Admin | `{ fiscalYear, title, totalAmount, description?, status?, allocations? }` | `201` `{ budget }` |
| PUT | `/budgets/:id` | Admin | Update title, totalAmount, status (`draft`/`published`/`archived`), allocations | `200` `{ budget }` |
| PUT | `/budgets/:id/allocate` | Admin | `{ departmentId, allocatedAmount, notes? }` | `200` `{ budget }` (validates sum <= totalAmount) |

---

## 6. Expenditures (`/api/expenditures`)
| Method | Endpoint | Access | Query / Body | Response |
|---|---|---|---|---|
| GET | `/expenditures` | Public | `?search=&departmentId=&budgetId=&projectId=&sortBy=&sortOrder=` | `200` `{ expenditures, totalFilteredAmount, totalCount }` |
| POST | `/expenditures` | Admin | `{ budgetId, departmentId, projectId?, title, description, amount, transactionDate?, vendorName?, referenceNumber? }` | `201` `{ expenditure }` |
| DELETE | `/expenditures/:id` | Admin | — | `200` `{ message }` |

---

## 7. Citizen Proposals (`/api/proposals`)
| Method | Endpoint | Access | Query / Body | Response |
|---|---|---|---|---|
| GET | `/proposals` | Public/OptionalAuth | `?search=&category=&status=&mine=true` | `200` `{ count, proposals }` (never exposes private user email/phone) |
| GET | `/proposals/:id` | Public/OptionalAuth | — | `200` `{ proposal }` |
| POST | `/proposals` | Protected | Multipart or JSON: `title, description, category, location, estimatedBudget, attachments?` | `201` `{ proposal }` |
| PATCH | `/proposals/:id/status` | Admin | `{ status, adminRemarks?, votingDeadline?, createProject?, departmentId? }` | `200` `{ proposal }` |

---

## 8. Participatory Voting (`/api/votes`)
| Method | Endpoint | Access | Query / Body | Response |
|---|---|---|---|---|
| GET | `/votes/ballot` | Public/OptionalAuth | `?category=` | `200` Ranked approved proposals with share% and `hasVoted` |
| GET | `/votes/my` | Protected | — | `200` `{ votes }` |
| POST | `/votes/:proposalId` | Protected | `{ comment? }` | `201` `{ voteCount }` or `409` if already voted |

---

## 9. Public Projects (`/api/projects`)
| Method | Endpoint | Access | Query / Body | Response |
|---|---|---|---|---|
| GET | `/projects` | Public | `?search=&departmentId=&status=&budgetId=` | `200` `{ count, projects }` |
| GET | `/projects/:id` | Public | — | `200` `{ project }` |
| POST | `/projects` | Admin | `{ name, departmentId, budgetId, location, allocatedBudget, startDate, expectedCompletionDate, ... }` | `201` `{ project }` |
| PATCH | `/projects/:id/progress` | Admin | `{ status?, completionPercentage?, note?, amountSpent? }` | `200` `{ project }` |

---

## 10. Feedback & Reports (`/api/feedback`, `/api/reports`)
| Method | Endpoint | Access | Query / Body | Response |
|---|---|---|---|---|
| POST | `/feedback` | Public/Protected | `{ subject, message, type?, departmentId?, projectId?, senderName?, senderEmail? }` | `201` `{ feedback }` |
| GET | `/feedback` | Protected | `?status=&type=` | `200` Citizens see own; Admins see all |
| PATCH | `/feedback/:id/respond` | Admin | `{ status?, adminResponse? }` | `200` `{ feedback }` |
| GET | `/reports/summary` | Public | `?fiscalYear=` | `200` Full analytical payload |
| GET | `/reports/export` | Public | `?type=budget\|spending\|projects\|voting&fiscalYear=` | `200` `text/csv` attachment |
