import { useState } from 'react';
import { Shield, ShieldCheck, ShieldOff, Smartphone, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import settingsService from '../../../services/settingsService';
import { Button, Input, Alert } from '../../../components/ui';
import { cn } from '../../../utils/cn';

// ── OTP Input — 6 individual digit boxes ────────────────────────────────────
function OtpInput({ value, onChange, disabled }) {
  const digits = (value + '      ').slice(0, 6).split('');

  const handleKey = (e, idx) => {
    if (e.key === 'Backspace') {
      const next = value.slice(0, idx) + value.slice(idx + 1);
      onChange(next);
      if (idx > 0) document.getElementById(`otp-${idx - 1}`)?.focus();
    } else if (/^\d$/.test(e.key)) {
      const next = value.slice(0, idx) + e.key + value.slice(idx + 1);
      onChange(next.slice(0, 6));
      if (idx < 5) document.getElementById(`otp-${idx + 1}`)?.focus();
    }
    e.preventDefault();
  };

  return (
    <div className="flex gap-2">
      {digits.map((d, idx) => (
        <input
          key={idx}
          id={`otp-${idx}`}
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

// ── Disable 2FA Modal ────────────────────────────────────────────────────────
function Disable2faModal({ onClose, onDisabled }) {
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const toast = useToast();

  const handleDisable = async () => {
    if (!password) { setError('Password is required.'); return; }
    setLoading(true);
    setError('');
    try {
      await settingsService.disable2fa(password);
      toast.success('Two-factor authentication has been disabled.');
      onDisabled();
    } catch (err) {
      setError(err?.message || 'Failed to disable 2FA.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-navy-900 p-6 shadow-xl">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-rose-100">
          <ShieldOff size={22} className="text-rose-600" />
        </div>
        <h3 className="mb-1 text-base font-semibold text-slate-800 dark:text-slate-200">Disable Two-Factor Auth</h3>
        <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
          Enter your current password to confirm. This will make your account less secure.
        </p>
        {error && <Alert variant="error" className="mb-3">{error}</Alert>}
        <div className="relative mb-4">
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
        <div className="flex gap-2">
          <Button variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
          <Button variant="danger" loading={loading} onClick={handleDisable} className="flex-1">
            Disable 2FA
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Main 2FA Tab ─────────────────────────────────────────────────────────────
export default function TwoFactorTab({ settings, onSettingsChange }) {
  const { user } = useAuth();
  const toast = useToast();

  // localEnabled overrides the prop immediately after user action so the
  // status banner updates instantly without waiting for the async parent re-fetch.
  const [localEnabled, setLocalEnabled] = useState(null);
  const isEnabled = localEnabled ?? (settings?.twoFactor?.enabled || user?.twoFactorEnabled || false);

  const [step, setStep] = useState('idle'); // idle | requested
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showDisableModal, setShowDisableModal] = useState(false);

  const handleRequestOtp = async () => {
    setError('');
    setLoading(true);
    try {
      await settingsService.request2faOtp();
      setStep('requested');
      setOtp('');
      toast.success(`OTP sent to ${user?.email}`);
    } catch (err) {
      setError(err?.message || 'Failed to send OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (otp.length < 6) { setError('Please enter the full 6-digit OTP.'); return; }
    setError('');
    setLoading(true);
    try {
      await settingsService.verify2faOtp(otp);
      setLocalEnabled(true); // update status banner immediately
      toast.success('Two-factor authentication enabled!');
      setStep('idle');
      setOtp('');
      onSettingsChange?.();
    } catch (err) {
      setError(err?.message || 'Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDisabled = () => {
    setLocalEnabled(false); // update status banner immediately
    setShowDisableModal(false);
    onSettingsChange?.();
  };

  return (
    <div className="space-y-6">
      {/* Status Banner */}
      <div className={cn(
        'flex items-center gap-4 rounded-xl border p-4',
        isEnabled
          ? 'border-emerald-200 bg-emerald-50'
          : 'border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-900/50'
      )}>
        <div className={cn(
          'flex h-12 w-12 shrink-0 items-center justify-center rounded-full',
          isEnabled ? 'bg-emerald-100' : 'bg-slate-200'
        )}>
          {isEnabled
            ? <ShieldCheck size={24} className="text-emerald-600" />
            : <Shield size={24} className="text-slate-500 dark:text-slate-400" />
          }
        </div>
        <div className="flex-1">
          <p className="font-semibold text-slate-800 dark:text-slate-200">
            Two-Factor Authentication is{' '}
            <span className={isEnabled ? 'text-emerald-600' : 'text-slate-500 dark:text-slate-400'}>
              {isEnabled ? 'Enabled' : 'Disabled'}
            </span>
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {isEnabled
              ? 'Your account has an extra layer of security via email OTP.'
              : 'Add an extra layer of security by enabling email OTP verification.'}
          </p>
        </div>
        {isEnabled && (
          <Button
            variant="danger"
            size="sm"
            onClick={() => setShowDisableModal(true)}
          >
            Disable
          </Button>
        )}
      </div>

      {/* Enable Flow */}
      {!isEnabled && (
        <div className="rounded-xl border border-slate-200 dark:border-navy-700 p-5 space-y-4">
          <div className="flex items-start gap-3">
            <Smartphone size={18} className="mt-0.5 shrink-0 text-orange-600" />
            <div>
              <p className="font-medium text-slate-800 dark:text-slate-200">Enable via Email OTP</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                We&apos;ll send a 6-digit code to <strong>{user?.email}</strong> each time
                you sign in from a new device.
              </p>
            </div>
          </div>

          {error && <Alert variant="error">{error}</Alert>}

          {step === 'idle' && (
            <Button onClick={handleRequestOtp} loading={loading}>
              Send OTP to My Email
            </Button>
          )}

          {step === 'requested' && (
            <div className="space-y-4">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Enter the 6-digit code sent to <strong>{user?.email}</strong>.
              </p>


              <OtpInput value={otp} onChange={setOtp} disabled={loading} />

              <div className="flex items-center gap-3">
                <Button onClick={handleVerify} loading={loading} disabled={otp.length < 6}>
                  Verify & Enable 2FA
                </Button>
                <button
                  type="button"
                  onClick={handleRequestOtp}
                  className="text-sm text-orange-600 hover:underline"
                  disabled={loading}
                >
                  Resend OTP
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Recovery future-ready */}
      <div className="rounded-xl border border-dashed border-slate-200 dark:border-navy-700 p-4">
        <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Recovery Options</p>
        <p className="text-sm text-slate-400">
          Recovery codes and backup methods will be available in a future update.
        </p>
      </div>

      {showDisableModal && (
        <Disable2faModal
          onClose={() => setShowDisableModal(false)}
          onDisabled={handleDisabled}
        />
      )}
    </div>
  );
}
