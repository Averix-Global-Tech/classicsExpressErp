// Application-wide constants. Keep shared labels here so views stay consistent.
export const APP_NAME = 'Classic Express';
export const APP_FULL_NAME = 'Classic Express International Courier';

export const ROLES = {
  SYSTEM_ADMIN: 'system_admin',
  ADMIN: 'admin',
  HR_MANAGER: 'hr_manager',
  BRANCH_MANAGER: 'branch_manager',
  ACCOUNTANT: 'accountant',
  DISPATCHER: 'dispatcher',
  CUSTOMER_SERVICE: 'customer_service',
  EMPLOYEE: 'employee',
};

export const ROLE_LABELS = {
  system_admin: 'System Admin',
  admin: 'Admin',
  hr_manager: 'HR Manager',
  branch_manager: 'Branch Manager',
  accountant: 'Accountant',
  dispatcher: 'Dispatcher',
  customer_service: 'Customer Service',
  employee: 'Employee',
};

// Routes requiring NO authentication.
export const PUBLIC_ROUTES = ['/login', '/forgot-password', '/reset-password'];

// Sidebar navigation — grouped by section for sidebar headers.
// group values: 'Main' | 'Operations' | 'People' | 'Finance' | 'System'
export const NAV_ITEMS = [
  { label: 'Dashboard',            to: '/dashboard',          icon: 'LayoutDashboard',    group: 'Main',       roles: ['system_admin', 'admin', 'hr_manager', 'branch_manager', 'accountant', 'dispatcher', 'customer_service', 'employee'] },
  { label: 'Attendance',           to: '/attendance',         icon: 'CalendarCheck',      group: 'Operations', roles: ['system_admin', 'admin', 'hr_manager', 'branch_manager', 'accountant', 'dispatcher', 'customer_service', 'employee'] },
  { label: 'Grievance',            to: '/grievance',          icon: 'AlertTriangle',      group: 'Operations', roles: ['system_admin', 'admin', 'hr_manager', 'branch_manager', 'accountant', 'dispatcher', 'customer_service', 'employee'] },
  { label: 'My Productivity',      to: '/productivity/my',    icon: 'Briefcase',          group: 'Operations', roles: ['system_admin', 'admin', 'hr_manager', 'branch_manager', 'accountant', 'dispatcher', 'customer_service', 'employee'] },
  { label: 'Tasks',                to: '/tasks',              icon: 'ClipboardList',      group: 'Operations', roles: ['system_admin', 'admin', 'hr_manager', 'branch_manager', 'accountant', 'dispatcher', 'customer_service', 'employee'] },
  { label: 'Shipments',            to: '/shipment',           icon: 'Package',            group: 'Operations', roles: ['system_admin', 'admin', 'hr_manager', 'branch_manager', 'accountant', 'dispatcher', 'customer_service', 'employee'] },
  { label: 'Employees',            to: '/employees',          icon: 'Users',              group: 'People',     roles: ['system_admin', 'admin', 'hr_manager'] },
  { label: 'Employee Productivity',to: '/productivity/admin', icon: 'Activity',           group: 'People',     roles: ['system_admin', 'admin'] },
  { label: 'Leave',                to: '/leave',              icon: 'CalendarDays',       group: 'People',     roles: ['system_admin', 'admin'] },
  { label: 'Payroll',              to: '/payroll',            icon: 'Wallet',             group: 'People',     roles: ['system_admin', 'admin'], phase: 2 },
  { label: 'Customers',            to: '/customers',          icon: 'UserRound',          group: 'Finance',    roles: ['system_admin', 'admin'], phase: 3 },
  { label: 'Branches',             to: '/branches',           icon: 'Building2',          group: 'Finance',    roles: ['system_admin'], phase: 3 },
  { label: 'Inventory',            to: '/inventory',          icon: 'Boxes',              group: 'Finance',    roles: ['system_admin', 'admin'], phase: 4 },
  { label: 'Finance',              to: '/finance',            icon: 'Landmark',           group: 'Finance',    roles: ['system_admin', 'admin'], phase: 4 },
  { label: 'Complaints',           to: '/complaints',         icon: 'MessageSquareWarning',group:'Finance',    roles: ['system_admin', 'admin'], phase: 4 },
  { label: 'Reports',              to: '/reports',            icon: 'FileBarChart',        group: 'System',    roles: ['system_admin', 'admin'], phase: 5 },
  { label: 'Audit Logs',           to: '/audit-logs',         icon: 'ScrollText',          group: 'System',    roles: ['system_admin'], phase: 5 },
];

