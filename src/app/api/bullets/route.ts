import { processUserInput } from '../../../lib/processUserInput';
import { generateBullets } from '../../../lib/callAI';
import { rateLimit } from '../../../lib/rateLimit';
import { cache } from '../../../lib/cache';

export async function POST(req: Request) {
  // Rate limiting
  const ip = req.headers.get('x-forwarded-for') || 'unknown';
  const rateLimitResult = await rateLimit(ip);

  if (!rateLimitResult.success) {
    return new Response(
      JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
      { status: 429, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const { input } = await req.json();

    if (!input || typeof input !== 'string') {
      return new Response(JSON.stringify({ error: 'Invalid input format' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { cleaned, tooLong, originalLength } = processUserInput(input);

    if (!cleaned || cleaned.length < 10) {
      return new Response(
        JSON.stringify({
          error: 'Input too short. Please provide at least 10 characters.',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const result = await generateBullets(cleaned);

    if (result.error) {
      return new Response(JSON.stringify({ error: result.error }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get cache stats for debugging (only in development)
    const cacheStats =
      process.env.NODE_ENV === 'development' ? cache.getStats() : null;

    return Response.json({
      bullets: result.bullets,
      truncated: tooLong,
      originalLength,
      processedLength: cleaned.length,
      cacheStats, // Only included in development
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
