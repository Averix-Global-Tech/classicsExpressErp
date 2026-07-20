import { motion } from 'framer-motion';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { cn } from '../../utils/cn';
import { Skeleton } from './Spinner';

// Dashboard stat card with trend indicator + staggered fade-in.
// Prop API stable: title, value, icon, accent, trend, hint, loading, index.
export function StatCard({ title, value, icon: Icon, accent = 'blue', trend, hint, loading, index = 0 }) {
  const accents = {
    blue:   'bg-orange-50 text-orange-600 dark:bg-orange-950 dark:text-orange-400',
    green:  'bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400',
    amber:  'bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400',
    red:    'bg-rose-50 text-rose-600 dark:bg-rose-950 dark:text-rose-400',
    purple: 'bg-violet-50 text-violet-600 dark:bg-violet-950 dark:text-violet-400',
    grey:   'bg-slate-100 dark:bg-navy-800 text-slate-600 dark:text-slate-400 dark:bg-slate-800 dark:text-slate-400',
    indigo: 'bg-orange-50 text-orange-600 dark:bg-orange-950 dark:text-orange-400',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3, ease: 'easeOut' }}
      className="card p-5 transition-shadow duration-200 hover:shadow-cardHover"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400">{title}</p>
          {loading ? (
            <Skeleton className="mt-2 h-7 w-24" />
          ) : (
            <p className="mt-1 text-2xl font-bold tracking-tight text-[var(--fg)]">
              {value}
            </p>
          )}
          {(trend !== undefined || hint) && (
            <div className="mt-2 flex items-center gap-1.5 text-xs">
              {trend !== undefined && (
                <span
                  className={cn(
                    'inline-flex items-center gap-0.5 font-semibold',
                    trend >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                  )}
                >
                  {trend >= 0 ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
                  {Math.abs(trend)}%
                </span>
              )}
              {hint && <span className="text-[var(--fg-subtle)]">{hint}</span>}
            </div>
          )}
        </div>
        {Icon && (
          <div
            className={cn(
              'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl',
              accents[accent] || accents.blue
            )}
          >
            <Icon size={22} />
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default StatCard;
