# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview
DotDotDot is a Next.js 15 application that transforms long text into concise bullet points using AI (Groq). The app uses Edge Runtime for API routes and Vercel KV for distributed caching and rate limiting.

## Development Commands

### Running the Application
```bash
# Start development server with Turbopack
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

### Testing
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Code Quality
```bash
# TypeScript type checking
npm run type-check

# Format code with Prettier
npm run format

# Check formatting without changes
npm run format:check
```

## Environment Setup
Copy `.env.example` to `.env.local` and configure:
- `GROQ_API_KEY`: Required for AI bullet generation
- `ENABLE_CACHE`: Enable/disable Vercel KV caching (default: false)
- `CSRF_SECRET`: Change this value in production
- Vercel KV vars (`KV_URL`, etc.): Auto-configured by Vercel when KV is enabled

## Architecture

### Core Components
- **Next.js 15 App Router**: Uses `src/app/` directory structure with Edge Runtime for API routes
- **Streaming AI Integration**: Real-time bullet point generation with smooth animations
- **Security-First Design**: Multi-layer security with CSRF protection, input sanitization, and rate limiting

### API Routes (Edge Runtime)
- `POST /api/bullets`: Main endpoint for bullet generation with security checks
- `GET /api/csrf-token`: CSRF token generation endpoint

Both routes run on Edge Runtime for optimal performance with Vercel KV.

### Key Services & Utilities

#### Security (`src/lib/security.ts`)
Comprehensive input validation detecting:
- XSS attempts (script tags, javascript: protocol)
- HTML/SQL/Command injection
- URL injection and file path traversal
- Control characters and null bytes
- DoS patterns (repeated chars, oversized input)

All malicious input is sanitized before processing. Threats are logged in production.

#### Caching Strategy
Two implementations based on environment:
- **Vercel KV Cache** (`src/lib/kvCache.ts`): Production-grade distributed cache using Vercel KV
- **Memory Cache** (`src/lib/cache.ts`): Local development fallback

Cache features:
- TTL-based expiration
- Size management with automatic cleanup
- Hash-based key generation for input deduplication
- Feature flag control via `ENABLE_CACHE`

#### Rate Limiting
Two implementations:
- **Vercel KV Rate Limit** (`src/lib/kvRateLimit.ts`): Edge-compatible distributed rate limiting
- **Memory Rate Limit** (`src/lib/rateLimit.ts`): Local fallback

Default: 10 requests per minute per IP, with enhanced limiting for security threats.

#### AI Integration (`src/lib/callAI.ts`)
- Interfaces with Groq API for bullet generation
- Automatic cache layer integration
- Handles streaming responses
- Error handling and retry logic

### Theme System
- Three themes: light, dark, system (follows OS preference)
- `src/components/ThemeProvider.tsx`: Context provider with localStorage persistence
- `src/components/ThemeToggle.tsx`: Theme switcher component
- `src/components/ClientOnly.tsx`: Prevents hydration mismatches for client-side features

### State Management
- No external state management library
- Theme state via React Context
- Form state via React hooks
- Server state managed through API calls

### Testing Strategy
- **Jest + React Testing Library**: Component and integration tests
- **Path alias**: `@/` maps to `src/`
- **Setup**: `jest.setup.js` configures Testing Library
- **Coverage**: Collects from `src/**/*.{js,jsx,ts,tsx}`, excludes `.d.ts` and stories

## Important Patterns

### Edge Runtime Compatibility
All API routes use Edge Runtime (`export const runtime = 'edge'`). When adding dependencies:
- Ensure compatibility with Edge Runtime (no Node.js-specific APIs)
- Use Vercel KV instead of memory storage for production
- Avoid file system operations

### Security Middleware Flow
1. Content-Type validation
2. Rate limiting (IP-based)
3. CSRF token validation
4. Security scan (sanitization happens here)
5. Input length/format validation
6. Processing and AI generation

### Cache Key Generation
Uses simple hash function (not crypto hash) for cache keys to maintain Edge Runtime compatibility. Hash collisions are acceptable for this use case.

### Error Handling
- API routes return JSON with descriptive error messages
- Development mode includes additional debug info (cache stats, security info)
- Production mode omits sensitive details

## TypeScript Configuration
- **Strict mode enabled**: Full type safety required
- **Path mapping**: `@/*` resolves to `src/*`
- **Target**: ES5 for broad compatibility
- **Module resolution**: bundler (Next.js 15)

## Deployment Notes
- **Platform**: Designed for Vercel
- **Node version**: 22 (see `engines` in package.json)
- **Vercel KV**: Required for production (cache + rate limiting)
- **Environment variables**: Must configure all vars from `.env.example`

## Commit Standards
Use Conventional Commits format for all commit messages:
- `feat:` for new features
- `fix:` for bug fixes
- `docs:` for documentation changes
- `style:` for formatting changes
- `refactor:` for code refactoring
- `test:` for test additions/changes
- `chore:` for maintenance tasks
