'use client';

export function ThemeScript() {
  const script = `
    (function() {
      try {
        var theme = localStorage.getItem('theme');
        var systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        var resolvedTheme = theme && theme !== 'system' ? theme : systemTheme;

        document.documentElement.className = resolvedTheme;
      } catch (e) {
        // Fallback to system theme if localStorage fails
        var systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        document.documentElement.className = systemTheme;
      }
    })();
  `;

  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
