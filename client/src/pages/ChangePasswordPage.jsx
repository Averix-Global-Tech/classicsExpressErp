import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { ShieldCheck, Eye, EyeOff, CheckCircle2, XCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import authService from '../services/authService';
import { Input, Button, Alert } from '../components/ui';

const schema = yup.object({
  currentPassword: yup.string().required('Current (temporary) password is required.'),
  password: yup
    .string()
    .min(8, 'At least 8 characters required.')
    .max(64)
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,64}$/, {
      message: 'Must include uppercase, lowercase, number and symbol.',
    })
    .required('New password is required.'),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('password')], 'Passwords do not match.')
    .required('Please confirm your new password.'),
});

const STRENGTH_RULES = [
  { label: 'At least 8 characters', test: (v) => v.length >= 8 },
  { label: 'Uppercase letter (A–Z)', test: (v) => /[A-Z]/.test(v) },
  { label: 'Lowercase letter (a–z)', test: (v) => /[a-z]/.test(v) },
  { label: 'Number (0–9)', test: (v) => /\d/.test(v) },
  { label: 'Special character (@#$…)', test: (v) => /[^A-Za-z0-9]/.test(v) },
];

function StrengthIndicator({ value }) {
  const passed = STRENGTH_RULES.filter((r) => r.test(value)).length;
  const width = `${(passed / STRENGTH_RULES.length) * 100}%`;
  const color =
    passed <= 1 ? 'bg-rose-500' : passed <= 3 ? 'bg-amber-400' : 'bg-emerald-500';

  return (
    <div className="mt-2 space-y-2">
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
        <div
          className={`h-full rounded-full transition-all duration-300 ${color}`}
          style={{ width }}
        />
      </div>
      <ul className="grid grid-cols-1 gap-1 sm:grid-cols-2">
        {STRENGTH_RULES.map((rule) => {
          const ok = rule.test(value);
          return (
            <li key={rule.label} className="flex items-center gap-1.5 text-xs">
              {ok ? (
                <CheckCircle2 size={12} className="shrink-0 text-emerald-500" />
              ) : (
                <XCircle size={12} className="shrink-0 text-slate-300" />
              )}
              <span className={ok ? 'text-emerald-700' : 'text-slate-400'}>{rule.label}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default function ChangePasswordPage() {
  const { logout, refresh } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: yupResolver(schema) });

  const newPasswordValue = watch('password', '');

  const onSubmit = async ({ currentPassword, password }) => {
    setServerError('');
    try {
      await authService.changePassword({ currentPassword, password });
      toast.success('Password changed! Please sign in with your new password.');
      // Server clears cookies; also clear local state then redirect to login
      await logout();
      navigate('/login', { replace: true });
    } catch (err) {
      setServerError(err?.message || 'Failed to change password. Please try again.');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-slate-100 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-navy-900 shadow-xl ring-1 ring-slate-200">
        {/* Header */}
        <div className="rounded-t-2xl bg-gradient-to-r from-blue-700 to-blue-500 px-8 py-7 text-white">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-white/20">
            <ShieldCheck size={24} />
          </div>
          <h1 className="text-xl font-bold">Change Your Password</h1>
          <p className="mt-1 text-sm text-blue-100">
            You must set a new password before accessing the ERP system.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 px-8 py-7">
          {serverError && <Alert variant="error">{serverError}</Alert>}

          <Alert variant="warning">
            This is your temporary password. You cannot access the ERP until you change it.
          </Alert>

          {/* Current (temp) password */}
          <div className="relative">
            <Input
              id="currentPassword"
              label="Temporary Password"
              type={showCurrent ? 'text' : 'password'}
              placeholder="Enter the password from your email"
              autoComplete="current-password"
              error={errors.currentPassword?.message}
              {...register('currentPassword')}
            />
            <button
              type="button"
              onClick={() => setShowCurrent((v) => !v)}
              className="absolute right-3 top-9 text-slate-400 hover:text-slate-600 dark:text-slate-400"
              tabIndex={-1}
              aria-label={showCurrent ? 'Hide password' : 'Show password'}
            >
              {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          {/* New password */}
          <div>
            <div className="relative">
              <Input
                id="password"
                label="New Password"
                type={showNew ? 'text' : 'password'}
                placeholder="Create a strong password"
                autoComplete="new-password"
                error={errors.password?.message}
                {...register('password')}
              />
              <button
                type="button"
                onClick={() => setShowNew((v) => !v)}
                className="absolute right-3 top-9 text-slate-400 hover:text-slate-600 dark:text-slate-400"
                tabIndex={-1}
                aria-label={showNew ? 'Hide password' : 'Show password'}
              >
                {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {newPasswordValue && <StrengthIndicator value={newPasswordValue} />}
          </div>

          {/* Confirm */}
          <Input
            id="confirmPassword"
            label="Confirm New Password"
            type="password"
            placeholder="Re-enter your new password"
            autoComplete="new-password"
            error={errors.confirmPassword?.message}
            {...register('confirmPassword')}
          />

          <Button type="submit" loading={isSubmitting} className="w-full" size="lg">
            Set New Password & Continue
          </Button>
        </form>
      </div>
    </div>
  );
}
