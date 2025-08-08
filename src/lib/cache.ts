import { CacheEntry, CacheConfig } from '@/types';

export class MemoryCache {
  private cache: Map<string, CacheEntry> = new Map();
  private config: CacheConfig;

  constructor(config: CacheConfig) {
    this.config = config;
  }

  /**
   * Generate a cache key from the input text
   */
  private generateKey(input: string): string {
    // Use a simple hash for the cache key
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return `bullets:${Math.abs(hash)}`;
  }

  /**
   * Check if an entry is expired
   */
  private isExpired(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp > entry.ttl;
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    const entries = Array.from(this.cache.entries());
    for (const [key, entry] of entries) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Get a cached response for the given input
   */
  get(input: string): CacheEntry | null {
    if (!this.config.enabled) {
      return null;
    }

    this.cleanup();
    const key = this.generateKey(input);
    const entry = this.cache.get(key);

    if (!entry || this.isExpired(entry)) {
      if (entry) {
        this.cache.delete(key);
      }
      return null;
    }

    return entry;
  }

  /**
   * Store a response in the cache
   */
  set(input: string, bullets: string[], truncated: boolean): void {
    if (!this.config.enabled) {
      return;
    }

    this.cleanup();

    // If cache is full, remove oldest entries
    if (this.cache.size >= this.config.maxSize) {
      const entries = Array.from(this.cache.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);

      // Remove oldest 20% of entries
      const toRemove = Math.ceil(this.config.maxSize * 0.2);
      for (let i = 0; i < toRemove && i < entries.length; i++) {
        this.cache.delete(entries[i][0]);
      }
    }

    const key = this.generateKey(input);
    const entry: CacheEntry = {
      bullets,
      truncated,
      timestamp: Date.now(),
      ttl: this.config.ttl,
    };

    this.cache.set(key, entry);
  }

  /**
   * Clear all cached entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats(): { size: number; maxSize: number; enabled: boolean } {
    return {
      size: this.cache.size,
      maxSize: this.config.maxSize,
      enabled: this.config.enabled,
    };
  }
}

// Create a singleton instance
const cacheConfig: CacheConfig = {
  enabled: process.env.ENABLE_CACHE === 'true',
  ttl: parseInt(process.env.CACHE_TTL || '3600000'), // 1 hour default
  maxSize: parseInt(process.env.CACHE_MAX_SIZE || '1000'), // 1000 entries default
};

const memoryCache = new MemoryCache(cacheConfig);

export { memoryCache as cache };
