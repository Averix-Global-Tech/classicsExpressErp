import { motion, AnimatePresence } from 'framer-motion';
import { X, Bell, CheckCheck } from 'lucide-react';
import { timeAgo } from '../../utils/format';
import { cn } from '../../utils/cn';

// Type dot colors — semantic, premium palette.
const TYPE_COLOR = {
  auth:    'bg-orange-500',
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  error:   'bg-rose-500',
  info:    'bg-slate-400 dark:bg-slate-50 dark:bg-navy-900/500',
};

// Slide-in notification panel — fed by the dashboard summary notifications list.
export function NotificationPanel({ open, onClose, items = [], onMarkAllRead, onClearAll, onClear, onMarkRead }) {
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-40 bg-slate-900/20 backdrop-blur-sm dark:bg-black/40 transition-opacity"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          {/* Panel */}
          <motion.div
            className="fixed right-0 top-0 z-50 flex h-full w-full max-w-sm flex-col shadow-2xl"
            style={{
              background: 'var(--surface-card)',
              borderLeft: '1px solid var(--border)',
            }}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 280 }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-5 py-4"
              style={{ borderBottom: '1px solid var(--border)' }}
            >
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-50 dark:bg-orange-950">
                  <Bell size={16} className="text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[var(--fg)]">Notifications</h3>
                  {items.length > 0 && (
                    <p className="text-[11px] text-[var(--fg-subtle)]">
                      {items.filter((i) => !i.read).length} unread
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={onClose}
                className="rounded-lg p-1.5 text-[var(--fg-subtle)] transition hover:bg-[var(--surface-hover)] hover:text-[var(--fg-muted)]"
                aria-label="Close"
              >
                <X size={17} />
              </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto">
              {items.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--surface-hover)]">
                    <Bell size={24} className="text-[var(--fg-subtle)]" />
                  </div>
                  <p className="text-sm font-medium text-[var(--fg-muted)]">
                    You&apos;re all caught up
                  </p>
                  <p className="text-xs text-[var(--fg-subtle)]">
                    No new notifications right now.
                  </p>
                </div>
              ) : (
                <ul>
                  {items.map((n) => {
                    const id = n._id || n.id;
                    return (
                    <li
                      key={id}
                      className={cn(
                        'relative group flex gap-3 px-4 py-3 transition-colors',
                        'border-b border-[var(--border)]',
                        !n.read ? 'bg-orange-50/50 dark:bg-orange-950/30' : 'opacity-60 hover:opacity-100'
                      )}
                    >
                      {/* Type dot */}
                      <span
                        className={cn(
                          'mt-1.5 h-2 w-2 shrink-0 rounded-full',
                          TYPE_COLOR[n.type] || TYPE_COLOR.info
                        )}
                      />
                      <div className="min-w-0 flex-1">
                        <p className={cn("text-sm font-medium", !n.read ? "text-[var(--fg)]" : "text-[var(--fg-muted)]")}>{n.title}</p>
                        {n.body && (
                          <p className="mt-0.5 text-xs text-[var(--fg-muted)] line-clamp-2">{n.body}</p>
                        )}
                        <p className="mt-1 text-[11px] text-[var(--fg-subtle)]">
                          {timeAgo(n.createdAt)}
                        </p>
                      </div>

                      {/* Hover Actions */}
                      <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-white/90 dark:bg-navy-900/90 backdrop-blur shadow-sm px-1.5 py-1 rounded-lg border border-[var(--border)]">
                        {!n.read && (
                           <button onClick={() => onMarkRead?.(id)} className="p-1 text-orange-500 hover:text-orange-700 hover:bg-orange-50 dark:hover:bg-navy-800 rounded transition" title="Mark as read"><CheckCheck size={14}/></button>
                        )}
                        <button onClick={() => onClear?.(id)} className="p-1 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-navy-800 rounded transition" title="Clear"><X size={14}/></button>
                      </div>
                    </li>
                  )})}
                </ul>
              )}
            </div>

            {/* Footer action */}
            {items.length > 0 && (
              <div
                className="grid grid-cols-2 gap-2 p-3"
                style={{ borderTop: '1px solid var(--border)' }}
              >
                <button
                  onClick={onMarkAllRead}
                  className="flex w-full items-center justify-center gap-2 rounded-xl py-2 text-sm font-medium text-orange-600 transition hover:bg-orange-50 dark:text-orange-400 dark:hover:bg-orange-950/50"
                >
                  <CheckCheck size={15} />
                  Read All
                </button>
                <button
                  onClick={onClearAll}
                  className="flex w-full items-center justify-center gap-2 rounded-xl py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800"
                >
                  <X size={15} />
                  Clear All
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default NotificationPanel;
