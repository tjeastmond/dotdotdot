import type { Metadata } from 'next';
import { roboto } from '@/lib/fonts';
import './globals.css';
import { ThemeProvider } from '@/components/ThemeProvider';

export const metadata: Metadata = {
  title: 'DotDotDot - Transform Text to Bullet Points',
  description:
    'A minimal, fast, and professional tool that transforms walls of text into clean, concise bullet points using AI.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={roboto.className} suppressHydrationWarning>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
