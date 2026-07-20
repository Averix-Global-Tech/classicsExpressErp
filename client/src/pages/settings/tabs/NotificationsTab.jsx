import { useState, useCallback } from 'react';
import { Bell, BellOff, Mail, MonitorSmartphone, CalendarCheck, CheckSquare, AlertTriangle } from 'lucide-react';
import { useToast } from '../../../context/ToastContext';
import settingsService from '../../../services/settingsService';
import { cn } from '../../../utils/cn';

// ── Toggle Switch ─────────────────────────────────────────────────────────────
function ToggleSwitch({ checked, onChange, disabled }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2',
        checked ? 'bg-orange-600' : 'bg-slate-300',
        disabled && 'cursor-not-allowed opacity-60'
      )}
    >
      <span
        className={cn(
          'inline-block h-4 w-4 rounded-full bg-white dark:bg-navy-900 shadow-sm transition-transform duration-200',
          checked ? 'translate-x-6' : 'translate-x-1'
        )}
      />
    </button>
  );
}

// ── Notification Row ──────────────────────────────────────────────────────────
function NotifRow({ icon: Icon, label, description, checked, onChange, disabled }) {
  return (
    <div className="flex items-center justify-between gap-4 py-4">
      <div className="flex items-start gap-3">
        <div className={cn(
          'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
          checked ? 'bg-orange-50' : 'bg-slate-100 dark:bg-navy-800'
        )}>
          <Icon size={17} className={checked ? 'text-orange-600' : 'text-slate-400'} />
        </div>
        <div>
          <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{label}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">{description}</p>
        </div>
      </div>
      <ToggleSwitch checked={checked} onChange={onChange} disabled={disabled} />
    </div>
  );
}

const NOTIF_CONFIG = [
  {
    key: 'email',
    icon: Mail,
    label: 'Email Notifications',
    description: 'Receive important updates and alerts via email',
  },
  {
    key: 'inApp',
    icon: MonitorSmartphone,
    label: 'In-App Notifications',
    description: 'Show notification bell alerts inside the ERP',
  },
  {
    key: 'attendance',
    icon: CalendarCheck,
    label: 'Attendance Notifications',
    description: 'Clock-in/out reminders and attendance reports',
  },
  {
    key: 'tasks',
    icon: CheckSquare,
    label: 'Task Notifications',
    description: 'Task assignments, deadlines, and status updates',
  },
  {
    key: 'grievances',
    icon: AlertTriangle,
    label: 'Grievance Notifications',
    description: 'New grievances raised and status changes',
  },
];

export default function NotificationsTab({ settings, onSettingsChange }) {
  const toast = useToast();

  const defaultPrefs = settings?.notificationPrefs || {
    email: true,
    inApp: true,
    attendance: true,
    tasks: true,
    grievances: true,
  };

  const [prefs, setPrefs] = useState(defaultPrefs);
  const [saving, setSaving] = useState(null); // key of the pref being saved

  const handleToggle = useCallback(
    async (key, value) => {
      // Optimistic update
      setPrefs((prev) => ({ ...prev, [key]: value }));
      setSaving(key);
      try {
        await settingsService.updateNotifications({ [key]: value });
        toast.success(`${NOTIF_CONFIG.find((n) => n.key === key)?.label} ${value ? 'enabled' : 'disabled'}.`);
        onSettingsChange?.();
      } catch (err) {
        // Revert on failure
        setPrefs((prev) => ({ ...prev, [key]: !value }));
        toast.error(err?.message || 'Failed to update notification preferences.');
      } finally {
        setSaving(null);
      }
    },
    [toast, onSettingsChange]
  );

  const allEnabled = Object.values(prefs).every(Boolean);

  return (
    <div className="space-y-2">
      {/* Master toggle hint */}
      <div className="flex items-center justify-between rounded-xl border border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-900/50 px-4 py-3">
        <div className="flex items-center gap-2">
          {allEnabled ? (
            <Bell size={16} className="text-orange-600" />
          ) : (
            <BellOff size={16} className="text-slate-400" />
          )}
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
            {allEnabled ? 'All notifications are enabled' : 'Some notifications are disabled'}
          </p>
        </div>
        <span className={cn(
          'rounded-full px-2 py-0.5 text-xs font-medium',
          allEnabled
            ? 'bg-emerald-100 text-emerald-700'
            : 'bg-amber-100 text-amber-700'
        )}>
          {Object.values(prefs).filter(Boolean).length}/{NOTIF_CONFIG.length} active
        </span>
      </div>

      {/* Notification rows */}
      <div className="divide-y divide-slate-100 dark:divide-navy-700/50 rounded-xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-900 px-4">
        {NOTIF_CONFIG.map(({ key, icon, label, description }) => (
          <NotifRow
            key={key}
            icon={icon}
            label={label}
            description={description}
            checked={prefs[key]}
            onChange={(val) => handleToggle(key, val)}
            disabled={saving !== null}
          />
        ))}
      </div>
    </div>
  );
}
