import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext({ theme: 'light', toggleTheme: () => {} });

/**
 * ThemeProvider — manages light/dark mode.
 *
 * Contract:
 *  - Reads initial preference from localStorage key "theme".
 *  - Falls back to "light" (not OS media query) so the app always looks clean.
 *  - Toggles the `dark` class on <html> which activates Tailwind's darkMode: 'class'.
 *  - Persists choice to localStorage on every toggle.
 *
 * Usage:
 *   const { theme, toggleTheme } = useTheme();
 */
export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem('theme') || 'system';
    } catch {
      return 'system';
    }
  });

  useEffect(() => {
    const root = document.documentElement;
    
    const applyTheme = (t) => {
      if (t === 'dark') {
        root.classList.add('dark');
      } else if (t === 'light') {
        root.classList.remove('dark');
      } else if (t === 'system') {
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (systemPrefersDark) {
          root.classList.add('dark');
        } else {
          root.classList.remove('dark');
        }
      }
    };

    applyTheme(theme);

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (theme === 'system') applyTheme('system');
    };
    
    mediaQuery.addEventListener('change', handleChange);

    try {
      localStorage.setItem('theme', theme);
    } catch {
      /* ignore */
    }
    
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  const toggleTheme = () =>
    setTheme((prev) => {
      if (prev === 'light') return 'dark';
      if (prev === 'dark') return 'system';
      return 'light';
    });

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

export default ThemeProvider;
