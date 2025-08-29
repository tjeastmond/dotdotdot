'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from './ui/textarea';

export function TextToBulletsForm() {
  const [text, setText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [bullets, setBullets] = useState<string[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/bullets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });

      if (response.ok) {
        const data = await response.json();
        setBullets(data.bullets);
      } else {
        console.error('Failed to generate bullets');
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

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
          <Textarea
            value={text}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setText(e.target.value)}
            placeholder="Paste your text here... (articles, reports, transcripts, etc.)"
            className="min-h-[200px] resize-none border-border/50 focus:border-primary/50 focus:ring-primary/20"
            disabled={isLoading}
          />

          <Button
            type="submit"
            disabled={!text.trim() || isLoading}
            className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
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

      {/* Results Section */}
      {bullets.length > 0 && (
        <div className="bg-card border border-border/50 rounded-2xl p-8 shadow-xl">
          <div className="mb-6">
            <h3 className="text-xl font-semibold mb-2">Generated Bullet Points</h3>
            <p className="text-muted-foreground">Here are the key insights from your text</p>
          </div>

          <div className="space-y-3">
            {bullets.map((bullet, index) => (
              <div
                key={index}
                className="flex items-start space-x-3 p-4 bg-muted/30 rounded-lg border border-border/30 hover:border-border/50 transition-colors duration-200"
              >
                <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                <p className="text-foreground leading-relaxed">{bullet}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-6 border-t border-border/30">
            <Button
              onClick={() => {
                setText('');
                setBullets([]);
              }}
              variant="outline"
              className="border-border/50 hover:border-border text-muted-foreground hover:text-foreground"
            >
              Start Over
            </Button>
          </div>
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
