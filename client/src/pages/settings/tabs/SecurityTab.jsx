import { useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Lock, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import authService from '../../../services/authService';
import { Input, Button, Alert } from '../../../components/ui';
import { cn } from '../../../utils/cn';

const schema = yup.object({
  currentPassword: yup.string().required('Current password is required'),
  password: yup
    .string()
    .min(8, 'Must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,64}$/, {
      message: 'Must include uppercase, lowercase, number, and symbol.',
    })
    .required('New password is required'),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('password')], 'Passwords do not match')
    .required('Please confirm your password'),
});

// ── Password Strength Scorer ─────────────────────────────────────────────────
function scorePassword(pwd) {
  if (!pwd) return 0;
  let score = 0;
  if (pwd.length >= 8) score++;
  if (pwd.length >= 12) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[a-z]/.test(pwd)) score++;
  if (/\d/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  return score; // 0–6
}

const STRENGTH_LEVELS = [
  { label: 'Too short', color: 'bg-rose-400', textColor: 'text-rose-600', min: 0 },
  { label: 'Weak', color: 'bg-rose-400', textColor: 'text-rose-600', min: 1 },
  { label: 'Fair', color: 'bg-amber-400', textColor: 'text-amber-600', min: 3 },
  { label: 'Good', color: 'bg-yellow-400', textColor: 'text-yellow-600', min: 4 },
  { label: 'Strong', color: 'bg-emerald-400', textColor: 'text-emerald-600', min: 5 },
  { label: 'Very Strong', color: 'bg-emerald-500', textColor: 'text-emerald-700', min: 6 },
];

function getStrengthInfo(score) {
  for (let i = STRENGTH_LEVELS.length - 1; i >= 0; i--) {
    if (score >= STRENGTH_LEVELS[i].min) return STRENGTH_LEVELS[i];
  }
  return STRENGTH_LEVELS[0];
}

function PasswordStrengthBar({ password }) {
  if (!password) return null;
  const score = scorePassword(password);
  const strength = getStrengthInfo(score);
  const filledBars = Math.max(1, Math.ceil((score / 6) * 4));

  return (
    <div className="mt-2 space-y-1.5">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={cn(
              'h-1.5 flex-1 rounded-full transition-all duration-300',
              i <= filledBars ? strength.color : 'bg-slate-200'
            )}
          />
        ))}
      </div>
      <p className={cn('text-xs font-medium', strength.textColor)}>{strength.label}</p>
    </div>
  );
}

function PasswordInput({ label, error, hint, showToggle = true, ...props }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Input
        label={label}
        type={show ? 'text' : 'password'}
        error={error}
        hint={hint}
        {...props}
      />
      {showToggle && (
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setShow((v) => !v)}
          className="absolute right-3 top-[34px] text-slate-400 hover:text-slate-600 dark:text-slate-400 transition-colors"
        >
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      )}
    </div>
  );
}

export default function SecurityTab() {
  const { logout } = useAuth();
  const toast = useToast();
  const [serverError, setServerError] = useState('');
  const [success, setSuccess] = useState(false);
  const [watchedPassword, setWatchedPassword] = useState('');

  const { register, handleSubmit, watch, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: yupResolver(schema),
  });

  // Watch the new password for the strength bar
  const newPassword = watch('password', '');

  const onSubmit = async (values) => {
    setServerError('');
    setSuccess(false);
    try {
      await authService.changePassword({
        currentPassword: values.currentPassword,
        password: values.password,
      });
      setSuccess(true);
      reset();
      toast.success('Password changed. Signing you out...');
      setTimeout(() => logout(), 2000);
    } catch (err) {
      setServerError(err?.message || 'Failed to change password.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
        <div className="flex items-start gap-3">
          <ShieldCheck size={18} className="mt-0.5 shrink-0 text-amber-600" />
          <div>
            <p className="text-sm font-medium text-amber-800">Secure Password Rules</p>
            <ul className="mt-1 space-y-0.5 text-xs text-amber-700">
              <li>• At least 8 characters long</li>
              <li>• Contains uppercase and lowercase letters</li>
              <li>• Contains at least one number and one symbol</li>
            </ul>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="max-w-md space-y-4">
        {success && (
          <Alert variant="success">
            Password changed successfully. Redirecting to sign in...
          </Alert>
        )}
        {serverError && <Alert variant="error">{serverError}</Alert>}

        <PasswordInput
          label="Current Password"
          autoComplete="current-password"
          error={errors.currentPassword?.message}
          {...register('currentPassword')}
        />

        <div>
          <PasswordInput
            label="New Password"
            autoComplete="new-password"
            error={errors.password?.message}
            {...register('password')}
          />
          <PasswordStrengthBar password={newPassword} />
        </div>

        <PasswordInput
          label="Confirm New Password"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />

        <div className="pt-2">
          <Button type="submit" loading={isSubmitting} className="flex items-center gap-2">
            <Lock size={15} />
            Update Password
          </Button>
        </div>
      </form>
    </div>
  );
}
