'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from './ui/textarea';
import { Loader2, Copy, Check, RotateCcw } from 'lucide-react';

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
  cacheStats,
}: {
  bullets: string[];
  isStreaming: boolean;
  onReplay: () => void;
  onCopy: () => void;
  copied: boolean;
  isDev: boolean;
  cacheStats: BulletResponse['cacheStats'] | null;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Generated Bullets</h3>
        <div className="flex items-center gap-2">
          {cacheStats && (
            <span className="text-sm text-muted-foreground mr-2">
              Cache: {cacheStats.enabled ? 'Enabled' : 'Disabled'}
              {cacheStats.size > 0 && ` (${cacheStats.size}/${cacheStats.maxSize} entries)`}
            </span>
          )}
          {isDev && (
            <Button variant="secondary" size="sm" onClick={onReplay} disabled={isStreaming || bullets.length === 0}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Replay
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={onCopy}
            disabled={copied || isStreaming || bullets.length === 0}
            className="w-20"
          >
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

export function TextToBulletsForm() {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [truncated, setTruncated] = useState(false);
  const [copied, setCopied] = useState(false);
  const [cacheStats, setCacheStats] = useState<BulletResponse['cacheStats'] | null>(null);
  const [allBullets, setAllBullets] = useState<string[]>([]);
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

  // Streaming animation effect - FIXED: No infinite loop
  useEffect(() => {
    if (allBullets.length === 0) {
      setIsStreaming(false);
      setDisplayedBullets([]);
      return;
    }

    setIsStreaming(true);
    setDisplayedBullets([]);

    const streamBullets = async () => {
      for (let i = 0; i < allBullets.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 800));
        setDisplayedBullets(prev => [...prev, allBullets[i]]);
      }
      setIsStreaming(false);
    };

    streamBullets();
  }, [allBullets]); // Only depends on allBullets, not displayedBullets

  // Memoized handlers
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!input.trim() || !csrfToken) return;

      setLoading(true);
      setError(null);
      setAllBullets([]);
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

        setAllBullets(data.bullets);
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
    if (allBullets.length === 0) return;

    setIsStreaming(true);
    setDisplayedBullets([]);

    const streamBullets = async () => {
      for (let i = 0; i < allBullets.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 800));
        setDisplayedBullets(prev => [...prev, allBullets[i]]);
      }
      setIsStreaming(false);
    };

    streamBullets();
  }, [allBullets]);

  // Prevent hydration mismatch by not rendering until hydrated
  if (!hasHydrated.current) {
    return <LoadingSkeleton />;
  }

  const hasBullets = displayedBullets.length > 0 || allBullets.length > 0;

  return (
    <div className="space-y-8">
      {/* Input Section */}
      <div className="bg-card border border-border/50 rounded-2xl p-8 shadow-xl">
        <div className="mb-6">
          <h3 className="text-xl font-semibold mb-2">Enter your text</h3>
          <p className="text-muted-foreground">
            Paste any text content and we'll transform it into clear, actionable bullet points
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <Textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Paste your text here... (emails, resumes, job descriptions, etc.)"
              className="min-h-[200px] resize-none border-border/50 focus:border-primary/50 focus:ring-primary/20"
              disabled={loading}
            />
            <CharacterCounter count={input.length} max={MAX_CHARACTERS} truncated={truncated} />
          </div>

          <Button
            type="submit"
            disabled={loading || !input.trim() || input.length < 10 || !csrfToken || csrfLoading}
            className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {csrfLoading ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Loading...</span>
              </div>
            ) : loading ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Generating bullets...</span>
              </div>
            ) : (
              'Generate Bullet Points'
            )}
          </Button>
        </form>
      </div>

      {error && (
        <div className="bg-card border border-destructive/50 rounded-2xl p-6 shadow-xl">
          <div className="p-4 border border-destructive/50 rounded-md bg-destructive/10 text-destructive">{error}</div>
        </div>
      )}

      {hasBullets && (
        <div className="bg-card border border-border/50 rounded-2xl p-8 shadow-xl">
          <BulletList
            bullets={displayedBullets}
            isStreaming={isStreaming}
            onReplay={replayAnimation}
            onCopy={copyToClipboard}
            copied={copied}
            isDev={isDev}
            cacheStats={cacheStats}
          />
        </div>
      )}

      {/* Features Section */}
      <div className="grid md:grid-cols-3 gap-6 mt-12">
        <div className="bg-card border border-border/50 rounded-xl p-6 hover:border-border/70 transition-colors duration-200">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-lg flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h4 className="font-semibold mb-2">Lightning Fast</h4>
          <p className="text-sm text-muted-foreground">Get instant bullet points in seconds, not minutes</p>
        </div>

        <div className="bg-card border border-border/50 rounded-xl p-6 hover:border-border/70 transition-colors duration-200">
          <div className="w-12 h-12 bg-gradient-to-br from-green-500/20 to-green-600/20 rounded-lg flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h4 className="font-semibold mb-2">AI-Powered</h4>
          <p className="text-sm text-muted-foreground">Advanced AI extracts the most important insights</p>
        </div>

        <div className="bg-card border border-border/50 rounded-xl p-6 hover:border-border/70 transition-colors duration-200">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500/20 to-purple-600/20 rounded-lg flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
          </div>
          <h4 className="font-semibold mb-2">Clean Format</h4>
          <p className="text-sm text-muted-foreground">Professional bullet points ready for any use case</p>
        </div>
      </div>
    </div>
  );
}
