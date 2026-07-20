import { motion } from 'framer-motion';
import { Package } from 'lucide-react';
import { APP_NAME, APP_FULL_NAME } from '../utils/constants';

// Split-screen auth shell: brand panel (left) + form area (right).
// Uses indigo gradient on left panel with decorative elements.
export function AuthLayout({ children, title, subtitle }) {
  return (
    <div className="flex min-h-screen" style={{ background: 'var(--surface)' }}>
      {/* ── Brand panel (left, hidden on mobile) ─────────────────────── */}
      <div
        className="relative hidden w-1/2 overflow-hidden lg:flex lg:flex-col lg:justify-between lg:p-12 bg-gradient-to-br from-navy-950 via-navy-900 to-navy-800"
      >
        {/* Decorative dot grid */}
        <div
          className="pointer-events-none absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              'radial-gradient(circle, rgba(165,180,252,0.6) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />
        {/* Decorative blobs */}
        <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-orange-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-16 h-96 w-96 rounded-full bg-navy-700/40 blur-3xl" />
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-sky-500/10 blur-2xl" />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3 text-white">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-2xl shadow-lg bg-white dark:bg-navy-900 p-1 overflow-hidden"
          >
            <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <p className="text-lg font-bold">{APP_NAME} ERP</p>
            <p className="text-xs text-navy-300">
              International Courier
            </p>
          </div>
        </div>

        {/* Hero text */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="relative z-10 max-w-md text-white"
        >
          <h1 className="text-3xl font-bold leading-tight tracking-tight">
            Manage your entire courier operation in one place.
          </h1>
          <p className="mt-4 leading-relaxed text-navy-200">
            Shipments, employees, payroll, finance, and customers — unified in a single
            enterprise platform built for {APP_FULL_NAME}.
          </p>
          <ul className="mt-6 space-y-2.5 text-sm text-navy-300">
            {[
              'Real-time shipment tracking',
              'Automated AWB & labels',
              'Role-based secure access',
            ].map((f) => (
              <li key={f} className="flex items-center gap-2.5">
                <span
                  className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-orange-500/40"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-white dark:bg-navy-900" />
                </span>
                {f}
              </li>
            ))}
          </ul>
        </motion.div>

        <p className="relative z-10 text-xs text-navy-400">
          © {new Date().getFullYear()} {APP_FULL_NAME}. All rights reserved.
        </p>
      </div>

      {/* ── Form area (right) ─────────────────────────────────────────── */}
      <div
        className="flex w-full flex-col justify-center px-6 py-10 lg:w-1/2 lg:px-20"
        style={{ background: 'var(--surface)' }}
      >
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="mx-auto w-full max-w-md"
        >
          {/* Mobile brand */}
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-white dark:bg-navy-900 p-0.5 overflow-hidden shadow-sm"
            >
              <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
            </div>
            <p className="text-base font-bold text-[var(--fg)]">{APP_NAME} ERP</p>
          </div>

          {(title || subtitle) && (
            <div className="mb-7">
              {title && (
                <h2 className="text-2xl font-bold text-[var(--fg)]">{title}</h2>
              )}
              {subtitle && (
                <p className="mt-1 text-sm text-[var(--fg-muted)]">{subtitle}</p>
              )}
            </div>
          )}

          {children}
        </motion.div>
      </div>
    </div>
  );
}

export default AuthLayout;
