import { NavLink, useNavigate } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as Icons from 'lucide-react';
import { APP_NAME, NAV_ITEMS, ROLE_LABELS, ROLES } from '../../utils/constants';
import { cn } from '../../utils/cn';
import { initials } from '../../utils/format';
import { useAuth } from '../../context/AuthContext';

// Dynamically resolve a lucide icon by name.
function getIcon(name) {
  return Icons[name] || Icons.Circle;
}

// Filter and group nav items for the current role.
function buildNav(role) {
  const allowed = NAV_ITEMS.filter((item) => item.roles.includes(role));
  const groups = {};
  allowed.forEach((item) => {
    const g = item.group || 'Other';
    if (!groups[g]) groups[g] = [];
    groups[g].push(item);
  });
  return groups;
}

// NAV group display order
// NAV group display order
const GROUP_ORDER = ['Main', 'Operations', 'People', 'Finance', 'System'];

function SidebarContent({ onClose, role, isCollapsed, toggleCollapse, isMobile }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const isSystemAdmin = role === ROLES.SYSTEM_ADMIN;
  const groups = buildNav(role);
  
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
    navigate('/login');
  };

  return (
    <div className="flex h-full flex-col bg-slate-50 dark:bg-navy-950 border-r border-slate-200 dark:border-navy-900 transition-colors duration-300">
      {/* ── Brand ──────────────────────────────────────────────────────── */}
      <div
        className={cn("flex h-16 items-center border-b border-slate-200 dark:border-navy-900 relative group", isCollapsed ? "justify-center px-0" : "gap-3 px-5")}
      >
        <div
          className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl overflow-hidden bg-white dark:bg-navy-900 p-0.5 shadow-sm cursor-pointer border border-slate-200 dark:border-navy-800 group/logo"
          onClick={() => window.location.href = '/'}
          title="Refresh Dashboard"
        >
          <img src="/logo.png" alt="Logo" className={cn("w-full h-full object-contain transition", isCollapsed && "group-hover/logo:opacity-30")} />
          
          {isCollapsed && !isMobile && (
            <button 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                toggleCollapse();
              }} 
              className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-navy-900/60 opacity-0 group-hover/logo:opacity-100 transition z-50"
              title="Expand Sidebar"
            >
              <Icons.ChevronRight size={20} className="text-slate-800 dark:text-white" />
            </button>
          )}
        </div>
        {!isCollapsed && (
          <div className="min-w-0 flex-1 cursor-pointer" onClick={() => window.location.href = '/'}>
            <p className="truncate text-sm font-bold text-slate-900 dark:text-white">{APP_NAME} ERP</p>
            <p className="truncate text-[10px] font-medium text-slate-500 dark:text-navy-300">
              International Courier
            </p>
          </div>
        )}
        {!isCollapsed && !isMobile && (
          <button 
            onClick={toggleCollapse} 
            className="text-slate-400 hover:text-slate-700 dark:text-navy-400 dark:hover:text-white transition"
            title="Collapse Sidebar"
          >
            <Icons.ChevronLeft size={18} />
          </button>
        )}
      </div>

      {/* ── Nav ─────────────────────────────────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {GROUP_ORDER.filter((g) => groups[g]).map((groupName) => (
          <div key={groupName}>
            {!isCollapsed ? (
              <p
                className="mb-1.5 px-3 text-[9px] font-bold uppercase tracking-widest text-orange-500 dark:text-orange-600"
              >
                {groupName}
              </p>
            ) : (
              <div className="mb-2 mt-4 h-px w-full bg-slate-200 dark:bg-navy-800" />
            )}
            <ul className="space-y-0.5">
              {groups[groupName].map((item) => {
                const Icon = getIcon(item.icon);
                const enabled = !item.phase || item.phase === 1;
                return (
                  <li key={item.to}>
                    <NavLink
                      to={enabled ? item.to : '#'}
                      onClick={(e) => {
                        if (!enabled) e.preventDefault();
                        onClose?.();
                      }}
                      className={({ isActive }) =>
                        cn(
                          'flex items-center gap-3 rounded-lg py-2 text-sm font-medium transition-all duration-150',
                          isCollapsed ? 'justify-center px-0' : 'px-3',
                          !enabled && 'cursor-not-allowed opacity-40',
                          // Inactive state
                          (!isActive || !enabled) && 'text-slate-600 hover:bg-slate-200 hover:text-slate-900 dark:text-navy-300 dark:hover:bg-white/5 dark:hover:text-white',
                          // Active state (uncollapsed)
                          isActive && enabled && !isCollapsed && 'bg-orange-500 text-white shadow-sm dark:bg-orange-600',
                          // Active state (collapsed)
                          isActive && enabled && isCollapsed && 'bg-orange-100 text-orange-600 dark:bg-white/10 dark:text-orange-500',
                          isActive && enabled && !isCollapsed && 'hover:translate-x-0.5'
                        )
                      }
                      title={isCollapsed ? item.label : undefined}
                    >
                      {({ isActive }) => (
                        <>
                          <Icon size={isCollapsed ? 22 : 17} className={cn("shrink-0 transition-colors", isCollapsed && isActive && enabled ? "fill-orange-600 dark:fill-orange-500" : "")} />
                          {!isCollapsed && <span className="flex-1 truncate">{item.label}</span>}
                          {!isCollapsed && item.phase && item.phase > 1 && (
                            <span
                              className={cn("rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide", isActive ? "bg-white/20 text-white" : "bg-slate-200 text-slate-500 dark:bg-navy-800 dark:text-slate-400")}
                            >
                              Soon
                            </span>
                          )}
                        </>
                      )}
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* ── User Footer ─────────────────────────────────────────────────── */}
      <div className={cn("relative p-3 border-t border-slate-200 dark:border-navy-900", isCollapsed && "flex justify-center px-0")} ref={menuRef}>
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className={cn("flex w-full items-center rounded-xl transition hover:bg-slate-200 dark:hover:bg-white/5", isCollapsed ? "p-1 justify-center" : "gap-3 px-3 py-2.5", menuOpen && "bg-slate-200 dark:bg-white/5")}
        >
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white bg-gradient-to-br from-navy-600 to-navy-800"
            title={isCollapsed ? user?.name : undefined}
          >
            {user?.photo ? (
              <img
                src={user.photo}
                alt={user.name}
                className="h-8 w-8 rounded-full object-cover"
              />
            ) : (
              initials(user?.name)
            )}
          </div>
          {!isCollapsed && (
            <>
              <div className="min-w-0 flex-1 text-left">
                <p className="truncate text-xs font-semibold text-slate-900 dark:text-white">{user?.name}</p>
                <p className="truncate text-[10px] text-slate-500 dark:text-navy-300">
                  {ROLE_LABELS[role] || 'User'}
                </p>
              </div>
              {isSystemAdmin && (
                <span
                  className="shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-orange-100 text-orange-600 dark:bg-orange-500/20 dark:text-orange-200"
                >
                  Admin
                </span>
              )}
            </>
          )}
        </button>

        {/* Profile Popup Menu */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.96 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              className="absolute left-2 bottom-16 z-50 w-60 overflow-hidden rounded-xl bg-white shadow-elevated dark:bg-navy-950 border border-slate-200 dark:border-navy-900"
            >
              {/* User info header */}
              <div className="p-3 border-b border-slate-200 dark:border-navy-900">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white bg-gradient-to-br from-navy-600 to-navy-800">
                    {initials(user?.name)}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                      {user?.name}
                    </p>
                    <p className="truncate text-xs text-slate-500 dark:text-navy-300">{user?.email}</p>
                  </div>
                </div>
              </div>

              {/* Menu actions */}
              <div className="py-1">
                <button
                  onClick={() => { setMenuOpen(false); navigate('/profile'); }}
                  className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm text-slate-600 dark:text-navy-300 transition hover:bg-slate-100 dark:hover:bg-navy-900 hover:text-slate-900 dark:hover:text-white"
                >
                  <Icons.User size={15} className="shrink-0 opacity-70" />
                  My Profile
                </button>
                <button
                  onClick={() => { setMenuOpen(false); navigate('/settings'); }}
                  className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm text-slate-600 dark:text-navy-300 transition hover:bg-slate-100 dark:hover:bg-navy-900 hover:text-slate-900 dark:hover:text-white"
                >
                  <Icons.Settings size={15} className="shrink-0 opacity-70" />
                  Settings
                </button>
              </div>

              <div className="p-2 border-t border-slate-200 dark:border-navy-900">
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-medium text-rose-600 transition hover:bg-rose-50 dark:hover:bg-rose-950/30 dark:text-rose-400"
                >
                  <Icons.LogOut size={15} className="shrink-0" />
                  Sign out
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export function Sidebar({ open, onClose, role }) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <>
      {/* Desktop */}
      <aside className={cn("hidden shrink-0 lg:block transition-all duration-300 relative z-20", isCollapsed ? "w-20" : "w-64")}>
        <SidebarContent onClose={onClose} role={role} isCollapsed={isCollapsed} toggleCollapse={() => setIsCollapsed(!isCollapsed)} isMobile={false} />
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
            />
            <motion.aside
              className="fixed inset-y-0 left-0 z-50 w-64 lg:hidden"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 260 }}
            >
              <SidebarContent onClose={onClose} role={role} isCollapsed={false} isMobile={true} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

export default Sidebar;
