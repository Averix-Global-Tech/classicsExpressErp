import { Search, X } from 'lucide-react';
import { cn } from '../../utils/cn';

// Search input with leading icon + clear button. Prop API stable.
export function SearchBar({ value, onChange, placeholder = 'Search...', className, onClear }) {
  return (
    <div className={cn('relative', className)}>
      <Search
        size={15}
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--fg-subtle)]"
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        className="input-base pl-9 pr-8"
      />
      {value && (
        <button
          onClick={() => { onChange?.(''); onClear?.(); }}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-[var(--fg-subtle)] transition hover:bg-[var(--surface-hover)] hover:text-[var(--fg-muted)]"
          aria-label="Clear search"
        >
          <X size={13} />
        </button>
      )}
    </div>
  );
}

export default SearchBar;
