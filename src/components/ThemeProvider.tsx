'use client';

import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: 'light' | 'dark';
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Helper function to get system theme
function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'dark';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

// Helper function to get resolved theme
function getResolvedTheme(theme: Theme): 'light' | 'dark' {
  if (theme === 'system') {
    return getSystemTheme();
  }
  return theme;
}

// Helper function to apply theme to DOM
function applyTheme(theme: Theme) {
  if (typeof document === 'undefined') return;

  const resolvedTheme = getResolvedTheme(theme);
  const root = document.documentElement;

  // Remove existing theme classes
  root.classList.remove('light', 'dark');
  // Add new theme class
  root.classList.add(resolvedTheme);

  // Also set data attribute for CSS targeting
  root.setAttribute('data-theme', resolvedTheme);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('system');
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('dark');
  const [mounted, setMounted] = useState(false);

  // Initialize theme on mount
  useEffect(() => {
    setMounted(true);

    // Get saved theme from localStorage
    const savedTheme = localStorage.getItem('theme') as Theme | null;
    if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
      setTheme(savedTheme);
    } else {
      // First time visitor - use system theme
      setTheme('system');
    }
  }, []);

  // Apply theme changes
  useEffect(() => {
    if (!mounted) return;

    const newResolvedTheme = getResolvedTheme(theme);
    setResolvedTheme(newResolvedTheme);
    applyTheme(theme);

    // Save theme preference
    localStorage.setItem('theme', theme);
  }, [theme, mounted]);

  // Listen for system theme changes when using 'system' theme
  useEffect(() => {
    if (!mounted || theme !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      const newResolvedTheme = getResolvedTheme(theme);
      setResolvedTheme(newResolvedTheme);
      applyTheme(theme);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme, mounted]);

  // Apply initial theme immediately to prevent flash
  useEffect(() => {
    if (mounted) {
      applyTheme(theme);
    }
  }, [mounted, theme]);

  const contextValue: ThemeContextType = {
    theme,
    setTheme,
    resolvedTheme,
  };

  return <ThemeContext.Provider value={contextValue}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
