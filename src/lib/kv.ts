import { kv } from '@vercel/kv';
import { config } from '@/config';

export interface VercelKVConfig {
  enabled: boolean;
  keyPrefix?: string;
}

export class VercelKVService {
  private config: VercelKVConfig;

  constructor(config: VercelKVConfig) {
    this.config = config;
  }

  private generateKey(key: string): string {
    return `${this.config.keyPrefix}:${key}`;
  }

  async get<T = any>(key: string): Promise<T | null> {
    if (!this.config.enabled) {
      return null;
    }

    try {
      const fullKey = this.generateKey(key);
      const value = await kv.get<T>(fullKey);
      return value;
    } catch (error) {
      console.error('Vercel KV get error:', error);
      return null;
    }
  }

  async set<T = any>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    if (!this.config.enabled) {
      return;
    }

    try {
      const fullKey = this.generateKey(key);
      if (ttlSeconds) {
        await kv.setex(fullKey, ttlSeconds, value);
      } else {
        await kv.set(fullKey, value);
      }
    } catch (error) {
      console.error('Vercel KV set error:', error);
    }
  }

  async del(key: string): Promise<void> {
    try {
      const fullKey = this.generateKey(key);
      await kv.del(fullKey);
    } catch (error) {
      console.error('Vercel KV delete error:', error);
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const fullKey = this.generateKey(key);
      const result = await kv.exists(fullKey);
      return result === 1;
    } catch (error) {
      console.error('Vercel KV exists error:', error);
      return false;
    }
  }

  async expire(key: string, ttlSeconds: number): Promise<void> {
    try {
      const fullKey = this.generateKey(key);
      await kv.expire(fullKey, ttlSeconds);
    } catch (error) {
      console.error('Vercel KV expire error:', error);
    }
  }

  async incr(key: string): Promise<number> {
    try {
      const fullKey = this.generateKey(key);
      return await kv.incr(fullKey);
    } catch (error) {
      console.error('Vercel KV incr error:', error);
      return 0;
    }
  }

  async decr(key: string): Promise<number> {
    try {
      const fullKey = this.generateKey(key);
      return await kv.decr(fullKey);
    } catch (error) {
      console.error('Vercel KV decr error:', error);
      return 0;
    }
  }

  async mget<T = any>(keys: string[]): Promise<(T | null)[]> {
    try {
      const fullKeys = keys.map(key => this.generateKey(key));
      const result = await kv.mget(...fullKeys);
      return result as (T | null)[];
    } catch (error) {
      console.error('Vercel KV mget error:', error);
      return keys.map(() => null);
    }
  }

  async mset(keyValuePairs: Record<string, any>): Promise<void> {
    try {
      const fullKeyValuePairs: Record<string, any> = {};
      for (const [key, value] of Object.entries(keyValuePairs)) {
        fullKeyValuePairs[this.generateKey(key)] = value;
      }
      await kv.mset(fullKeyValuePairs);
    } catch (error) {
      console.error('Vercel KV mset error:', error);
    }
  }

  async keys(pattern: string): Promise<string[]> {
    try {
      const fullPattern = this.generateKey(pattern);
      return await kv.keys(fullPattern);
    } catch (error) {
      console.error('Vercel KV keys error:', error);
      return [];
    }
  }

  async flushall(): Promise<void> {
    try {
      // Only flush keys with our prefix
      const keys = await this.keys('*');
      if (keys.length > 0) {
        await kv.del(...keys);
      }
    } catch (error) {
      console.error('Vercel KV flushall error:', error);
    }
  }

  async ping(): Promise<string> {
    try {
      return await kv.ping();
    } catch (error) {
      console.error('Vercel KV ping error:', error);
      throw error;
    }
  }

  async isHealthy(): Promise<boolean> {
    try {
      await this.ping();
      return true;
    } catch (error) {
      console.error('Vercel KV health check failed:', error);
      return false;
    }
  }
}

// Create singleton instance
export const vercelKV = new VercelKVService(config.kv);
