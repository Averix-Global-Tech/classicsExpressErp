import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Camera, User, Briefcase, Mail, Phone, Hash, Calendar, Building2, Pencil, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import settingsService from '../../../services/settingsService';
import { Input, Button, Alert, Modal } from '../../../components/ui';
import { ROLE_LABELS } from '../../../utils/constants';
import { initials } from '../../../utils/format';
import { cn } from '../../../utils/cn';

const schema = yup.object({
  name: yup
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(80, 'Name is too long')
    .required('Full name is required'),
  phone: yup
    .string()
    .trim()
    .matches(/^\+?\d{10,15}$/, { message: 'Mobile number must contain between 10 and 15 digits', excludeEmptyString: true })
    .optional()
    .nullable(),
});

function ReadOnlyField({ icon: Icon, label, value, action }) {
  return (
    <div className="w-full">
      <div className="mb-1.5 flex items-center justify-between">
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">{label}</label>
        {action}
      </div>
      <div className="flex items-center gap-2.5 rounded-lg border border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-900/50 px-3 py-2 text-sm text-slate-500 dark:text-slate-400">
        <Icon size={15} className="shrink-0 text-slate-400" />
        <span className="truncate">{value || <span className="text-slate-400 italic">Not set</span>}</span>
      </div>
    </div>
  );
}

// ── OTP Input — 6 individual digit boxes (mirrors TwoFactorTab's) ───────────
function OtpInput({ value, onChange, disabled }) {
  const digits = (value + '      ').slice(0, 6).split('');

  const handleKey = (e, idx) => {
    if (e.key === 'Backspace') {
      const next = value.slice(0, idx) + value.slice(idx + 1);
      onChange(next);
      if (idx > 0) document.getElementById(`email-otp-${idx - 1}`)?.focus();
    } else if (/^\d$/.test(e.key)) {
      const next = value.slice(0, idx) + e.key + value.slice(idx + 1);
      onChange(next.slice(0, 6));
      if (idx < 5) document.getElementById(`email-otp-${idx + 1}`)?.focus();
    }
    e.preventDefault();
  };

  return (
    <div className="flex gap-2">
      {digits.map((d, idx) => (
        <input
          key={idx}
          id={`email-otp-${idx}`}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={d.trim()}
          disabled={disabled}
          onKeyDown={(e) => handleKey(e, idx)}
          onChange={() => {}}
          onFocus={(e) => e.target.select()}
          className={cn(
            'h-12 w-11 rounded-lg border text-center text-lg font-semibold transition-all',
            'focus:border-orange-500 focus:ring-2 focus:ring-orange-100 focus:outline-none',
            d.trim() ? 'border-orange-400 bg-orange-50 text-orange-700' : 'border-slate-300 dark:border-navy-600 bg-white dark:bg-navy-900 text-slate-800 dark:text-slate-200',
            disabled && 'cursor-not-allowed opacity-60'
          )}
        />
      ))}
    </div>
  );
}

