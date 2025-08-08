# ✨ DotDotDot

**DotDotDot** is a minimal, fast, and professional tool that transforms walls of text into clean, concise bullet points using AI. Designed for clarity, cost-efficiency, and elegance — not gimmicks.

## 🚀 Quick Start

1. Clone the repository
2. Install dependencies: `pnpm install`
3. Copy `.env.example` to `.env.local` and add your environment variables
4. Run the development server: `pnpm dev`
5. Open [http://localhost:3000](http://localhost:3000)

## 🔧 Cache Configuration

The application includes a local memory cache system that can be enabled/disabled using feature flags.

### Environment Variables

```bash
# Cache Configuration
ENABLE_CACHE=true                    # Enable/disable cache (default: false)
CACHE_TTL=3600000                   # Cache TTL in milliseconds (default: 1 hour)
CACHE_MAX_SIZE=1000                 # Maximum cache entries (default: 1000)
```

### Cache Features

- **Local Memory Storage**: Uses in-memory Map for fast access
- **TTL Support**: Automatic expiration of cached entries
- **Size Management**: Automatic cleanup when cache reaches max size
- **Feature Flag**: Can be completely disabled via environment variable
- **Hash-based Keys**: Efficient key generation using simple hash function

### Usage

The cache is automatically integrated into the AI response generation. When enabled:

1. **Cache Hit**: Returns cached response immediately (no API call)
2. **Cache Miss**: Calls AI API and stores result in cache
3. **Automatic Cleanup**: Expired entries are removed automatically
4. **Size Management**: Oldest entries are removed when cache is full

### Cache Statistics

In development mode, the API returns cache statistics:

```json
{
  "bullets": ["bullet 1", "bullet 2"],
  "truncated": false,
  "originalLength": 150,
  "processedLength": 150,
  "cacheStats": {
    "size": 5,
    "maxSize": 1000,
    "enabled": true
  }
}
```

## 🧪 Testing

Run tests with:

```bash
pnpm test
```

The cache implementation includes comprehensive tests covering:

- Cache enable/disable functionality
- TTL expiration
- Size management
- Cleanup operations
- Statistics reporting

## 📁 Project Structure

```
src/
├── types/
│   └── index.ts              # TypeScript interfaces
├── lib/
│   ├── cache.ts              # Memory cache implementation
│   ├── cache.test.ts         # Cache tests
│   ├── callAI.ts             # AI API integration
│   ├── processUserInput.ts   # Input processing
│   └── rateLimit.ts          # Rate limiting
└── app/
    └── api/
        └── bullets/
            └── route.ts      # API endpoint
```

## 🔄 Cache Implementation Details

### MemoryCache Class

The `MemoryCache` class provides:

- **Thread-safe operations**: Uses Map for concurrent access
- **Automatic cleanup**: Removes expired entries on access
- **Size management**: Removes oldest entries when full
- **Configurable TTL**: Per-entry time-to-live
- **Statistics**: Cache size and configuration info

### Integration Points

1. **callAI.ts**: Checks cache before making API calls
2. **route.ts**: Returns cache stats in development
3. **Environment**: Configuration via environment variables

### Future Enhancements

- Redis integration for distributed caching
- Cache warming strategies
- Cache invalidation patterns
- Performance monitoring and metrics

## 🎯 Development

### Adding Cache to New Features

1. Import the cache: `import { cache } from "@/src/lib/cache"`
2. Check cache before expensive operations: `const cached = cache.get(key)`
3. Store results after successful operations: `cache.set(key, result, truncated)`

### Testing Cache Integration

```typescript
// Test cache hit
const result1 = await generateBullets('test input');
const result2 = await generateBullets('test input'); // Should be cached

expect(result1.bullets).toEqual(result2.bullets);
```

## 📄 License

MIT License - see LICENSE file for details.
