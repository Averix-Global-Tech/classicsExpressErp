import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Briefcase, Barcode, Mail, ChevronRight, Activity } from 'lucide-react';
import { Spinner } from '../../components/ui';
import { cn } from '../../utils/cn';
import productivityService from '../../services/productivity.service';
import AwbTab from './components/AwbTab';
import EmailTab from './components/EmailTab';

const TABS = [
  {
    id: 'awb',
    label: 'AWB Entries',
    icon: Barcode,
    description: 'Log and manage AWB processing',
  },
  {
    id: 'email',
    label: 'Email Resolution',
    icon: Mail,
    description: 'Log customer emails resolved',
  }
];

const tabVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.2, ease: 'easeOut' } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.15 } },
};

export default function MyProductivityPage() {
  const [activeTab, setActiveTab] = useState('awb');
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadStats = useCallback(async () => {
    try {
      const res = await productivityService.getMyStats();
      if (res.success) {
        setStats(res.data);
      }
    } catch (error) {
      console.error('Failed to load productivity stats', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const activeTabInfo = TABS.find((t) => t.id === activeTab);
  const ActiveIcon = activeTabInfo?.icon;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <Briefcase className="text-orange-600" size={24} />
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-200">My Productivity</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Track your daily AWB processing and email resolutions</p>
        </div>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Spinner size={28} />
        </div>
      ) : (
        <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
          {/* ── Tab Sidebar ────────────────────────────────────────────────── */}
          <aside className="w-full shrink-0 lg:w-56 space-y-6">
            <nav className="overflow-hidden rounded-xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-900 shadow-card">
              <ul className="divide-y divide-slate-100 dark:divide-navy-700/50">
                {TABS.map(({ id, label, icon: Icon }) => {
                  const isActive = activeTab === id;
                  return (
                    <li key={id}>
                      <button
                        type="button"
                        onClick={() => setActiveTab(id)}
                        className={cn(
                          'group flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-medium transition-colors',
                          isActive
                            ? 'bg-orange-600 text-white'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:bg-navy-900/50 hover:text-slate-900 dark:text-white'
                        )}
                      >
                        <Icon
                          size={16}
                          className={cn(
                            'shrink-0 transition-colors',
                            isActive ? 'text-white' : 'text-slate-400 group-hover:text-orange-600'
                          )}
                        />
                        <span className="flex-1 truncate">{label}</span>
                        {isActive && <ChevronRight size={14} className="text-white/70" />}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </nav>

            {/* Quick Stats Summary */}
            {stats && (
              <div className="rounded-xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-900 shadow-card p-4 space-y-4">
                <div className="flex items-center gap-2">
                  <Activity size={16} className="text-slate-400" />
                  <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Today's Summary</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500 dark:text-slate-400">AWBs Processed</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{stats.awbs.today}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500 dark:text-slate-400">Emails Resolved</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{stats.emails.today}</span>
                  </div>
                </div>
              </div>
            )}
          </aside>

          {/* ── Tab Content ─────────────────────────────────────────────────── */}
          <div className="min-w-0 flex-1">
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
                    {activeTab === 'awb' && <AwbTab stats={stats?.awbs} onUpdate={loadStats} />}
                    {activeTab === 'email' && <EmailTab stats={stats?.emails} onUpdate={loadStats} />}
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
