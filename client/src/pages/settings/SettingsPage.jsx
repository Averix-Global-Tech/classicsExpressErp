import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Lock,
  Shield,
  Bell,
  SlidersHorizontal,
  Settings,
  ChevronRight,
} from 'lucide-react';
import { Spinner } from '../../components/ui';
import { cn } from '../../utils/cn';
import settingsService from '../../services/settingsService';
import ProfileTab from './tabs/ProfileTab';
import SecurityTab from './tabs/SecurityTab';
import TwoFactorTab from './tabs/TwoFactorTab';
import NotificationsTab from './tabs/NotificationsTab';
import PreferencesTab from './tabs/PreferencesTab';

const TABS = [
  {
    id: 'profile',
    label: 'Profile',
    icon: User,
    description: 'Manage your personal info & avatar',
  },
  {
    id: 'security',
    label: 'Security',
    icon: Lock,
    description: 'Change your password',
  },
  {
    id: 'two-factor',
    label: 'Two-Factor Auth',
    icon: Shield,
    description: 'Enable email OTP verification',
  },
  {
    id: 'notifications',
    label: 'Notifications',
    icon: Bell,
    description: 'Control your alert preferences',
  },
  {
    id: 'preferences',
    label: 'Preferences',
    icon: SlidersHorizontal,
    description: 'Theme, language & timezone',
    soon: true,
  },
];

const tabVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.2, ease: 'easeOut' } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.15 } },
};

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile');
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadSettings = useCallback(async () => {
    try {
      const data = await settingsService.getSettings();
      setSettings(data?.settings);
    } catch {
      /* fail silently — tabs handle their own errors */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const activeTabInfo = TABS.find((t) => t.id === activeTab);
  const ActiveIcon = activeTabInfo?.icon;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <Settings className="text-orange-600" size={24} />
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-200">Settings</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Manage your account, security, and preferences</p>
        </div>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Spinner size={28} />
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {/* ── Horizontal Tab Bar ────────────────────────────────────────────────── */}
          <nav className="w-full overflow-x-auto rounded-xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-900 shadow-card custom-scrollbar">
            <ul className="flex flex-nowrap items-center divide-x divide-slate-100 dark:divide-navy-700/50 min-w-max">
              {TABS.map(({ id, label, icon: Icon, soon }) => {
                const isActive = activeTab === id;
                return (
                  <li key={id} className="flex-1">
                    <button
                      type="button"
                      onClick={() => setActiveTab(id)}
                      className={cn(
                        'group flex w-full items-center justify-center gap-2.5 px-6 py-4 text-center text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-orange-600 text-white'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-navy-900/50 hover:text-slate-900 dark:hover:text-white'
                      )}
                    >
                      <Icon
                        size={16}
                        className={cn(
                          'shrink-0 transition-colors',
                          isActive ? 'text-white' : 'text-slate-400 group-hover:text-orange-600'
                        )}
                      />
                      <span className="whitespace-nowrap">{label}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* ── Tab Content ─────────────────────────────────────────────────── */}
          <div className="w-full">
            <div className="rounded-xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-900 shadow-card">
              {/* Content header */}
              <div className="border-b border-slate-100 dark:border-navy-800 px-6 py-4">
                <div className="flex items-center gap-2.5">
                  {ActiveIcon && (
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-50">
                      <ActiveIcon size={16} className="text-orange-600" />
                    </div>
                  )}
                  <div>
                    <h2 className="text-base font-semibold text-slate-800 dark:text-slate-200">{activeTabInfo?.label}</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{activeTabInfo?.description}</p>
                  </div>
                </div>
              </div>

              {/* Animated content */}
              <div className="p-6">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    variants={tabVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                  >
                    {activeTab === 'profile' && (
                      <ProfileTab settings={settings} />
                    )}
                    {activeTab === 'security' && (
                      <SecurityTab />
                    )}
                    {activeTab === 'two-factor' && (
                      <TwoFactorTab
                        settings={settings}
                        onSettingsChange={loadSettings}
                      />
                    )}
                    {activeTab === 'notifications' && (
                      <NotificationsTab
                        settings={settings}
                        onSettingsChange={loadSettings}
                      />
                    )}
                    {activeTab === 'preferences' && (
                      <PreferencesTab settings={settings} />
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
