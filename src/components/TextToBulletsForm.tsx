'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Copy, Check } from 'lucide-react';

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

export function TextToBulletsForm() {
  const [input, setInput] = useState('');
  const [bullets, setBullets] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [truncated, setTruncated] = useState(false);
  const [copied, setCopied] = useState(false);
  const [cacheStats, setCacheStats] = useState<BulletResponse['cacheStats'] | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return (
      <div className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    setLoading(true);
    setError(null);
    setBullets([]);
    setTruncated(false);
    setCacheStats(null);

    try {
      const response = await fetch('/api/bullets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ input: input.trim() }),
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
  };

  const copyToClipboard = async () => {
    if (bullets.length === 0) return;

    const text = bullets.map(bullet => `• ${bullet}`).join('\n');
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const characterCount = input.length;
  const maxCharacters = 1000;

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Enter your text</h3>
          <textarea
            id="input"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Paste your text here... (emails, resumes, job descriptions, etc.)"
            className="w-full min-h-[200px] p-4 border border-input rounded-md bg-background text-foreground resize-y focus:outline-none focus:ring-2 focus:ring-ring"
            disabled={loading}
          />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>
              {characterCount} / {maxCharacters} characters
            </span>
            {truncated && <span className="text-orange-500">Text was truncated</span>}
          </div>
        </div>

        <Button type="submit" disabled={loading || !input.trim() || input.length < 10} className="w-full">
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating bullets...
            </>
          ) : (
            'Generate Bullets'
          )}
        </Button>
      </form>

      {error && (
        <div className="p-4 border border-destructive/50 rounded-md bg-destructive/10 text-destructive">{error}</div>
      )}

      {bullets.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Generated Bullets</h3>
            <Button variant="outline" size="sm" onClick={copyToClipboard} disabled={copied}>
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

          <div className="p-4 border border-border rounded-md bg-card">
            <ul className="space-y-2">
              {bullets.map((bullet, index) => (
                <li key={index} className="flex items-start">
                  <span className="mr-2 text-primary">•</span>
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          </div>

          {cacheStats && (
            <div className="p-3 border border-border rounded-md bg-muted/50">
              <p className="text-sm text-muted-foreground">
                Cache: {cacheStats.enabled ? 'Enabled' : 'Disabled'}
                {cacheStats.enabled && ` (${cacheStats.size}/${cacheStats.maxSize} entries)`}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
