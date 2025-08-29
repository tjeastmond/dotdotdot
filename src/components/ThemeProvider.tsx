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
  const html = document.documentElement;

  // Remove existing theme classes
  html.classList.remove('light', 'dark');
  // Add new theme class
  html.classList.add(resolvedTheme);

  // Also set data attribute for CSS targeting
  html.setAttribute('data-theme', resolvedTheme);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('dark');
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('dark');
  const [mounted, setMounted] = useState(false);

  // Initialize theme immediately on mount to prevent flash
  useEffect(() => {
    // Get saved theme from localStorage
    const savedTheme = localStorage.getItem('theme') as Theme | null;
    let initialTheme: Theme = 'dark';

    if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
      initialTheme = savedTheme;
    }

    setTheme(initialTheme);

    // Immediately apply the theme to prevent flash
    if (initialTheme === 'system') {
      // If system theme is saved, default to dark instead
      setResolvedTheme('dark');
      applyTheme('dark');
    } else {
      setResolvedTheme(initialTheme);
      applyTheme(initialTheme);
    }

    // Add theme-loaded class to remove forced CSS styles
    document.documentElement.classList.add('theme-loaded');

    setMounted(true);
  }, []);

  // Apply theme changes after initial mount
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

  // Enhanced setTheme that handles system theme conversion
  const handleSetTheme = (newTheme: Theme) => {
    if (newTheme === 'system') {
      // If switching to system, use current system preference
      setTheme('system');
    } else {
      // If switching to light/dark, use that directly
      setTheme(newTheme);
    }
  };

  const contextValue: ThemeContextType = {
    theme,
    setTheme: handleSetTheme,
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
