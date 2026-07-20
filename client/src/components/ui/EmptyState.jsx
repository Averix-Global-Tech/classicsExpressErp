import { Inbox } from 'lucide-react';
import { cn } from '../../utils/cn';

// Reusable empty state. Prop API stable: icon, title, description, action, className.
export function EmptyState({ icon: Icon = Inbox, title = 'Nothing here yet', description, action, className }) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-3 px-6 py-14 text-center', className)}>
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--surface-hover)] text-[var(--fg-subtle)]">
        <Icon size={26} />
      </div>
      <div>
        <p className="text-sm font-semibold text-[var(--fg-muted)]">{title}</p>
        {description && (
          <p className="mt-1 max-w-sm text-sm text-[var(--fg-subtle)]">{description}</p>
        )}
      </div>
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}

export default EmptyState;
