import { Loader2 } from 'lucide-react';
import { cn } from '../../utils/cn';

export function Spinner({ size = 20, className }) {
  return (
    <Loader2
      size={size}
      className={cn('animate-spin text-orange-500 dark:text-orange-400', className)}
    />
  );
}

// Full-section loader — centered within its parent.
export function FullLoader({ label = 'Loading...' }) {
  return (
    <div className="flex h-48 w-full flex-col items-center justify-center gap-3 text-[var(--fg-subtle)]">
      <Spinner size={28} />
      <p className="text-sm">{label}</p>
    </div>
  );
}

// Skeleton block — use to mock loading shapes (cards, text lines, tables).
// Uses shimmer animation from index.css for premium feel.
export function Skeleton({ className }) {
  return <div className={cn('skeleton', className)} />;
}

export default Spinner;
