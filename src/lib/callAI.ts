import { AIResponse } from '@/types';
import { cache } from './cache';

export async function generateBullets(prompt: string): Promise<AIResponse> {
  console.log('🚀 generateBullets called with prompt length:', prompt.length);

  // Check cache first
  const cachedResult = cache.get(prompt);
  if (cachedResult) {
    console.log('📦 Cache hit - returning cached result');
    return {
      bullets: cachedResult.bullets,
      truncated: cachedResult.truncated,
    };
  }

  console.log('🔍 Cache miss - calling Groq API');
  const maxRetries = 3;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 Attempt ${attempt}/${maxRetries} - Calling Groq API`);

      const requestBody = {
        model: 'compound-beta-mini',
        messages: [
          {
            role: 'system',
            content:
              'You are an expert summarizer. Always respond with valid JSON only. Do not include any other text, formatting, or explanations outside the JSON structure.',
          },
          {
            role: 'user',
            content: `Convert this text into 3–5 clear, professional bullet points. Return the response as JSON with this exact structure:

{
  "bullets": [
    "First bullet point",
    "Second bullet point",
    "Third bullet point"
  ]
}

Text to summarize:
${prompt}`,
          },
        ],
        temperature: 0.3,
        max_tokens: 300,
      };

      console.log('📤 Request body:', JSON.stringify(requestBody, null, 2));

      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log('📥 Response status:', res.status, res.statusText);

      if (!res.ok) {
        const errorText = await res.text();
        console.error('❌ API Error Response:', errorText);
        throw new Error(`API request failed: ${res.status} ${res.statusText} - ${errorText}`);
      }

      const body = await res.json();
      console.log('📄 Full API Response:', JSON.stringify(body, null, 2));

      const content = body.choices?.[0]?.message?.content || '';
      console.log('📝 Extracted content:', content);

      if (!content) {
        throw new Error('Empty response from AI service');
      }

      // Parse JSON response
      let bullets: string[] = [];
      try {
        // Remove markdown code block formatting if present
        let cleanContent = content.trim();
        if (cleanContent.startsWith('```') && cleanContent.endsWith('```')) {
          cleanContent = cleanContent.replace(/^```[\w]*\n?/, '').replace(/\n?```$/, '');
        }
        console.log('🧹 Cleaned content:', cleanContent);

        const jsonResponse = JSON.parse(cleanContent.trim());
        console.log('📋 Parsed JSON:', jsonResponse);

        if (jsonResponse.bullets && Array.isArray(jsonResponse.bullets)) {
          bullets = jsonResponse.bullets.filter(
            (bullet: any) => typeof bullet === 'string' && bullet.trim().length > 0
          );
        } else {
          throw new Error('Invalid JSON structure: missing bullets array');
        }
      } catch (parseError) {
        console.error('❌ JSON parse error:', parseError);
        console.log('🔄 Falling back to text parsing...');

        // Fallback to old parsing method if JSON fails
        bullets = content
          .split(/\n/)
          .filter((line: string) => line.trim().startsWith('-') || line.trim().startsWith('•'))
          .map((bullet: string) => bullet.trim());
      }

      console.log('🎯 Final bullets:', bullets);

      const result = { bullets, truncated: false };

      // Cache the successful result
      cache.set(prompt, bullets, false);
      console.log('💾 Result cached successfully');

      return result;
    } catch (error) {
      console.error(`❌ Attempt ${attempt} failed:`, error);
      lastError = error as Error;
      if (attempt < maxRetries) {
        console.log(`⏳ Waiting before retry...`);
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
