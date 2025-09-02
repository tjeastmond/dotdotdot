import { vercelKV } from './kv';

export interface CacheEntry {
  bullets: string[];
  truncated: boolean;
  timestamp: number;
  ttl: number;
}

export interface CacheConfig {
  defaultTtl: number;
  maxSize: number;
  keyPrefix?: string;
  enabled: boolean;
}

export class VercelKVCache {
  private config: CacheConfig;

  constructor(config: CacheConfig) {
    this.config = {
      keyPrefix: 'cache',
      ...config,
    };
  }

  private generateKey(input: string): string {
    // Use a simple hash function that works in Edge Runtime
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return `${this.config.keyPrefix}:${Math.abs(hash)}`;
  }

  async get(input: string): Promise<CacheEntry | null> {
    if (!this.config.enabled) {
      return null;
    }

    try {
      const key = this.generateKey(input);
      const cached = await vercelKV.get<CacheEntry>(key);

      if (!cached) {
        return null;
      }

      // Check if entry is expired
      const now = Date.now();
      if (now > cached.timestamp + cached.ttl) {
        await vercelKV.del(key);
        return null;
      }

      return cached;
    } catch (error) {
      console.error('Vercel KV cache get error:', error);
      return null;
    }
  }

  async set(input: string, bullets: string[], truncated: boolean, ttl?: number): Promise<void> {
    if (!this.config.enabled) {
      return;
    }

    try {
      const key = this.generateKey(input);
      const entry: CacheEntry = {
        bullets,
        truncated,
        timestamp: Date.now(),
        ttl: ttl || this.config.defaultTtl,
      };

      const ttlSeconds = Math.ceil(entry.ttl / 1000);
      await vercelKV.set(key, entry, ttlSeconds);
    } catch (error) {
      console.error('Vercel KV cache set error:', error);
    }
  }

  async delete(input: string): Promise<void> {
    try {
      const key = this.generateKey(input);
      await vercelKV.del(key);
    } catch (error) {
      console.error('Vercel KV cache delete error:', error);
    }
  }

  async clear(): Promise<void> {
    try {
      await vercelKV.flushall();
    } catch (error) {
      console.error('Vercel KV cache clear error:', error);
    }
  }

  async getStats(): Promise<{ size: number; maxSize: number; enabled: boolean }> {
    try {
      const keys = await vercelKV.keys('*');
      return {
        size: keys.length,
        maxSize: this.config.maxSize,
        enabled: this.config.enabled,
      };
    } catch (error) {
      console.error('Vercel KV cache stats error:', error);
      // Return default stats when Vercel KV is unavailable (e.g., local development)
      return {
        size: 0,
        maxSize: this.config.maxSize,
        enabled: this.config.enabled,
      };
    }
  }

  async isHealthy(): Promise<boolean> {
    try {
      return await vercelKV.isHealthy();
    } catch (error) {
      console.error('Vercel KV cache health check failed:', error);
      return false;
    }
  }
}

import { config } from '@/config';

// Create default cache instance
export const vercelKVCache = new VercelKVCache(config.cache);
