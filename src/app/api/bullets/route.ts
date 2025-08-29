import { processUserInput } from '@/lib/processUserInput';
import { generateBullets } from '@/lib/callAI';
import { rateLimit } from '@/lib/rateLimit';
import { cache } from '@/lib/cache';
import { validateCSRFToken } from '@/lib/csrf';
import { checkInputSecurity, logSecurityEvent, shouldRateLimitByThreats } from '@/lib/security';

export const runtime = 'edge';

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
    if (!(await validateCSRFToken(csrfToken))) {
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

    // Comprehensive security check
    const securityResult = checkInputSecurity(input);
    
    // Log security events
    if (securityResult.threats.length > 0) {
      logSecurityEvent('threat', `Threats detected: ${securityResult.threats.join(', ')}`, input, ip);
    }
    
    if (securityResult.warnings.length > 0) {
      logSecurityEvent('warning', `Warnings: ${securityResult.warnings.join(', ')}`, input, ip);
    }

    // Block requests with high-risk threats
    if (!securityResult.isSafe) {
      // Additional rate limiting for malicious requests
      if (shouldRateLimitByThreats(securityResult.threats)) {
        logSecurityEvent('blocked', 'Request blocked due to high-risk threats', input, ip);
        return new Response(JSON.stringify({ 
          error: 'Request blocked due to security concerns',
          details: 'Your input contains potentially malicious content that has been blocked.'
        }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    // Use sanitized input for processing
    const { cleaned, tooLong, originalLength } = processUserInput(securityResult.sanitizedInput);

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
      securityInfo: process.env.NODE_ENV === 'development' ? {
        threats: securityResult.threats,
        warnings: securityResult.warnings,
        sanitized: securityResult.sanitizedInput !== input
      } : undefined
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
