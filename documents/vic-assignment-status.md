# Vic's Sprint Assignment — Status Check

Scope: Leave Management System backend + Employee Task Management backend, per the brief pasted in chat.

## Short answer: YES, backend core is done. Few gaps remain (below).

Branch `dev`, commits `436716d`..`e2e9d73`. Routes wired into `server/routes/index.js`.

---

## 1. Leave Management System — DONE, minor gaps

| Requirement | Status | Where |
|---|---|---|
| Leave Application | ✅ | `leaveController.applyLeave` — overlap check, balance check, half-day support |
| Leave Approval/Rejection | ✅ | `reviewLeave` — approve/reject, balance deduction, comment |
| Leave Types | ✅ | full CRUD, soft-deactivate on delete |
| Leave Balance | ✅ | `myBalance`, auto-create per type/year, carriedForward field exists |
| Leave History | ✅ | `listMyLeaves`, `listLeaveApplications` (admin, paginated/filterable) |
| Leave Calendar | ✅ | `leaveCalendar` — approved leaves in date range |
| Notifications | ✅ **fixed** | `Notification` model added, `notificationService.js` now DB-backed (was in-memory Map), new `GET /api/notifications`, `PATCH /api/notifications/:id/read`, `PATCH /api/notifications/read-all` routes wired in. Survives restart. |
| Reports | ✅ | `leaveReport` — by status, by type aggregation |
| Validation | ✅ | `leaveValidator.js`, express-validator on all mutating routes |
| Audit Logs | ✅ | `auditService.record()` on type CRUD, apply, review, cancel |

**Fix needed:** promote notifications from in-memory stub to a real `Notification` model + persisted store + its own route (`GET /api/notifications`, `PATCH /api/notifications/:id/read`). Right now a restart wipes every pending leave-approval alert.

## 2. Employee Task Management — DONE, minor gaps

| Requirement | Status | Where |
|---|---|---|
| Admin: create/assign tasks | ✅ | `createTask` |
| Priority | ✅ | enum in `config/constants/task.js` |
| Deadlines | ✅ | `deadline` field |
| Track progress | ✅ | `updateProgress` (0–100 → auto status) |
| Pending/Completed monitor | ✅ | `listTasks` with status filter |
| Overdue tasks | ✅ | `overdueTasks`, virtual `isOverdue` on model |
| Employee: view assigned | ✅ | `listTasks` scoped to self for non-admins |
| Employee: personal to-dos | ✅ | `createTodo`, `isPersonal` flag |
| Update progress / complete | ✅ | `updateProgress`, `completeTask` |
| Progress notes | ✅ | `addProgressNote`, embedded subdocs |
| Admin views employee profile (assigned/todo/completed/pending/overdue/%/daily progress/deadline status) | ✅ | `employeeSummary` → `taskService.getProfileSummary()` returns exactly this breakdown |

No real gaps here — this one's solid end-to-end on the backend.

---

## What's NOT covered by this backend work (out of Vic's stated scope, but blocks it from being usable)

- **Zero frontend.** No Leave pages, no Task pages exist in `client/src/pages/`. `client/src/utils/constants.js` nav list doesn't even have a "Tasks" entry (Leave is listed as phase 2, Tasks isn't listed at all). Backend is unreachable by any UI right now.
- **No automated tests** anywhere in the repo (`find . -iname "*test*"` → empty) for leave or task logic (overlap check, balance math, status-from-progress are exactly the kind of logic that wants unit tests).
- Notification persistence gap (above) also affects Task assignment/completion pings.

See `documents/repo-wide-todo.md` for the full repo scan and everyone else's status.
