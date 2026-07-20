import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../utils/cn';

// Compact pagination — prop API stable.
export function Pagination({ page = 1, pages = 1, onPageChange, className }) {
  if (pages <= 1) return null;
  const current = Math.min(page, pages);

  // Windowed page numbers with ellipses
  const nums = [];
  const push = (n) => nums.push(n);
  if (current <= 3) {
    [1, 2, 3, 4, pages].filter((v, i, a) => a.indexOf(v) === i).forEach(push);
  } else if (current >= pages - 2) {
    [1, pages - 3, pages - 2, pages - 1, pages].forEach(push);
  } else {
    [1, current - 1, current, current + 1, pages].forEach(push);
  }
  const uniqueNums = [...new Set(nums)].filter((n) => n >= 1 && n <= pages);

  const btn = (active) =>
    cn(
      'inline-flex h-8 min-w-8 items-center justify-center rounded-md px-2 text-sm font-medium transition-all duration-100',
      active
        ? 'bg-orange-600 text-white shadow-sm dark:bg-orange-500'
        : 'text-[var(--fg-muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--fg)]'
    );

  return (
    <div className={cn('flex items-center justify-between gap-3', className)}>
      <p className="text-xs text-[var(--fg-subtle)]">
        Page {current} of {pages}
      </p>
      <div className="flex items-center gap-1">
        <button
          className={cn(btn(false), current === 1 && 'pointer-events-none opacity-35')}
          onClick={() => onPageChange?.(current - 1)}
          disabled={current === 1}
          aria-label="Previous page"
        >
          <ChevronLeft size={15} />
        </button>
        {uniqueNums.map((n, i) => {
          const prev = uniqueNums[i - 1];
          return (
            <span key={n} className="flex items-center gap-1">
              {prev && n - prev > 1 && (
                <span className="px-1 text-[var(--fg-subtle)]">…</span>
              )}
              <button className={btn(n === current)} onClick={() => onPageChange?.(n)}>
                {n}
              </button>
            </span>
          );
        })}
        <button
          className={cn(btn(false), current === pages && 'pointer-events-none opacity-35')}
          onClick={() => onPageChange?.(current + 1)}
          disabled={current === pages}
          aria-label="Next page"
        >
          <ChevronRight size={15} />
        </button>
      </div>
    </div>
  );
}

export default Pagination;
