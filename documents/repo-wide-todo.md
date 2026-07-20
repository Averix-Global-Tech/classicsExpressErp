# Classic Express ERP — Repo-Wide Scan: What's Left / Fixes Needed

Scanned whole repo (`server/`, `client/`, all local + remote branches) on 2026-07-17, branch `dev`.

---

## 1. Branch situation — big one, check this first

Several teammates' backend modules are **built but sitting unmerged on `origin`**, not on `dev`:

- `origin/feature/employee-creation` — full `employeeController.js` (296 lines), `employeeRoutes.js`, email service, password service
- `origin/feature/attendance-module` — `Attendance.js`, `AttendanceSettings.js` models, `attendanceController.js` (429 lines), `attendanceRoutes.js`
- `origin/feature/grievance-module` — `Grievance.js`, `GrievanceMessage.js`, `GrievanceSettings.js` models, `grievanceRoutes.js`

**Problem:** all three of these branches were forked *before* Leave/Task existed, so each one's diff against `dev` shows it **deleting** `leaveController.js`, `taskController.js`, and all the leave/task models/routes/services. Merging any of them into `dev` as-is will blow away Vic's work. Whoever merges these needs to rebase them on current `dev` (or cherry-pick just the employee/attendance/grievance files) — do not fast-forward or merge blindly.

Also unmerged: `origin/fix-frontend-bugs` (small client fixes: Topbar, AuthContext, api.js, DataTable) and `origin/sallu-bhai` (mostly stale, only a vite.config tweak of substance). Someone should check if these still apply and land or drop them.

**Action:** whoever owns integration should rebase `employee-creation`, `attendance-module`, and `grievance-module` onto latest `dev` and open PRs. Right now three finished backend modules are invisible to the rest of the team.

---

## 2. Backend status by module

| Module | Backend | Notes |
|---|---|---|
| Auth (login/refresh/reset/change-password) | ✅ done on `dev` | JWT + refresh rotation, reuse detection, good |
| Users (admin CRUD) | ✅ done on `dev` | soft-delete pattern |
| Dashboard summary | ✅ done, mostly placeholders | stats for unbuilt modules (Employees, Attendance, Customers, Shipments, Finance) hardcoded to 0 by design, fine for now |
| **Leave Management** | ✅ done on `dev` (Vic) | see `documents/vic-assignment-status.md` — notifications gap |
| **Employee Task Management** | ✅ done on `dev` (Vic) | see `documents/vic-assignment-status.md` |
| Employee Management | ✅ built, **unmerged** | `origin/feature/employee-creation` |
| Attendance | ✅ built, **unmerged** | `origin/feature/attendance-module` |
| Grievance | ✅ built, **unmerged** | `origin/feature/grievance-module` |
| **Settings Module** (2FA, notification prefs, theme/lang/timezone) | ❌ **not started anywhere** | no model, controller, route, or branch. `grep -ri "2fa\|otp\|twoFactor"` across `server/` → zero hits |
| Notifications (real, persisted) | ✅ done on `dev` | now backed by a `Notification` model + `/api/notifications` routes (list, mark-read, mark-all-read) |
| Payroll, Customers, Courier, AWB, Pickup, Delivery, Branches, Inventory, Finance, Reports, Audit-log UI | ❌ not started | listed as Phase 3–5 placeholders in `client/src/utils/constants.js` nav, no backend either |

---

## 3. Frontend status — this is the biggest gap overall

`client/src/pages/` currently has exactly 5 pages: `LoginPage`, `ForgotPasswordPage`, `ResetPasswordPage`, `DashboardPage`, `ProfilePage`. That's it.

**Zero frontend exists for:**
- Leave Management (no application form, no approval queue, no calendar, no balance view)
- Employee Task Management (no task board, no to-do list, no employee profile task view)
- Employee Management
- Attendance Management
- Grievance Management
- Settings Module (profile edit, security, 2FA, notification prefs, preferences)

`client/src/App.jsx` only routes `/dashboard` and `/profile`. `NAV_ITEMS` in `constants.js` lists Employees/Attendance/Leave as "phase 2" and Settings as "phase 5" but none are wired to routes yet, and **Tasks has no nav entry at all** — needs to be added when its page is built.

So concretely, for the three people mentioned in the brief:

- **Pratyush's Phase 1** (polish Employee/Attendance/Grievance UI) — can't start yet in the literal sense, because those pages don't exist. This is really "build the UI" not "improve the UI," unless the employee/attendance/grievance branches above also contain frontend (they don't — diffs show `client/` untouched in all three). Worth flagging to whoever wrote the brief.
- **Pratyush's Phase 2** (Leave + Task frontend) — fully open, backend is ready and stable to build against.
- **Notes/Sky Chan's Settings Module** — 100% greenfield, front and back. No password-strength component, no 2FA scaffolding, no notification-preferences model exists yet to build the UI against.

---

## 4. Concrete fixes / cleanup items

1. ~~Notification persistence~~ — **done.** `Notification` model + `GET /api/notifications`, `PATCH /api/notifications/:id/read`, `PATCH /api/notifications/read-all` added.
2. **No automated tests anywhere** — `find . -iname "*test*"` returns nothing outside `node_modules`. CI (`.forgejo/workflows/ci.yml`) only runs lint + build, no test step exists to add tests to yet. Leave-balance math, overlap-detection, and task progress→status derivation are exactly the logic that regresses silently without tests.
3. **`package-lock.json` at repo root, untracked** (per `git status` at session start) — check whether a root-level `npm install` was run by accident; the project has separate `client/` and `server/` lockfiles. Either commit it if intentional (monorepo tooling) or delete it.
4. **Merge conflict risk** — see §1. The three unmerged feature branches will destructively conflict with `dev`'s leave/task code if merged naively.
5. **`config/env.js`** — `employee-creation`/`attendance-module` branches both add 13 lines to `server/config/env.js` (likely SMTP/email config for `emailService.js`). Confirm `.env.example` gets updated to match when those branches land, or new devs' `npm start` will fail silently on missing env vars.
6. **Settings module has zero scaffolding** — even the `User` model has a comment (`server/models/User.js:40`) noting staff-profile fields are "filled in by Employee module in Phase 2," but nothing for 2FA (no `twoFactorEnabled`, `twoFactorSecret` fields), no notification-preference fields, no theme/language/timezone fields. These need schema additions before the Settings backend can start.
7. **Dashboard placeholders** — `dashboardController.js` hardcodes `totalEmployees`, `presentEmployees`, etc. to 0 with `// Phase 2` comments. Once Employee/Attendance branches land, these need real aggregation queries — easy to forget since it silently "works" (shows zero) either way.

---

## 5. Suggested order of operations

1. Rebase & merge `employee-creation` → `attendance-module` → `grievance-module` onto `dev` (in that order, resolving the leave/task delete-conflicts each time).
2. Fix notification service (real persistence) — small, unblocks accurate leave/task alerts before frontend work depends on it.
3. Add User schema fields needed for Settings (2FA, notification prefs, preferences) so Notes/Sky Chan's backend has a foundation.
4. Frontend: Leave + Task pages (backend ready now) can start immediately in parallel with the above.
5. Frontend: Employee/Attendance/Grievance pages once their backends are merged.
6. Settings module frontend + backend, in parallel with #3 done first.
7. Wire dashboard's zero-placeholders to real data as each module lands.
8. Add a test step to CI once any tests exist.
