import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import authService from '../services/authService';

// AuthContext owns session state: current user, loading, and login/logout actions.
// On boot we verify the session via /auth/me (cookie-based). A 401 anywhere
// (handled in the axios interceptor) clears state and redirects to /login.
const AuthContext = createContext(null);

const STORAGE_KEY = 'ce_user';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // boot check in progress
  const [initialized, setInitialized] = useState(false);

  const hydrate = useCallback(async () => {
    setLoading(true);
    try {
      const { user: u } = await authService.me();
      setUser(u);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
    } catch {
      setUser(null);
      localStorage.removeItem(STORAGE_KEY);
    } finally {
      setLoading(false);
      setInitialized(true);
    }
  }, []);

  // On mount, attempt to restore session from the httpOnly cookie.
  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const login = useCallback(async (credentials) => {
    const result = await authService.login(credentials);
    // Server returns { user, mustChangePassword } when first-login flag is set
    const u = result.user || result;
    setUser(u);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
    return result; // preserve mustChangePassword for LoginPage to act on
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      /* cookie may already be gone — ignore */
    }
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const value = useMemo(
    () => ({
      user,
      role: user?.role || null,
      isAuthenticated: !!user,
      loading,
      initialized,
      login,
      logout,
      refresh: hydrate,
      setUser,
    }),
    [user, loading, initialized, login, logout, hydrate]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}

export default AuthContext;
