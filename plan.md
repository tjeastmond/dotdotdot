# ✨ DotDotDot

**DotDotDot** is a minimal, fast, and professional tool that transforms walls of text into clean, concise bullet points using AI. Designed for clarity, cost-efficiency, and elegance — not gimmicks.

---

## 📌 Overview

DotDotDot helps users:

- Summarize dense content (emails, resumes, job descriptions)
- Improve clarity by converting paragraphs into bullets
- Save time without sacrificing tone or precision

---

## Tech Stack

| Layer     | Technology                         |
| --------- | ---------------------------------- |
| Framework | Next.js (App Router) + TypeScript  |
| Styling   | Tailwind CSS + Shadcn UI + Radix   |
| Backend   | Node.js via Next.js route handlers |
| AI Engine | Compound Beta Mini via Groq API    |
| Database  | None for MVP                       |
| Packaging | PNPM                               |
| Hosting   | Vercel                             |
| Testing   | Jest + Testing Library             |

---

## Rules

- Prefer server components when possible, use `use client` only when necessary for interactivity
- Always write tests before writing code
- Design a bold front end
- Our code will live in the `src/` directory
- Use Conventional Commits: https://www.conventionalcommits.org/en/v1.0.0/#specification

---

## Cost Control Strategy

- Uses **Compound Beta Mini** via **Groq**, which is free for reasonable usage
- Input is normalized and truncated to ~1000 characters
- Common noise like greetings, signatures, and excess whitespace are removed
- Can later implement rate limiting, caching, or auth-based usage tiers

---

## 🧩 Core Components

### Types & Interfaces

```ts
// src/types/index.ts
export interface ProcessedInput {
  cleaned: string;
  tooLong: boolean;
  originalLength: number;
}

export interface AIResponse {
  bullets: string[];
  truncated: boolean;
  error?: string;
}

export interface APIError {
  message: string;
  code: string;
  status: number;
}
```

### `processUserInput.ts`

Handles input cleanup and character limit enforcement.

```ts
export function processUserInput(raw: string): ProcessedInput {
  let cleaned = raw.trim();
  cleaned = cleaned.replace(/^(hi|hello|dear)[^\n]*\n/i, '');
  cleaned = cleaned.replace(/(best regards|sincerely|cheers)[^\n]*$/i, '');
  cleaned = cleaned.replace(/\n{2,}/g, '\n');
  cleaned = cleaned.replace(/[ \t]{2,}/g, ' ');
  const MAX_CHARS = 1000;
  if (cleaned.length > MAX_CHARS) {
    return {
      cleaned: cleaned.slice(0, MAX_CHARS) + '...',
      tooLong: true,
      originalLength: raw.length,
    };
  }
  return {
    cleaned,
    tooLong: false,
    originalLength: raw.length,
  };
}
```

### `callAI.ts`

Handles communication with the Claude API (via Groq) with error handling and retries.

```ts
export async function generateBullets(prompt: string): Promise<AIResponse> {
  const maxRetries = 3;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
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
      });

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
        .filter(line => line.trim().startsWith('-') || line.trim().startsWith('•'))
        .map(bullet => bullet.trim());

      return { bullets, truncated: false };
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
```

### Route

```ts
import { processUserInput } from '@/src/lib/processUserInput';
import { generateBullets } from '@/src/lib/callAI';
import { rateLimit } from '@/src/lib/rateLimit';

export async function POST(req: Request) {
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

    return Response.json({
      bullets: result.bullets,
      truncated: tooLong,
      originalLength,
      processedLength: cleaned.length,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
```

### Rate Limiting Utility

```ts
// src/lib/rateLimit.ts
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export async function rateLimit(ip: string): Promise<{ success: boolean; remaining: number }> {
  const key = `rate_limit:${ip}`;
  const limit = 10; // requests per minute
  const window = 60; // seconds

  const current = await redis.incr(key);

  if (current === 1) {
    await redis.expire(key, window);
  }

  if (current > limit) {
    return { success: false, remaining: 0 };
  }

  return { success: true, remaining: limit - current };
}
```

