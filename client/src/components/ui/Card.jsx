import { cn } from '../../utils/cn';

// Card surface using semantic CSS vars — auto dark mode aware.
// Prop API stable: className, children, as, variant.
export function Card({ className, children, as: Tag = 'div', variant = 'default', ...props }) {
  return (
    <Tag
      className={cn(
        variant === 'elevated' ? 'card-elevated' : 'card',
        'p-5 sm:p-6',
        className
      )}
      {...props}
    >
      {children}
    </Tag>
  );
}

export function CardHeader({ className, children, title, subtitle, action }) {
  return (
    <div className={cn('flex items-start justify-between gap-3', className)}>
      <div>
        {title && (
          <h3 className="text-base font-semibold text-[var(--fg)]">{title}</h3>
        )}
        {subtitle && (
          <p className="mt-0.5 text-sm text-[var(--fg-muted)]">{subtitle}</p>
        )}
        {children}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function CardBody({ className, children }) {
  return <div className={cn(className)}>{children}</div>;
}

export default Card;
