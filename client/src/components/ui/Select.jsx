import { forwardRef, useId, useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '../../utils/cn';

function useMergedRef(refA, refB) {
  return (current) => {
    if (typeof refA === 'function') refA(current);
    else if (refA) refA.current = current;
    if (typeof refB === 'function') refB(current);
    else if (refB) refB.current = current;
  };
}

// Labelled select. `options` = [{ value, label }] or array of primitives.
// Prop API stable. Fully compatible with React Hook Form.
const Select = forwardRef(function Select(
  { label, error, hint, options = [], placeholder = 'Select...', className, id, required, value: controlledValue, onChange: controlledOnChange, ...props },
  ref
) {
  const autoId = useId();
  const fieldId = id || autoId;
  const normalized = options.map((o) =>
    typeof o === 'object' && o !== null ? o : { value: o, label: String(o) }
  );

  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const hiddenSelectRef = useRef(null);
  const mergedSelectRef = useMergedRef(ref, hiddenSelectRef);

  // Local state for uncontrolled or RHF usage
  const [localValue, setLocalValue] = useState(controlledValue || props.defaultValue || '');

  // Keep in sync with controlled value if it changes externally
  useEffect(() => {
    if (controlledValue !== undefined) {
      setLocalValue(controlledValue);
    }
  }, [controlledValue]);

  // Sync internal state when native select resets (e.g. RHF reset)
  useEffect(() => {
    const select = hiddenSelectRef.current;
    if (!select) return;
    const handleChange = () => setLocalValue(select.value);
    select.addEventListener('change', handleChange);
    return () => select.removeEventListener('change', handleChange);
  }, []);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleSelect = (val) => {
    setLocalValue(val);
    setIsOpen(false);
    
    if (controlledOnChange) {
      controlledOnChange({ target: { name: props.name, value: val } });
    }
    
    // Dispatch native event for React Hook Form
    if (hiddenSelectRef.current && hiddenSelectRef.current.value !== val) {
      const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, 'value').set;
      nativeSetter.call(hiddenSelectRef.current, val);
      hiddenSelectRef.current.dispatchEvent(new Event('change', { bubbles: true }));
    }
  };

  const selectedOption = normalized.find(o => String(o.value) === String(localValue));
  const displayLabel = selectedOption ? selectedOption.label : placeholder;

  return (
    <div className="w-full" ref={containerRef}>
      {label && (
        <label
          htmlFor={fieldId}
          className="mb-1.5 block text-sm font-medium text-[var(--fg-muted)]"
        >
          {label}
          {required && <span className="ml-0.5 text-rose-500">*</span>}
        </label>
      )}
      
      {/* Hidden Select for RHF/native form compatibility */}
      <select
        ref={mergedSelectRef}
        id={fieldId}
        className="hidden"
        value={controlledValue}
        onChange={controlledOnChange}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {normalized.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>

      {/* Custom UI */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          aria-invalid={!!error}
          className={cn(
            'input-base flex w-full items-center justify-between text-left',
            error && 'border-rose-400 focus:border-rose-400 dark:border-rose-600',
            className
          )}
        >
          <span className={cn('block truncate', !selectedOption && 'opacity-60')}>
            {displayLabel}
          </span>
          <ChevronDown
            size={16}
            className={cn('text-slate-400 transition-transform duration-200', isOpen && 'rotate-180')}
          />
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -4, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.98 }}
              transition={{ duration: 0.15 }}
              className="absolute left-0 top-full z-50 mt-1.5 w-full overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface-card)] py-1.5 shadow-lg backdrop-blur-sm"
            >
              <ul className="max-h-60 w-full overflow-auto outline-none">
                {placeholder && (
                  <li
                    onClick={() => handleSelect('')}
                    className={cn(
                      'relative flex cursor-pointer select-none items-center py-2.5 pl-3 pr-9 text-sm transition-colors',
                      localValue === '' 
                        ? 'bg-orange-50 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400 font-medium' 
                        : 'text-[var(--fg)] hover:bg-slate-50 dark:hover:bg-white/5'
                    )}
                  >
                    <span className="block truncate">{placeholder}</span>
                    {localValue === '' && (
                      <span className="absolute right-3 flex items-center text-orange-500">
                        <Check size={16} />
                      </span>
                    )}
                  </li>
                )}
                
                {normalized.map((o) => {
                  const isSelected = String(localValue) === String(o.value);
                  return (
                    <li
                      key={o.value}
                      onClick={() => handleSelect(o.value)}
                      className={cn(
                        'relative flex cursor-pointer select-none items-center py-2.5 pl-3 pr-9 text-sm transition-colors',
                        isSelected 
                          ? 'bg-orange-50 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400 font-medium' 
                          : 'text-[var(--fg)] hover:bg-slate-50 dark:hover:bg-white/5'
                      )}
                    >
                      <span className="block truncate">{o.label}</span>
                      {isSelected && (
                        <span className="absolute right-3 flex items-center text-orange-500">
                          <Check size={16} />
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {error ? (
        <p className="mt-1 text-xs text-rose-500 dark:text-rose-400">{error}</p>
      ) : hint ? (
        <p className="mt-1 text-xs text-[var(--fg-subtle)]">{hint}</p>
      ) : null}
    </div>
  );
});

export default Select;
