import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Mail, Phone, Building2, Calendar, Briefcase, User,
  RefreshCw, UserX, UserCheck, Loader2, Shield, Edit2, Save, X,
} from 'lucide-react';
import { motion } from 'framer-motion';
import employeeService from '../services/employeeService';
import { useToast } from '../context/ToastContext';
import { Button, Badge, Spinner } from '../components/ui';

const ROLE_COLORS = {
  employee: 'grey',
  hr_manager: 'blue',
  branch_manager: 'indigo',
  accountant: 'green',
  dispatcher: 'yellow',
  customer_service: 'orange',
};

const ROLE_LABELS = {
  employee: 'Employee',
  hr_manager: 'HR Manager',
  branch_manager: 'Branch Manager',
  accountant: 'Accountant',
  dispatcher: 'Dispatcher',
  customer_service: 'Customer Service',
};

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-slate-100 dark:border-navy-800 last:border-0">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
        <Icon size={15} />
      </div>
      <div>
        <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">{label}</p>
        <p className="mt-0.5 text-sm font-medium text-slate-800 dark:text-slate-200">{value || '—'}</p>
      </div>
    </div>
  );
}

export default function EmployeeDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [resending, setResending] = useState(false);
  const [deactivating, setDeactivating] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [tempPassword, setTempPassword] = useState(null);
  const [copied, setCopied] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await employeeService.get(id);
      setEmployee(data.employee);
    } catch {
      toast.error('Employee not found.');
      navigate('/employees');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const handleResend = async () => {
    setResending(true);
    setPreviewUrl(null);
    setTempPassword(null);
    try {
      const res = await employeeService.resendEmail(id);
      toast.success(
        res.emailSent
          ? 'Welcome email resent with a new temporary password.'
          : 'New temporary password generated. Email delivery failed — share it directly below.'
      );
      if (res.emailPreviewUrl) {
        setPreviewUrl(res.emailPreviewUrl);
      }
      if (res.tempPassword) {
        setTempPassword(res.tempPassword);
      }
    } catch (err) {
      toast.error(err?.message || 'Failed to resend email.');
    } finally {
      setResending(false);
    }
  };

  const handleCopyPassword = async () => {
    if (!tempPassword) return;
    await navigator.clipboard.writeText(tempPassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleToggleActive = async () => {
    const action = employee.isActive ? 'deactivate' : 're-activate';
    if (!window.confirm(`Are you sure you want to ${action} ${employee.name}?`)) return;
    setDeactivating(true);
    try {
      if (employee.isActive) {
        await employeeService.deactivate(id);
        toast.success(`${employee.name} has been deactivated.`);
      } else {
        await employeeService.update(id, { isActive: true });
        toast.success(`${employee.name} has been re-activated.`);
      }
      load();
    } catch (err) {
      toast.error(err?.message || 'Action failed.');
    } finally {
      setDeactivating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size={28} />
      </div>
    );
  }

  if (!employee) return null;

  const joinDate = employee.joiningDate
    ? new Date(employee.joiningDate).toLocaleDateString('en-IN', {
        day: '2-digit', month: 'long', year: 'numeric',
      })
    : null;

  const createdDate = new Date(employee.createdAt).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  });

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <button
        onClick={() => navigate('/employees')}
        className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:text-slate-200 transition-colors"
      >
        <ArrowLeft size={16} />
        Back to Employees
      </button>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid gap-6 lg:grid-cols-3"
      >
        {/* ── Left: Profile Card ── */}
        <div className="lg:col-span-1">
          <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-900 shadow-sm">
            {/* Avatar strip */}
            <div className="bg-gradient-to-br from-blue-700 to-blue-500 px-6 py-8 text-center">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-white/20 text-3xl font-bold text-white shadow-lg">
                {employee.name?.[0]?.toUpperCase()}
              </div>
              <h2 className="mt-4 text-lg font-bold text-white">{employee.name}</h2>
              <p className="text-sm text-blue-100">{employee.designation || 'Employee'}</p>
              <div className="mt-3">
                <Badge color={ROLE_COLORS[employee.role] || 'grey'}>
                  {ROLE_LABELS[employee.role] || employee.role}
                </Badge>
              </div>
            </div>

            {/* Employee ID + Status */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-navy-800 px-6 py-3">
              <span className="rounded-md bg-slate-100 dark:bg-navy-800 px-2 py-1 font-mono text-xs font-semibold text-slate-600 dark:text-slate-400">
                {employee.employeeId}
              </span>
              {employee.isActive ? (
                <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-600">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Active
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-xs font-medium text-rose-500">
                  <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
                  Inactive
                </span>
              )}
            </div>

            {/* Quick info */}
            <div className="px-6 py-2">
              <InfoRow icon={Mail} label="Email" value={employee.email} />
              <InfoRow icon={Phone} label="Phone" value={employee.phone} />
              <InfoRow icon={Building2} label="Department" value={employee.department} />
              <InfoRow icon={Briefcase} label="Employment Type" value={
                employee.employmentType
                  ? employee.employmentType.charAt(0).toUpperCase() + employee.employmentType.slice(1)
                  : null
              } />
              <InfoRow icon={Calendar} label="Joining Date" value={joinDate} />
              <InfoRow
                icon={User}
                label="Reporting Manager"
                value={
                  employee.reportingManager
                    ? `${employee.reportingManager.name} (${employee.reportingManager.employeeId})`
                    : null
                }
              />
            </div>

            {/* Account created */}
            <div className="px-6 pb-4">
              <p className="text-xs text-slate-400">Account created: {createdDate}</p>
            </div>
          </div>
        </div>

        {/* ── Right: Actions + Security ── */}
        <div className="space-y-6 lg:col-span-2">
          {/* Temporary Password (shown when email delivery is unreliable) */}
          {tempPassword && (
            <div className="rounded-2xl border border-blue-200 bg-blue-50 p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-blue-800">🔑 Temporary Password</h3>
              <p className="mt-1 text-sm text-blue-600">
                Email delivery is currently unreliable due to a network issue on the hosting
                provider. Please copy this password and share it with the employee directly.
              </p>
              <div className="mt-3 flex items-center gap-2">
                <code className="flex-1 select-all rounded-lg border border-blue-200 bg-white px-4 py-2 text-sm font-mono text-blue-900">
                  {tempPassword}
                </code>
                <button
                  type="button"
                  onClick={handleCopyPassword}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700"
                >
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>
          )}

          {/* Email Preview Alert (Dev Mode) */}
          {previewUrl && (
            <div className="rounded-2xl border border-orange-200 bg-orange-50 p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-orange-800">📧 Development Mode Email Sent</h3>
              <p className="mt-1 text-sm text-orange-600">
                Click below to view the Ethereal email and copy the new temporary password.
              </p>
              <a
                href={previewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-block rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-orange-700"
              >
                Open Email Preview
              </a>
            </div>
          )}

          {/* Quick Actions */}
          <div className="rounded-2xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-900 p-6 shadow-sm">
            <h3 className="mb-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Quick Actions</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              {/* Resend Welcome Email */}
              <button
                onClick={handleResend}
                disabled={resending}
                className="flex items-center gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4 text-left transition hover:bg-blue-100 disabled:opacity-60"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white">
                  {resending ? <Loader2 size={18} className="animate-spin" /> : <Mail size={18} />}
                </div>
                <div>
                  <p className="text-sm font-semibold text-blue-800">Resend Welcome Email</p>
                  <p className="text-xs text-blue-500">Generate new temp password & resend</p>
                </div>
              </button>

              {/* Deactivate / Re-activate */}
              <button
                onClick={handleToggleActive}
                disabled={deactivating}
                className={`flex items-center gap-3 rounded-xl border p-4 text-left transition disabled:opacity-60 ${
                  employee.isActive
                    ? 'border-rose-200 bg-rose-50 hover:bg-rose-100'
                    : 'border-emerald-200 bg-emerald-50 hover:bg-emerald-100'
                }`}
              >
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white ${
                    employee.isActive ? 'bg-rose-500' : 'bg-emerald-600'
                  }`}
                >
                  {deactivating ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : employee.isActive ? (
                    <UserX size={18} />
                  ) : (
                    <UserCheck size={18} />
                  )}
                </div>
                <div>
                  <p className={`text-sm font-semibold ${employee.isActive ? 'text-rose-800' : 'text-emerald-800'}`}>
                    {employee.isActive ? 'Deactivate Account' : 'Re-activate Account'}
                  </p>
                  <p className={`text-xs ${employee.isActive ? 'text-rose-500' : 'text-emerald-500'}`}>
                    {employee.isActive
                      ? 'Revoke ERP access immediately'
                      : 'Restore ERP access'}
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* Security Info */}
          <div className="rounded-2xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-900 p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Shield size={16} className="text-slate-400" />
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Security Status</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-lg bg-slate-50 dark:bg-navy-900/50 px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Password Status</p>
                  <p className="text-xs text-slate-400">First-login password change requirement</p>
                </div>
                {employee.mustChangePassword ? (
                  <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                    Pending Change
                  </span>
                ) : (
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                    Password Set
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between rounded-lg bg-slate-50 dark:bg-navy-900/50 px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Last Login</p>
                  <p className="text-xs text-slate-400">Most recent authenticated session</p>
                </div>
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  {employee.lastLoginAt
                    ? new Date(employee.lastLoginAt).toLocaleString('en-IN', {
                        day: '2-digit', month: 'short', year: 'numeric',
                        hour: '2-digit', minute: '2-digit',
                      })
                    : 'Never logged in'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
