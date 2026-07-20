import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { CheckCircle2, XCircle, Info, AlertTriangle, X } from 'lucide-react';
import { cn } from '../utils/cn';

// Lightweight toast system — no extra dependency. Call toast.success(...) etc.
const ToastContext = createContext(null);

const VARIANTS = {
  success: { icon: CheckCircle2, ring: 'border-emerald-200', bar: 'bg-emerald-500', iconColor: 'text-emerald-500' },
  error: { icon: XCircle, ring: 'border-rose-200', bar: 'bg-rose-500', iconColor: 'text-rose-500' },
  warning: { icon: AlertTriangle, ring: 'border-amber-200', bar: 'bg-amber-500', iconColor: 'text-amber-500' },
  info: { icon: Info, ring: 'border-orange-200', bar: 'bg-orange-500', iconColor: 'text-orange-500' },
};

let idCounter = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const remove = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (variant, message, duration = 4500) => {
      const id = ++idCounter;
      setToasts((prev) => [...prev, { id, variant, message }]);
      if (duration > 0) setTimeout(() => remove(id), duration);
      return id;
    },
    [remove]
  );

  const api = useMemo(
    () => ({
      success: (m, d) => push('success', m, d),
      error: (m, d) => push('error', m, d ?? 6000),
      warning: (m, d) => push('warning', m, d),
      info: (m, d) => push('info', m, d),
      remove,
    }),
    [push, remove]
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="fixed top-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-2">
        {toasts.map((t) => {
          const v = VARIANTS[t.variant];
          const Icon = v.icon;
          return (
            <div
              key={t.id}
              role="alert"
              className={cn(
                'animate-fade-in pointer-events-auto flex items-start gap-3 rounded-lg border bg-white dark:bg-navy-900 p-3 pr-2 shadow-cardHover',
                v.ring
              )}
            >
              <span className={cn('mt-0.5', v.iconColor)}>
                <Icon size={18} />
              </span>
              <p className="flex-1 text-sm text-slate-700 dark:text-slate-300">{t.message}</p>
              <button
                onClick={() => remove(t.id)}
                className="rounded p-1 text-slate-400 transition hover:bg-slate-100 dark:bg-navy-800 hover:text-slate-600 dark:text-slate-400"
                aria-label="Dismiss"
              >
                <X size={15} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within <ToastProvider>');
  return ctx;
}

export default ToastContext;
