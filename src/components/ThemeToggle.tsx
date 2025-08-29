'use client';

import { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from './ThemeProvider';

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleToggle = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  };

  // Use resolvedTheme for the icon to prevent hydration mismatch
  // resolvedTheme is always either 'light' or 'dark', never 'system'
  const CurrentIcon = resolvedTheme === 'light' ? Sun : Moon;

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    // Render a placeholder with the same dimensions to prevent layout shift
    return (
      <Button variant="outline" size="icon" className="w-9 h-9 rounded-xl">
        <div className="w-4 h-4" />
      </Button>
    );
  }

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={handleToggle}
      className="w-9 h-9 rounded-xl"
      aria-label={`Switch to ${resolvedTheme === 'light' ? 'dark' : 'light'} theme`}
      title={`Current: ${theme} (Click for ${resolvedTheme === 'light' ? 'dark' : 'light'})`}
    >
      <CurrentIcon className="h-4 w-4" />
    </Button>
  );
}
