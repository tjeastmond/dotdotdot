export const config = {
  // Cache configuration
  cache: {
    enabled: process.env.ENABLE_CACHE === 'true',
    defaultTtl: parseInt(process.env.CACHE_TTL || '3600000'), // 1 hour default
    maxSize: parseInt(process.env.CACHE_MAX_SIZE || '1000'), // 1000 entries default
    keyPrefix: 'cache',
  },

  // Rate limiting configuration
  rateLimit: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10, // 10 requests per minute
    keyPrefix: 'rate_limit',
  },

  // Vercel KV configuration
  kv: {
    enabled: process.env.ENABLE_CACHE === 'true',
    keyPrefix: 'dotdotdot',
  },
} as const;
