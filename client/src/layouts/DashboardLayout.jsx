import { useState, useCallback } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from '../components/layout/Sidebar';
import { Topbar } from '../components/layout/Topbar';
import { NotificationPanel } from '../components/layout/NotificationPanel';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import dashboardService from '../services/dashboardService';
import { useToast } from '../context/ToastContext';
import { useEffect } from 'react';

// Application shell: sidebar + topbar + routed content. Fetches notifications for
// the bell badge. Pages render into <Outlet />.
export function DashboardLayout() {
  const { user, role } = useAuth();
  const location = useLocation();
  const toast = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);

  const loadNotifications = useCallback(async () => {
    try {
      const data = await dashboardService.getSummary();
      setNotifications(data?.notifications?.items || []);
      setUnread(data?.notifications?.unreadCount || 0);
    } catch {
      /* notifications are non-critical; fail silently */
    }
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const handleMarkAllRead = async () => {
    // Optimistic update
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnread(0);
  };

  const handleClearAll = () => {
    setNotifications([]);
    setUnread(0);
  };

  const handleClear = (id) => {
    setNotifications((prev) => prev.filter(n => (n._id || n.id) !== id));
    // optionally recalculate unread
  };

  const handleMarkRead = (id) => {
    setNotifications((prev) => prev.map(n => (n._id || n.id) === id ? { ...n, read: true } : n));
    setUnread(prev => Math.max(0, prev - 1));
  };

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--surface)' }}>
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} role={role} />

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          onMenuClick={() => setSidebarOpen(true)}
          onBellClick={() => setNotifOpen(true)}
          unreadCount={unread}
        />

        <main className="flex-1 overflow-y-auto overflow-x-hidden">
          <div className="mx-auto max-w-7xl px-4 py-6 lg:px-8">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            >
              <Outlet context={{ user, refreshNotifications: loadNotifications }} />
            </motion.div>
          </div>
        </main>
      </div>

      <NotificationPanel
        open={notifOpen}
        onClose={() => setNotifOpen(false)}
        items={notifications}
        onMarkAllRead={handleMarkAllRead}
        onClearAll={handleClearAll}
        onClear={handleClear}
        onMarkRead={handleMarkRead}
      />
    </div>
  );
}

export default DashboardLayout;
