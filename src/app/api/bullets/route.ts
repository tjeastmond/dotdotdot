import { processUserInput } from '@/lib/processUserInput';
import { generateBullets } from '@/lib/callAI';
import { rateLimit } from '@/lib/rateLimit';
import { cache } from '@/lib/cache';
import { validateCSRFToken } from '@/lib/csrf';

export async function POST(req: Request) {
  // Security checks
  const origin = req.headers.get('origin');
  const referer = req.headers.get('referer');
  const contentType = req.headers.get('content-type');

  // Check if request is from our domain or localhost (dev)
  const allowedOrigins = [process.env.NEXT_PUBLIC_APP_URL, 'http://localhost:3000', 'http://localhost:3001'].filter(
    Boolean
  );

  if (origin && !allowedOrigins.includes(origin)) {
    return new Response(JSON.stringify({ error: 'Unauthorized origin' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Check referer header
  if (referer && !allowedOrigins.some(allowed => allowed && referer.startsWith(allowed))) {
    return new Response(JSON.stringify({ error: 'Invalid referer' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Check content type
  if (!contentType?.includes('application/json')) {
    return new Response(JSON.stringify({ error: 'Invalid content type' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Rate limiting
  const ip = req.headers.get('x-forwarded-for') || 'unknown';
  const rateLimitResult = await rateLimit(ip);

  if (!rateLimitResult.success) {
    return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
      status: 429,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const { input, csrfToken } = await req.json();

    // Validate CSRF token
    if (!validateCSRFToken(csrfToken)) {
      return new Response(JSON.stringify({ error: 'Invalid or expired security token' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

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
    const cacheStats = process.env.NODE_ENV === 'development' ? cache.getStats() : null;

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
