import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '../../utils/cn';

// Accessible modal — portal + escape-to-close + backdrop blur + scroll lock.
// Prop API stable: open, onClose, title, description, children, footer, size.
export function Modal({ open, onClose, title, description, children, footer, size = 'md' }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  const sizes = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm dark:bg-slate-950/70"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          {/* Panel */}
          <motion.div
            role="dialog"
            aria-modal="true"
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ type: 'spring', duration: 0.28, bounce: 0.15 }}
            className={cn(
              'relative z-10 w-full overflow-hidden rounded-modal shadow-modal',
              'bg-[var(--surface-card)] border border-[var(--border)]',
              sizes[size]
            )}
          >
            {(title || description) && (
              <div className="flex items-start justify-between gap-3 border-b border-[var(--border)] p-5">
                <div>
                  {title && (
                    <h3 className="text-lg font-semibold text-[var(--fg)]">{title}</h3>
                  )}
                  {description && (
                    <p className="mt-0.5 text-sm text-[var(--fg-muted)]">{description}</p>
                  )}
                </div>
                <button
                  onClick={onClose}
                  className="rounded-lg p-1.5 text-[var(--fg-subtle)] transition hover:bg-[var(--surface-hover)] hover:text-[var(--fg-muted)]"
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
              </div>
            )}
            <div className="max-h-[70vh] overflow-y-auto p-5">{children}</div>
            {footer && (
              <div className="flex items-center justify-end gap-2 border-t border-[var(--border)] bg-[var(--surface-hover)] px-5 py-3">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}

export default Modal;