// ── Change Email Modal — password + new email, then OTP verification ────────
function ChangeEmailModal({ onClose, onChanged }) {
  const toast = useToast();
  const [step, setStep] = useState('form'); // form | otp
  const [newEmail, setNewEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRequest = async () => {
    setError('');
    if (!newEmail || !password) {
      setError('Enter your new email and current password.');
      return;
    }
    setLoading(true);
    try {
      await settingsService.requestEmailChange(newEmail, password);
      setStep('otp');
      setOtp('');
      toast.success(`Verification code sent to ${newEmail}`);
    } catch (err) {
      setError(err?.message || 'Failed to start email change.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (otp.length < 6) { setError('Enter the full 6-digit code.'); return; }
    setError('');
    setLoading(true);
    try {
      const result = await settingsService.verifyEmailChange(otp);
      toast.success('Email address updated successfully!');
      onChanged(result.user);
    } catch (err) {
      setError(err?.message || 'Invalid code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open
      onClose={loading ? undefined : onClose}
      title="Change Email Address"
      description={
        step === 'form'
          ? 'Enter your new email and confirm with your current password.'
          : `Enter the 6-digit code sent to ${newEmail}.`
      }
      footer={
        step === 'form' ? (
          <>
            <Button variant="secondary" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button onClick={handleRequest} loading={loading}>Send Code</Button>
          </>
        ) : (
          <>
            <Button variant="secondary" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button onClick={handleVerify} loading={loading} disabled={otp.length < 6}>
              Verify & Update
            </Button>
          </>
        )
      }
    >
      {error && <Alert variant="error" className="mb-4">{error}</Alert>}

      {step === 'form' ? (
        <div className="space-y-4">
          <Input
            label="New Email Address"
            type="email"
            placeholder="you@example.com"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            autoComplete="email"
          />
          <div className="relative">
            <Input
              label="Current Password"
              type={showPwd ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShowPwd((v) => !v)}
              className="absolute right-3 top-[34px] text-slate-400 hover:text-slate-600 dark:text-slate-400"
            >
              {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <OtpInput value={otp} onChange={setOtp} disabled={loading} />
          <button
            type="button"
            onClick={handleRequest}
            className="text-sm text-orange-600 hover:underline"
            disabled={loading}
          >
            Resend code
          </button>
        </div>
      )}
    </Modal>
  );
}

export default function ProfileTab({ settings }) {
  const { user, setUser } = useAuth();
  const toast = useToast();
  const fileInputRef = useRef(null);
  const [serverError, setServerError] = useState('');
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [showEmailModal, setShowEmailModal] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting, isDirty } } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      name: user?.name || '',
      phone: user?.phone || '',
    },
  });

  const onSubmit = async (values) => {
    setServerError('');
    try {
      const result = await settingsService.updateProfile(values);
      setUser(result.user);
      toast.success('Profile updated successfully!');
    } catch (err) {
      setServerError(err?.message || 'Failed to update profile.');
    }
  };

  const handleAvatarClick = () => fileInputRef.current?.click();

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const preview = URL.createObjectURL(file);
    setAvatarPreview(preview);
    // Avatar upload is stubbed — show a friendly info toast
    toast.success('Photo upload will be available soon. Profile picture updated locally.');
  };

  const joiningDate = user?.joiningDate
    ? new Date(user.joiningDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })
    : null;

  return (
    <div className="space-y-6">
      {/* Avatar section */}
      <div className="flex items-center gap-6">
        <div className="relative group cursor-pointer" onClick={handleAvatarClick}>
          {avatarPreview || user?.photo ? (
            <img
              src={avatarPreview || user.photo}
              alt={user?.name}
              className="h-20 w-20 rounded-full object-cover ring-4 ring-orange-100"
            />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-orange-700 text-2xl font-bold text-white ring-4 ring-orange-100">
              {initials(user?.name)}
            </div>
          )}
          <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
            <Camera size={20} className="text-white" />
          </div>
        </div>
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
        <div>
          <p className="text-lg font-semibold text-slate-800 dark:text-slate-200">{user?.name}</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">{user?.email}</p>
          <span className="mt-1 inline-flex items-center rounded-full bg-orange-50 px-2.5 py-0.5 text-xs font-medium text-orange-700">
            {ROLE_LABELS[user?.role] || user?.role}
          </span>
        </div>
      </div>

      {/* Editable fields */}
      <div>
        <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          <User size={14} />
          Personal Information
        </h3>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {serverError && <Alert variant="error">{serverError}</Alert>}

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Full Name"
              required
              placeholder="Enter your full name"
              error={errors.name?.message}
              {...register('name')}
            />
            <Input
              label="Mobile Number"
              type="tel"
              placeholder="+919000000000"
              error={errors.phone?.message}
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
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <ReadOnlyField
              icon={Mail}
              label="Email Address"
              value={user?.email}
              action={
                <button
                  type="button"
                  onClick={() => setShowEmailModal(true)}
                  className="flex items-center gap-1 text-xs font-medium text-orange-600 hover:text-orange-700"
                >
                  <Pencil size={12} /> Change
                </button>
              }
            />
            <ReadOnlyField
              icon={Hash}
              label="Employee ID"
              value={user?.employeeId}
            />
          </div>

          <div className="mt-2">
            <Button type="submit" loading={isSubmitting} disabled={!isDirty}>
              Save Changes
            </Button>
          </div>
        </form>
      </div>

      {showEmailModal && (
        <ChangeEmailModal
          onClose={() => setShowEmailModal(false)}
          onChanged={(updatedUser) => {
            setUser(updatedUser);
            setShowEmailModal(false);
          }}
        />
      )}

      {/* Read-only employee information */}
      <div className="border-t border-slate-100 dark:border-navy-800 pt-6">
        <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          <Briefcase size={14} />
          Employee Information
          <span className="ml-1 rounded bg-slate-100 dark:bg-navy-800 px-1.5 py-0.5 text-[10px] text-slate-400">Managed by Admin</span>
        </h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <ReadOnlyField icon={Briefcase} label="Department" value={user?.department} />
          <ReadOnlyField icon={Building2} label="Designation" value={user?.designation} />
          <ReadOnlyField icon={Calendar} label="Joining Date" value={joiningDate} />
          <ReadOnlyField icon={Phone} label="Employment Type" value={user?.employmentType} />
        </div>
      </div>
    </div>
  );
}
