'use client';

import { useState, useEffect } from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from './ThemeProvider';

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleToggle = () => {
    // Cycle through: system -> light -> dark -> system
    if (theme === 'system') {
      setTheme('light');
    } else if (theme === 'light') {
      setTheme('dark');
    } else {
      setTheme('system');
    }
  };

  const getCurrentIcon = () => {
    if (theme === 'system') return Monitor;
    if (theme === 'light') return Sun;
    return Moon;
  };

  const getNextTheme = () => {
    if (theme === 'system') return 'light';
    if (theme === 'light') return 'dark';
    return 'system';
  };

  const CurrentIcon = getCurrentIcon();

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return (
      <Button variant="outline" size="icon" className="w-9 h-9">
        <Monitor className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={handleToggle}
      className="w-9 h-9"
      aria-label={`Switch to ${getNextTheme()} theme`}
      title={`Current: ${theme === 'system' ? 'System' : theme} (Click for ${getNextTheme()})`}
    >
      <CurrentIcon className="h-4 w-4" />
    </Button>
  );
}
