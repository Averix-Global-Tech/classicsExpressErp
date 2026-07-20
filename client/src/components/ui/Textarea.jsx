import { forwardRef, useId } from 'react';
import { cn } from '../../utils/cn';

// Labelled textarea. Prop API stable.
const Textarea = forwardRef(function Textarea(
  { label, error, hint, className, id, required, rows = 3, ...props },
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
      <textarea
        ref={ref}
        id={fieldId}
        rows={rows}
        className={cn(
          'input-base resize-y',
          error && 'border-rose-400 focus:border-rose-400 dark:border-rose-600',
          className
        )}
        aria-invalid={!!error}
        {...props}
      />
      {error ? (
        <p className="mt-1 text-xs text-rose-500 dark:text-rose-400">{error}</p>
      ) : hint ? (
        <p className="mt-1 text-xs text-[var(--fg-subtle)]">{hint}</p>
      ) : null}
    </div>
  );
});

export default Textarea;
