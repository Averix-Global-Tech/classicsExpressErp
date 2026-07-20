import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
  Users, Plus, Search, RefreshCw, Mail, MoreHorizontal,
  UserCheck, UserX, Eye, ChevronLeft, ChevronRight, Loader2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import employeeService from '../services/employeeService';
import { useToast } from '../context/ToastContext';
import { Modal, Button, Badge, Spinner, Select } from '../components/ui';

// ─── Constants ────────────────────────────────────────────────────────────────

const EMPLOYEE_ROLES = [
  { value: 'employee', label: 'Employee' },
  { value: 'hr_manager', label: 'HR Manager' },
  { value: 'branch_manager', label: 'Branch Manager' },
  { value: 'accountant', label: 'Accountant' },
  { value: 'dispatcher', label: 'Dispatcher' },
  { value: 'customer_service', label: 'Customer Service' },
];

const EMPLOYMENT_TYPES = [
  { value: 'permanent', label: 'Permanent' },
  { value: 'probation', label: 'Probation' },
  { value: 'contract', label: 'Contract' },
  { value: 'intern', label: 'Intern' },
];

const ROLE_COLORS = {
  employee: 'grey',
  hr_manager: 'blue',
  branch_manager: 'indigo',
  accountant: 'green',
  dispatcher: 'yellow',
  customer_service: 'orange',
};

// ─── Create Employee Form Schema ──────────────────────────────────────────────

const createSchema = yup.object({
  name: yup.string().trim().min(2).max(80).required('Full name is required.'),
  email: yup.string().email('Enter a valid email.').required('Email is required.'),
  phone: yup
    .string()
    .trim()
    .matches(/^\+?\d{10,15}$/, 'Mobile number must contain between 10 and 15 digits.')
    .required('Phone is required.'),
  role: yup.string().required('Role is required.'),
  department: yup.string().trim().min(1).required('Department is required.'),
  designation: yup.string().trim().min(1).required('Designation is required.'),
  employmentType: yup.string().required('Employment type is required.'),
  joiningDate: yup.string().required('Joining date is required.'),
  reportingManager: yup.string().optional().nullable(),
});

// ─── Create Employee Modal ────────────────────────────────────────────────────

