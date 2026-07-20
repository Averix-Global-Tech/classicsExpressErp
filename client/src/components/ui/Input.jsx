import { forwardRef, useId } from 'react';
import { cn } from '../../utils/cn';

// Labelled text input. Works with react-hook-form via forwardRef.
// Prop API stable: label, error, hint, className, id, required + native input props.
const Input = forwardRef(function Input(
  { label, error, hint, className, id, required, endIcon, ...props },
  ref
) {
  const autoId = useId();
  const fieldId = id || autoId;
  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={fieldId}
          className="mb-1.5 block text-sm font-medium text-[var(--fg-muted)]"
        >
          {label}
          {required && <span className="ml-0.5 text-rose-500">*</span>}
        </label>
      )}
      <div className="relative flex items-center w-full">
        <input
          ref={ref}
          id={fieldId}
          className={cn(
            'input-base',
            endIcon && 'pr-10',
            error && 'border-rose-400 focus:border-rose-400 dark:border-rose-600',
            className
          )}
          aria-invalid={!!error}
          {...props}
        />
        {endIcon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
            {endIcon}
          </div>
        )}
      </div>
      {error ? (
        <p className="mt-1 text-xs text-rose-500 dark:text-rose-400">{error}</p>
      ) : hint ? (
        <p className="mt-1 text-xs text-[var(--fg-subtle)]">{hint}</p>
      ) : null}
    </div>
  );
});

export default Input;
