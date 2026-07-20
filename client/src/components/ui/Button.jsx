import { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../utils/cn';

// Centralised button — all variants use semantic design tokens.
// Prop API is stable: variant, size, loading, disabled, type, className, children.
const VARIANTS = {
  primary:
    'bg-orange-600 text-white hover:bg-orange-700 active:bg-orange-800 shadow-sm focus-visible:ring-orange-300 dark:bg-orange-500 dark:hover:bg-orange-600',
  secondary:
    'bg-[var(--surface-card)] text-[var(--fg)] border border-[var(--border)] hover:bg-[var(--surface-hover)] active:bg-[var(--surface-hover)] focus-visible:ring-[var(--orange-ring)]',
  ghost:
    'text-[var(--fg-muted)] hover:bg-[var(--surface-hover)] active:bg-[var(--surface-hover)] focus-visible:ring-[var(--orange-ring)]',
  danger:
    'bg-rose-600 text-white hover:bg-rose-700 active:bg-rose-800 shadow-sm focus-visible:ring-rose-300 dark:bg-rose-500 dark:hover:bg-rose-600',
  outline:
    'border border-orange-300 bg-orange-50 text-orange-700 hover:bg-orange-100 active:bg-orange-200 focus-visible:ring-orange-200 dark:border-orange-600 dark:bg-orange-950 dark:text-orange-300 dark:hover:bg-orange-900',
  success:
    'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm focus-visible:ring-emerald-300',
};

const SIZES = {
  sm:   'h-8 px-3 text-xs gap-1.5 rounded-lg',
  md:   'h-10 px-4 text-sm gap-2 rounded-lg',
  lg:   'h-11 px-5 text-sm gap-2 rounded-xl',
  xl:   'h-12 px-6 text-base gap-2.5 rounded-xl',
  icon: 'h-9 w-9 justify-center rounded-lg',
};

const Button = forwardRef(function Button(
  { variant = 'primary', size = 'md', loading = false, className, children, disabled, type = 'button', ...props },
  ref
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center font-medium transition-all duration-150',
        'focus-visible:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-55',
        VARIANTS[variant] || VARIANTS.primary,
        SIZES[size] || SIZES.md,
        className
      )}
      {...props}
    >
      {loading && <Loader2 size={15} className="animate-spin" />}
      {children}
    </button>
  );
});

export default Button;
