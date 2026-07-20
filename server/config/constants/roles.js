/**
 * Application roles. Keep this the single source of truth for role strings so
 * the DB, RBAC middleware, and seed script all agree.
 */
const ROLES = {
  SYSTEM_ADMIN: 'system_admin',
  ADMIN: 'admin',
  // Employee roles — added in Phase 2 (Employee Module)
  HR_MANAGER: 'hr_manager',
  BRANCH_MANAGER: 'branch_manager',
  ACCOUNTANT: 'accountant',
  DISPATCHER: 'dispatcher',
  CUSTOMER_SERVICE: 'customer_service',
  EMPLOYEE: 'employee',
};

// Roles that can authenticate into the ERP dashboard.
const DASHBOARD_ROLES = Object.values(ROLES);

// Employee-level roles (non-admin).
const EMPLOYEE_ROLES = [
  ROLES.HR_MANAGER,
  ROLES.BRANCH_MANAGER,
  ROLES.ACCOUNTANT,
  ROLES.DISPATCHER,
  ROLES.CUSTOMER_SERVICE,
  ROLES.EMPLOYEE,
];

// Admin-level roles (can manage employees).
const ADMIN_ROLES = [ROLES.SYSTEM_ADMIN, ROLES.ADMIN, ROLES.HR_MANAGER];

module.exports = { ROLES, DASHBOARD_ROLES, EMPLOYEE_ROLES, ADMIN_ROLES };
