import { CheckCircle2, Info, AlertTriangle, XCircle } from 'lucide-react';
import { cn } from '../../utils/cn';

// Inline alert banner. Left-border accent style — modern, premium.
// Prop API stable: variant, title, children, className.
const MAP = {
  success: {
    icon: CheckCircle2,
    cls:  'bg-emerald-50 text-emerald-800 border-l-4 border-l-emerald-500 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 dark:border-l-emerald-500',
  },
  info: {
    icon: Info,
    cls:  'bg-orange-50 text-orange-800 border-l-4 border-l-orange-500 border border-orange-200 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800 dark:border-l-orange-500',
  },
  warning: {
    icon: AlertTriangle,
    cls:  'bg-amber-50 text-amber-800 border-l-4 border-l-amber-500 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800 dark:border-l-amber-500',
  },
  error: {
    icon: XCircle,
    cls:  'bg-rose-50 text-rose-800 border-l-4 border-l-rose-500 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800 dark:border-l-rose-500',
  },
};

export function Alert({ variant = 'info', title, children, className }) {
  const v = MAP[variant] || MAP.info;
  const Icon = v.icon;
  return (
    <div role="alert" className={cn('flex gap-3 rounded-lg p-3 text-sm', v.cls, className)}>
      <Icon size={17} className="mt-0.5 shrink-0 opacity-80" />
      <div className="flex-1">
        {title && <p className="font-semibold">{title}</p>}
        {children && (
          <div className={cn(title && 'mt-0.5', 'text-sm opacity-90')}>{children}</div>
        )}
      </div>
    </div>
  );
}

export default Alert;