function CreateEmployeeModal({ open, onClose, onCreated }) {
  const toast = useToast();
  const [emailFailedId, setEmailFailedId] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [tempPassword, setTempPassword] = useState(null);
  const [copied, setCopied] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: yupResolver(createSchema) });

  const handleClose = () => {
    reset();
    setEmailFailedId(null);
    setPreviewUrl(null);
    setTempPassword(null);
    setCopied(false);
    onClose();
  };

  const handleCopyPassword = async () => {
    if (!tempPassword) return;
    await navigator.clipboard.writeText(tempPassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const onSubmit = async (values) => {
    try {
      const result = await employeeService.create(values);
      if (result.emailPreviewUrl) {
        setPreviewUrl(result.emailPreviewUrl);
      }
      setTempPassword(result.tempPassword || null);

      if (result.emailSent) {
        toast.success(`Employee ${values.name} created! Welcome email sent.`);
      } else {
        toast.warning(`Employee created, but the welcome email could not be delivered.`);
        setEmailFailedId(result.employee?._id);
      }
      onCreated?.();
      // Stay open so the admin can copy the temporary password before closing.
    } catch (err) {
      toast.error(err?.message || 'Failed to create employee.');
    }
  };

  const handleResend = async () => {
    if (!emailFailedId) return;
    try {
      const res = await employeeService.resendEmail(emailFailedId);
      toast.success('Welcome email resent successfully!');
      if (res.emailPreviewUrl) setPreviewUrl(res.emailPreviewUrl);
      if (res.tempPassword) setTempPassword(res.tempPassword);
      setEmailFailedId(null);
    } catch {
      toast.error('Failed to resend email. Please try again from the employee profile.');
    }
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Add New Employee"
      description="Fill in the details below. A secure password will be auto-generated and emailed to the employee."
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={handleClose} disabled={isSubmitting}>
            {tempPassword ? 'Done' : 'Cancel'}
          </Button>
          {!tempPassword && (
            <Button
              type="submit"
              form="create-employee-form"
              loading={isSubmitting}
            >
              Create Employee
            </Button>
          )}
        </>
      }
    >
      {tempPassword && (
        <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
          <p className="text-sm font-semibold text-blue-800">🔑 Temporary Password</p>
          <p className="mt-1 text-xs text-blue-600">
            Email delivery is currently unreliable due to a network issue on the hosting
            provider. Please copy this password and share it with the employee directly.
          </p>
          <div className="mt-2 flex items-center gap-2">
            <code className="flex-1 select-all rounded border border-blue-200 bg-white px-3 py-1.5 text-sm font-mono text-blue-900">
              {tempPassword}
            </code>
            <button
              type="button"
              onClick={handleCopyPassword}
              className="rounded bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>
      )}

      {emailFailedId && (
        <div className="mb-4 flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-sm text-amber-800">Welcome email delivery failed.</p>
          <button
            onClick={handleResend}
            className="ml-4 text-sm font-medium text-amber-700 underline hover:text-amber-900"
          >
            Resend now
          </button>
        </div>
      )}

      {previewUrl && (
        <div className="mb-4 rounded-lg border border-orange-200 bg-orange-50 px-4 py-3">
          <p className="text-sm font-medium text-orange-800">📧 Development Mode Email Sent</p>
          <p className="mt-1 text-xs text-orange-600">
            Click below to view the Ethereal email and copy the temporary password.
          </p>
          <a
            href={previewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-block rounded bg-orange-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-orange-700"
          >
            Open Email Preview
          </a>
        </div>
      )}

      <form id="create-employee-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Personal Information */}
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Personal Information
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Full Name *" error={errors.name?.message}>
              <input
                {...register('name')}
                placeholder="John Doe"
                className="input-base"
              />
            </Field>
            <Field label="Email Address *" error={errors.email?.message}>
              <input
                {...register('email')}
                type="email"
                placeholder="employee@company.com"
                className="input-base"
              />
            </Field>
            <Field label="Mobile Number *" error={errors.phone?.message}>
              <input
                {...(() => {
                  const { onChange, ...rest } = register('phone');
                  return {
                    ...rest,
                    onChange: (e) => {
                      let val = e.target.value.replace(/[^\d+]/g, '');
                      if (val.startsWith('+')) {
                        val = '+' + val.slice(1).replace(/\+/g, '').slice(0, 15);
                      } else {
                        val = val.replace(/\+/g, '').slice(0, 15);
                      }
                      e.target.value = val;
                      onChange(e);
                    }
                  };
                })()}
                type="tel"
                placeholder="+919000000000"
                className="input-base"
              />
            </Field>
            <Field label="Joining Date *" error={errors.joiningDate?.message}>
              <input
                {...register('joiningDate')}
                type="date"
                className="input-base"
              />
            </Field>
          </div>
        </div>

        {/* Role & Department */}
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Role & Department
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Role *" error={errors.role?.message}>
              <Select
                {...register('role')}
                placeholder="Select role…"
                options={EMPLOYEE_ROLES}
              />
            </Field>
            <Field label="Department *" error={errors.department?.message}>
              <input
                {...register('department')}
                placeholder="e.g. Operations"
                className="input-base"
              />
            </Field>
            <Field label="Designation *" error={errors.designation?.message}>
              <input
                {...register('designation')}
                placeholder="e.g. Senior Executive"
                className="input-base"
              />
            </Field>
            <Field label="Employment Type *" error={errors.employmentType?.message}>
              <Select
                {...register('employmentType')}
                placeholder="Select type…"
                options={EMPLOYMENT_TYPES}
              />
            </Field>
          </div>
        </div>

        {/* Account Info */}
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Account Information
          </p>
          <div className="rounded-lg border border-blue-100 dark:border-blue-900/50 bg-blue-50 dark:bg-blue-900/20 px-4 py-3">
            <p className="text-sm font-medium text-blue-800 dark:text-blue-400">
              🔐 Auto-generated credentials
            </p>
            <p className="mt-1 text-xs text-blue-600 dark:text-blue-300">
              A unique Employee ID and a cryptographically secure temporary password will be
              auto-generated. We&apos;ll also attempt to email it — if delivery fails, it&apos;ll
              be shown here for you to share directly.
            </p>
          </div>
        </div>
      </form>
    </Modal>
  );
}

// ─── Helper: Form Field wrapper ───────────────────────────────────────────────

function Field({ label, error, children }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs text-rose-500">{error}</p>}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function EmployeeListPage() {
  const toast = useToast();
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [resendingId, setResendingId] = useState(null);
  const [menuOpen, setMenuOpen] = useState(null);

  const fetchEmployees = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const data = await employeeService.list({ page, search, role: roleFilter });
      setEmployees(data.items || []);
      setPagination(data.pagination || { page: 1, total: 0, pages: 1 });
    } catch (err) {
      toast.error(err?.message || 'Failed to load employees.');
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter]);

  useEffect(() => {
    const timer = setTimeout(() => fetchEmployees(1), 300);
    return () => clearTimeout(timer);
  }, [fetchEmployees]);

  const handleResend = async (id, name) => {
    setResendingId(id);
    try {
      await employeeService.resendEmail(id);
      toast.success(`Welcome email resent to ${name}.`);
    } catch {
      toast.error('Failed to resend email.');
    } finally {
      setResendingId(null);
      setMenuOpen(null);
    }
  };

  const handleDeactivate = async (id, name) => {
    if (!window.confirm(`Deactivate ${name}? They will lose access immediately.`)) return;
    try {
      await employeeService.deactivate(id);
      toast.success(`${name} has been deactivated.`);
      fetchEmployees(pagination.page);
    } catch (err) {
      toast.error(err?.message || 'Failed to deactivate employee.');
    }
    setMenuOpen(null);
  };

  const roleLabel = (role) => EMPLOYEE_ROLES.find((r) => r.value === role)?.label || role;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-200">Employees</h1>
          <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
            Manage employee accounts, roles, and credentials.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="shrink-0 gap-2">
          <Plus size={16} />
          Add Employee
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, or employee ID…"
            className="w-full rounded-lg border border-slate-300 dark:border-navy-600 bg-white dark:bg-navy-900 py-2 pl-9 pr-3 text-sm text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
        </div>
        <div className="w-40 shrink-0">
          <Select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            options={[{ value: '', label: 'All Roles' }, ...EMPLOYEE_ROLES]}
          />
        </div>
        <button
          onClick={() => fetchEmployees(pagination.page)}
          className="flex items-center gap-1.5 rounded-lg border border-slate-300 dark:border-navy-600 bg-white dark:bg-navy-900 px-3 py-2 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:bg-navy-900/50"
        >
          <RefreshCw size={14} />
          Refresh
        </button>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-900 shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Spinner size={28} />
          </div>
        ) : employees.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 dark:bg-navy-800">
              <Users size={24} className="text-slate-400" />
            </div>
            <p className="font-semibold text-slate-700 dark:text-slate-300">No employees found</p>
            <p className="mt-1 text-sm text-slate-400">
              {search ? 'Try a different search term.' : 'Add your first employee to get started.'}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-navy-800 bg-slate-50 dark:bg-navy-900/50">
                    {['Employee', 'ID', 'Role', 'Department', 'Type', 'Joined', 'Status', ''].map(
                      (h) => (
                        <th
                          key={h}
                          className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400"
                        >
                          {h}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  <AnimatePresence initial={false}>
                    {employees.map((emp) => (
                      <motion.tr
                        key={emp._id}
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="group hover:bg-slate-50 dark:bg-navy-900/50/80 transition-colors"
                      >
                        {/* Name + email */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-700 text-sm font-semibold text-white">
                              {emp.name?.[0]?.toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium text-slate-800 dark:text-slate-200">{emp.name}</p>
                              <p className="text-xs text-slate-400">{emp.email}</p>
                            </div>
                          </div>
                        </td>
                        {/* Employee ID */}
                        <td className="px-4 py-3">
                          <span className="rounded bg-slate-100 dark:bg-navy-800 px-2 py-0.5 font-mono text-xs text-slate-600 dark:text-slate-400">
                            {emp.employeeId}
                          </span>
                        </td>
                        {/* Role */}
                        <td className="px-4 py-3">
                          <Badge color={ROLE_COLORS[emp.role] || 'grey'}>
                            {roleLabel(emp.role)}
                          </Badge>
                        </td>
                        {/* Department */}
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{emp.department || '—'}</td>
                        {/* Employment Type */}
                        <td className="px-4 py-3 capitalize text-slate-600 dark:text-slate-400">
                          {emp.employmentType || '—'}
                        </td>
                        {/* Joined */}
                        <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                          {emp.joiningDate
                            ? new Date(emp.joiningDate).toLocaleDateString('en-IN', {
                                day: '2-digit', month: 'short', year: 'numeric',
                              })
                            : '—'}
                        </td>
                        {/* Status */}
                        <td className="px-4 py-3">
                          {emp.isActive ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-xs font-medium text-rose-600">
                              <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
                              Inactive
                            </span>
                          )}
                        </td>
                        {/* Actions */}
                        <td className="px-4 py-3">
                          <div className="relative flex items-center justify-end gap-1">
                            <button
                              onClick={() => navigate(`/employees/${emp._id}`)}
                              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:bg-navy-800 hover:text-slate-600 dark:text-slate-400"
                              title="View profile"
                            >
                              <Eye size={15} />
                            </button>
                            <div className="relative">
                              <button
                                onClick={() => setMenuOpen(menuOpen === emp._id ? null : emp._id)}
                                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:bg-navy-800 hover:text-slate-600 dark:text-slate-400"
                                title="More actions"
                              >
                                <MoreHorizontal size={15} />
                              </button>
                              <AnimatePresence>
                                {menuOpen === emp._id && (
                                  <motion.div
                                    initial={{ opacity: 0, scale: 0.95, y: -4 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="absolute right-0 top-8 z-20 w-48 rounded-xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-900 py-1 shadow-lg"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <button
                                      onClick={() => handleResend(emp._id, emp.name)}
                                      disabled={resendingId === emp._id}
                                      className="flex w-full items-center gap-2 px-4 py-2 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:bg-navy-900/50"
                                    >
                                      {resendingId === emp._id ? (
                                        <Loader2 size={14} className="animate-spin" />
                                      ) : (
                                        <Mail size={14} />
                                      )}
                                      Resend Welcome Email
                                    </button>
                                    {emp.isActive && (
                                      <button
                                        onClick={() => handleDeactivate(emp._id, emp.name)}
                                        className="flex w-full items-center gap-2 px-4 py-2 text-sm text-rose-600 hover:bg-rose-50"
                                      >
                                        <UserX size={14} />
                                        Deactivate
                                      </button>
                                    )}
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="flex items-center justify-between border-t border-slate-100 dark:border-navy-800 px-4 py-3">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {pagination.total} employee{pagination.total !== 1 ? 's' : ''} total
                </p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => fetchEmployees(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className="rounded-lg p-1.5 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:bg-navy-800 disabled:opacity-40"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span className="px-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                    {pagination.page} / {pagination.pages}
                  </span>
                  <button
                    onClick={() => fetchEmployees(pagination.page + 1)}
                    disabled={pagination.page === pagination.pages}
                    className="rounded-lg p-1.5 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:bg-navy-800 disabled:opacity-40"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Create Modal */}
      <CreateEmployeeModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={() => fetchEmployees(1)}
      />

      {/* Close menus on outside click */}
      {menuOpen && (
        <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(null)} />
      )}


    </div>
  );
}
