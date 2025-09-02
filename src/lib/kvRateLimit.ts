import { vercelKV } from './kv';
import { config } from '@/config';

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetTime: number;
  total: number;
}

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  keyPrefix?: string;
}

export class VercelKVRateLimit {
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
  }

  async checkLimit(identifier: string): Promise<RateLimitResult> {
    try {
      const key = `${this.config.keyPrefix}:${identifier}`;
      const now = Date.now();
      const windowStart = now - this.config.windowMs;

      // Get current count
      const currentCount = (await vercelKV.get<number>(key)) || 0;

      // Check if we're over the limit
      if (currentCount >= this.config.maxRequests) {
        return {
          success: false,
          remaining: 0,
          resetTime: now + this.config.windowMs,
          total: currentCount,
        };
      }

      // Increment counter
      const newCount = await vercelKV.incr(key);

      // Set expiration if this is the first request
      if (newCount === 1) {
        const ttlSeconds = Math.ceil(this.config.windowMs / 1000);
        await vercelKV.expire(key, ttlSeconds);
      }

      const remaining = Math.max(0, this.config.maxRequests - newCount);
      const resetTime = now + this.config.windowMs;

      return {
        success: true,
        remaining,
        resetTime,
        total: newCount,
      };
    } catch (error) {
      console.error('Vercel KV rate limit error:', error);
      // Fallback to allowing the request if Vercel KV is unavailable
      return {
        success: true,
        remaining: this.config.maxRequests - 1,
        resetTime: Date.now() + this.config.windowMs,
        total: 1,
      };
    }
  }

  async getRemaining(identifier: string): Promise<number> {
    try {
      const key = `${this.config.keyPrefix}:${identifier}`;
      const currentCount = (await vercelKV.get<number>(key)) || 0;
      return Math.max(0, this.config.maxRequests - currentCount);
    } catch (error) {
      console.error('Vercel KV rate limit getRemaining error:', error);
      return this.config.maxRequests;
    }
  }

  async reset(identifier: string): Promise<void> {
    try {
      const key = `${this.config.keyPrefix}:${identifier}`;
      await vercelKV.del(key);
    } catch (error) {
      console.error('Vercel KV rate limit reset error:', error);
    }
  }
}

// Create default rate limiter instance
export const vercelKVRateLimit = new VercelKVRateLimit(config.rateLimit);

// Export the main rate limit function for backward compatibility
export async function rateLimit(ip: string): Promise<{ success: boolean; remaining: number }> {
  const result = await vercelKVRateLimit.checkLimit(ip);
  return {
    success: result.success,
    remaining: result.remaining,
  };
}
