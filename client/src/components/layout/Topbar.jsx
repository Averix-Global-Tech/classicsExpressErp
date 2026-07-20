import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, Bell, Search, LogOut, User, ChevronDown, Sun, Moon, Settings, Monitor } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useTheme } from '../../context/ThemeContext';
import { initials } from '../../utils/format';
import { ROLE_LABELS, ROLES } from '../../utils/constants';
import { Badge } from '../ui';
import { cn } from '../../utils/cn';

// Top navigation: mobile menu toggle, global search, dark-mode toggle,
// notifications bell, and profile dropdown.
export function Topbar({ onMenuClick, onBellClick, unreadCount = 0 }) {
  const { user, logout } = useAuth();
  const toast = useToast();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const onClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const handleLogout = async () => {
    await logout();
    toast.success('Signed out successfully.');
    navigate('/login');
  };

  return (
    <header
      className="sticky top-0 z-30 flex h-16 items-center justify-between px-4 lg:px-6"
      style={{
        background: 'color-mix(in srgb, var(--surface-card) 85%, transparent)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border)',
      }}
    >
      {/* Left side (Mobile menu toggle) */}
      <div className="flex w-1/4 items-center lg:w-auto">
        <button
          onClick={onMenuClick}
          className="rounded-lg p-2 text-[var(--fg-muted)] transition hover:bg-[var(--surface-hover)] lg:hidden"
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>
      </div>

      {/* Global search (Centered) */}
      <div className="relative hidden flex-1 max-w-2xl sm:flex justify-center px-4">
        <div className="relative w-full max-w-md">
          <Search
            size={16}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-orange-500"
          />
          <input
            type="text"
            placeholder="Search employees, shipments, AWB..."
            className="input-base pl-10 text-sm w-full bg-orange-50/50 border-orange-200 text-orange-900 placeholder:text-orange-400 focus:bg-white dark:bg-navy-900 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/20 transition-all dark:bg-navy-900/50 dark:border-navy-700 dark:text-orange-100 dark:placeholder:text-navy-400 dark:focus:bg-navy-900"
          />
        </div>
      </div>

      {/* Right side controls */}
      <div className="flex w-1/4 items-center justify-end gap-2 lg:w-auto">
        {/* Dark mode toggle */}
        <button
          onClick={toggleTheme}
          className="relative flex h-9 w-9 items-center justify-center rounded-full bg-orange-50 text-orange-600 transition hover:bg-orange-100 hover:scale-105 active:scale-95 dark:bg-navy-800 dark:text-orange-400 dark:hover:bg-navy-700"
          aria-label={theme === 'dark' ? 'Switch to system mode' : theme === 'system' ? 'Switch to light mode' : 'Switch to dark mode'}
          title={theme === 'dark' ? 'System mode' : theme === 'system' ? 'Light mode' : 'Dark mode'}
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={theme}
              initial={{ opacity: 0, rotate: -90, scale: 0.5 }}
              animate={{ opacity: 1, rotate: 0, scale: 1 }}
              exit={{ opacity: 0, rotate: 90, scale: 0.5 }}
              transition={{ duration: 0.2 }}
            >
              {theme === 'dark' ? (
                <Moon size={18} className="fill-orange-500/20" />
              ) : theme === 'system' ? (
                <Monitor size={18} className="fill-orange-500/20" />
              ) : (
                <Sun size={18} className="fill-orange-500/20" />
              )}
            </motion.div>
          </AnimatePresence>
        </button>

        {/* Notifications bell */}
        <button
          onClick={onBellClick}
          className="relative rounded-lg p-2 text-[var(--fg-muted)] transition hover:bg-[var(--surface-hover)]"
          aria-label="Notifications"
        >
          <Bell size={19} />
          {unreadCount > 0 && (
            <span className="absolute right-0 top-0 flex h-4 min-w-[16px] animate-pulse-ring items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white border-2 border-white dark:border-navy-900 box-content">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}

export default Topbar;
