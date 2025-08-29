'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Copy, Check } from 'lucide-react';
import { ClientOnly } from './ClientOnly';

interface BulletResponse {
  bullets: string[];
  truncated: boolean;
  originalLength: number;
  processedLength: number;
  error?: string;
  cacheStats?: {
    size: number;
    maxSize: number;
    enabled: boolean;
  };
}

// Loading skeleton component
function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Enter your text</h3>
          <div className="w-full min-h-[200px] p-4 border border-input rounded-md bg-background animate-pulse" />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>0 / 1000 characters</span>
          </div>
        </div>
        <div className="w-full h-10 bg-primary/10 rounded-md animate-pulse" />
      </div>
    </div>
  );
}

// Character counter component
function CharacterCounter({ count, max, truncated }: { count: number; max: number; truncated: boolean }) {
  return (
    <div className="flex justify-between text-sm text-muted-foreground">
      <span>
        {count} / {max} characters
      </span>
      {truncated && <span className="text-orange-500">Text was truncated</span>}
    </div>
  );
}

// Bullet list component
function BulletList({
  bullets,
  isStreaming,
  onReplay,
  onCopy,
  copied,
  isDev,
}: {
  bullets: string[];
  isStreaming: boolean;
  onReplay: () => void;
  onCopy: () => void;
  copied: boolean;
  isDev: boolean;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Generated Bullets</h3>
        <div className="flex gap-2">
          {isDev && (
            <Button variant="secondary" size="sm" onClick={onReplay} disabled={isStreaming || bullets.length === 0}>
              🎬 Replay
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={onCopy} disabled={copied || isStreaming || bullets.length === 0}>
            {copied ? (
              <>
                <Check className="mr-2 h-4 w-4" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="mr-2 h-4 w-4" />
                Copy
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="p-4 border border-border rounded-md bg-card">
        <ul className="space-y-2">
          {bullets.map((bullet, index) => (
            <li key={index} className="flex items-start animate-in fade-in slide-in-from-left-2 duration-500 ease-out">
              <span className="mr-2 text-primary">•</span>
              <span>{bullet}</span>
            </li>
          ))}
          {isStreaming && (
            <li className="flex items-start animate-in fade-in duration-300">
              <span className="mr-2 text-primary">•</span>
              <span className="inline-flex">
                <span className="animate-pulse duration-1000">▋</span>
              </span>
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}

// Cache stats component
function CacheStats({ cacheStats }: { cacheStats: BulletResponse['cacheStats'] | null }) {
  if (!cacheStats) return null;

  return (
    <div className="p-3 border border-border rounded-md bg-muted/50">
      <p className="text-sm text-muted-foreground">
        Cache: {cacheStats.enabled ? 'Enabled' : 'Disabled'}
        {cacheStats.enabled && ` (${cacheStats.size}/${cacheStats.maxSize} entries)`}
      </p>
    </div>
  );
}

export function TextToBulletsForm() {
  const [input, setInput] = useState('');
  const [bullets, setBullets] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [truncated, setTruncated] = useState(false);
  const [copied, setCopied] = useState(false);
  const [cacheStats, setCacheStats] = useState<BulletResponse['cacheStats'] | null>(null);
  const [displayedBullets, setDisplayedBullets] = useState<string[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [csrfToken, setCsrfToken] = useState<string>('');
  const [csrfLoading, setCsrfLoading] = useState(true);
  const hasHydrated = useRef(false);
  const isDev = process.env.NODE_ENV === 'development';

  const MAX_CHARACTERS = 1000;

  // Track hydration state
  useEffect(() => {
    hasHydrated.current = true;
  }, []);

  // Fetch CSRF token after component is mounted (client-side only)
  useEffect(() => {
    if (!hasHydrated.current) return;

    const fetchCSRFToken = async () => {
      try {
        setCsrfLoading(true);
        const response = await fetch('/api/csrf-token');
        const data = await response.json();
        setCsrfToken(data.token);
      } catch (error) {
        console.error('Failed to fetch CSRF token:', error);
      } finally {
        setCsrfLoading(false);
      }
    };

    fetchCSRFToken();
  }, []);

  // Streaming animation effect
  useEffect(() => {
    if (bullets.length === 0) {
      setDisplayedBullets([]);
      setIsStreaming(false);
      return;
    }

    setIsStreaming(true);
    setDisplayedBullets([]);

    const streamBullets = async () => {
      for (let i = 0; i < bullets.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 800));
        setDisplayedBullets(prev => [...prev, bullets[i]]);
      }
      setIsStreaming(false);
    };

    streamBullets();
  }, [bullets]);

  // Memoized handlers
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!input.trim() || !csrfToken) return;

      setLoading(true);
      setError(null);
      setBullets([]);
      setDisplayedBullets([]);
      setTruncated(false);
      setCacheStats(null);

      try {
        const response = await fetch('/api/bullets', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ input: input.trim(), csrfToken }),
        });

        const data: BulletResponse = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to generate bullets');
        }

        setBullets(data.bullets);
        setTruncated(data.truncated);
        setCacheStats(data.cacheStats || null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    },
    [input, csrfToken]
  );

  const copyToClipboard = useCallback(async () => {
    if (displayedBullets.length === 0) return;

    const text = displayedBullets.map(bullet => `• ${bullet}`).join('\n');
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [displayedBullets]);

  const replayAnimation = useCallback(() => {
    if (bullets.length === 0) return;

    setIsStreaming(true);
    setDisplayedBullets([]);

    const streamBullets = async () => {
      for (let i = 0; i < bullets.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 800));
        setDisplayedBullets(prev => [...prev, bullets[i]]);
      }
      setIsStreaming(false);
    };

    streamBullets();
  }, [bullets]);

  // Prevent hydration mismatch by not rendering until hydrated
  if (!hasHydrated.current) {
    return <LoadingSkeleton />;
  }

  const hasBullets = displayedBullets.length > 0 || bullets.length > 0;

  return (
    <ClientOnly fallback={<LoadingSkeleton />}>
      <div className="space-y-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Enter your text</h3>
            <textarea
              id="input"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Paste your text here... (emails, resumes, job descriptions, etc.)"
              className="w-full min-h-[200px] p-4 border border-input rounded-md bg-background text-foreground resize-y focus:outline-none focus:ring-2 focus:ring-ring"
              disabled={loading}
            />
            <CharacterCounter count={input.length} max={MAX_CHARACTERS} truncated={truncated} />
          </div>

          <Button
            type="submit"
            disabled={loading || !input.trim() || input.length < 10 || !csrfToken || csrfLoading}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating bullets...
              </>
            ) : csrfLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              'Generate Bullets'
            )}
          </Button>
        </form>

        {error && (
          <div className="p-4 border border-destructive/50 rounded-md bg-destructive/10 text-destructive">{error}</div>
        )}

        {hasBullets && (
          <>
            <BulletList
              bullets={displayedBullets}
              isStreaming={isStreaming}
              onReplay={replayAnimation}
              onCopy={copyToClipboard}
              copied={copied}
              isDev={isDev}
            />
            <CacheStats cacheStats={cacheStats} />
          </>
        )}
      </div>
    </ClientOnly>
  );
}