---

## Testing Strategy

### Unit Tests

- **Input processor** (`lib/processUserInput.test.ts`): Test cleanup, truncation, edge cases
- **AI caller** (`lib/callAI.test.ts`): Test retry logic, error handling, response parsing
- **Rate limiting** (`lib/rateLimit.test.ts`): Test rate limit logic and Redis integration

### Integration Tests

- **API route** (`__tests__/api.test.ts`): Test full request/response flow
- **Error scenarios**: API failures, malformed input, rate limiting
- **Performance**: Response time validation

### E2E Tests

- **Critical user journeys**: Input → processing → output display
- **Mobile responsiveness**: Test on various screen sizes
- **Accessibility**: Screen reader compatibility

### Test Data

- Job descriptions, resumes, business emails
- Long, messy input to confirm truncation
- Edge cases: empty input, very short input, special characters

---

## Security Considerations

### Input Validation & Sanitization

- Sanitize HTML/script tags from user input
- Validate input length and format
- Implement CSRF protection for API routes

### Rate Limiting

- Per-IP rate limiting (10 requests/minute)
- Consider user-based limits for future auth system

### Environment Security

- Validate all required environment variables on startup
- Use secure headers (helmet.js)
- Implement proper CORS configuration

### API Security

- Validate API keys and tokens
- Implement request logging for security monitoring
- Add request/response validation middleware

---

## Performance & UX

### Loading States

- Skeleton loading for bullet generation
- Progress indicators for long inputs
- Optimistic UI updates where possible

### Caching Strategy

- Cache successful AI responses (Redis)
- Implement client-side caching for repeated requests
- Consider CDN for static assets

### User Experience

- Real-time character count indicator
- Copy-to-clipboard functionality
- Keyboard shortcuts for common actions
- Progressive enhancement for core functionality

### Performance Monitoring

- Track API response times
- Monitor error rates and user experience
- Implement performance budgets

---

## Environment Setup

### Required Environment Variables

```bash
# AI Service
GROQ_API_KEY=your_groq_api_key

# Rate Limiting (Optional for MVP)
UPSTASH_REDIS_REST_URL=your_redis_url
UPSTASH_REDIS_REST_TOKEN=your_redis_token

# App Configuration
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

### Development Setup

1. Clone repository
2. Install dependencies: `pnpm install`
3. Copy `.env.example` to `.env.local`
4. Add required environment variables
5. Run development server: `pnpm dev`
6. Run tests: `pnpm test`

---

## Deployment Pipeline

### CI/CD (GitHub Actions)

- Run tests on pull requests
- Type checking and linting
- Build verification
- Automatic deployment to Vercel

### Environment Management

- Separate environments for staging/production
- Environment variable validation
- Database migrations (future)

---

## Roadmap

### Phase 1 (MVP)

- [x] Core functionality
- [x] Basic UI
- [x] Error handling
- [x] Rate limiting

### Phase 2 (Enhancement)

- UI polish and mobile responsiveness
- Add affiliate call-to-action (Grammarly, Jasper, etc.)
- Add tone selector (Professional, Friendly, Direct)
- Export to PDF or Markdown

### Phase 3 (Monetization)

- Pro plan via Stripe
- Optional login + history (Supabase or Planetscale)
- Advanced features (custom templates, bulk processing)

---

## Design Philosophy

- Mobile first
- No drop shadows
- Crisp, modern dark theme (inspired by Vercel)
- Monospace or thin sans-serif typography
- Accessibility-friendly color contrast

---

## Monitoring & Analytics (Low Priority)

### Error Tracking

- Implement Sentry for error monitoring
- Track API failures and user errors
- Monitor performance metrics

### Usage Analytics

- Track feature usage for cost optimization
- Monitor user behavior patterns
- A/B testing framework for future features

### Performance Monitoring

- Real User Monitoring (RUM)
- Core Web Vitals tracking
- API response time monitoring
