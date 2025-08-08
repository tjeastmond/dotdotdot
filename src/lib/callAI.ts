import { AIResponse } from '@/types';
import { cache } from './cache';

export async function generateBullets(prompt: string): Promise<AIResponse> {
  // Check cache first
  const cachedResult = cache.get(prompt);
  if (cachedResult) {
    return {
      bullets: cachedResult.bullets,
      truncated: cachedResult.truncated,
    };
  }

  const maxRetries = 3;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'claude-3-haiku-20240307',
            messages: [
              { role: 'system', content: 'You are an expert summarizer.' },
              {
                role: 'user',
                content: `Convert this text into 3–5 clear, professional bullet points:\n\n${prompt}`,
              },
            ],
            temperature: 0.3,
            max_tokens: 300,
          }),
        }
      );

      if (!res.ok) {
        throw new Error(`API request failed: ${res.status} ${res.statusText}`);
      }

      const body = await res.json();
      const content = body.choices?.[0]?.message?.content || '';

      if (!content) {
        throw new Error('Empty response from AI service');
      }

      const bullets = content
        .split(/\n/)
        .filter(
          (line: string) =>
            line.trim().startsWith('-') || line.trim().startsWith('•')
        )
        .map((bullet: string) => bullet.trim());

      const result = { bullets, truncated: false };

      // Cache the successful result
      cache.set(prompt, bullets, false);

      return result;
    } catch (error) {
      lastError = error as Error;
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        continue;
      }
    }
  }

  return {
    bullets: [],
    truncated: false,
    error: `Failed to generate bullets after ${maxRetries} attempts: ${lastError?.message}`,
  };
}
