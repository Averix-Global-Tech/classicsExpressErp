import { cn } from '../../utils/cn';

// Status / role pill. `color` auto-maps common keywords; pass explicit `color` to override.
// Prop API stable: children, color, variant, className.
const COLOR_MAP = {
  green:  'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:ring-emerald-800',
  red:    'bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-950 dark:text-rose-300 dark:ring-rose-800',
  amber:  'bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:ring-amber-800',
  blue:   'bg-orange-50 text-orange-700 ring-orange-200 dark:bg-orange-950 dark:text-orange-300 dark:ring-orange-800',
  grey:   'bg-slate-100 dark:bg-navy-800 text-slate-600 dark:text-slate-400 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700',
  purple: 'bg-violet-50 text-violet-700 ring-violet-200 dark:bg-violet-950 dark:text-violet-300 dark:ring-violet-800',
  indigo: 'bg-orange-50 text-orange-700 ring-orange-200 dark:bg-orange-950 dark:text-orange-300 dark:ring-orange-800',
};

function autoColor(label = '') {
  const s = String(label).toLowerCase();
  if (/(active|approved|delivered|paid|present|resolved|success|employed|completed|verified)/.test(s)) return 'green';
  if (/(rejected|inactive|deleted|failed|returned|expired|absent|due|blocked)/.test(s))               return 'red';
  if (/(pending|review|processing|awaiting|late|low|in.progress)/.test(s))                            return 'amber';
  if (/(transit|progress|assigned|admin|system|in.transit)/.test(s))                                  return 'blue';
  return 'grey';
}

export function Badge({ children, color, variant = 'soft', className }) {
  const resolved = color || autoColor(children);
  const styles = COLOR_MAP[resolved] || COLOR_MAP.grey;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset',
        variant === 'soft' ? styles : 'bg-orange-600 text-white ring-orange-700',
        className
      )}
    >
      {children}
    </span>
  );
}

export default Badge;
