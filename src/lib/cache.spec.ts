import { MemoryCache } from './cache';
import { CacheConfig } from '@/types';

describe('MemoryCache', () => {
  let cache: MemoryCache;
  let config: CacheConfig;

  beforeEach(() => {
    config = {
      enabled: true,
      ttl: 1000, // 1 second for testing
      maxSize: 3,
    };
    cache = new MemoryCache(config);
  });

  afterEach(() => {
    cache.clear();
  });

  describe('when cache is disabled', () => {
    beforeEach(() => {
      config.enabled = false;
      cache = new MemoryCache(config);
    });

    it('should not store entries', () => {
      cache.set('test input', ['bullet 1', 'bullet 2'], false);
      const result = cache.get('test input');
      expect(result).toBeNull();
    });

    it('should not retrieve entries', () => {
      const result = cache.get('test input');
      expect(result).toBeNull();
    });
  });

  describe('when cache is enabled', () => {
    it('should store and retrieve entries', () => {
      const input = 'test input';
      const bullets = ['bullet 1', 'bullet 2'];

      cache.set(input, bullets, false);
      const result = cache.get(input);

      expect(result).not.toBeNull();
      expect(result?.bullets).toEqual(bullets);
      expect(result?.truncated).toBe(false);
    });

    it('should handle truncated responses', () => {
      const input = 'test input';
      const bullets = ['bullet 1'];

      cache.set(input, bullets, true);
      const result = cache.get(input);

      expect(result?.truncated).toBe(true);
    });

    it('should return null for non-existent entries', () => {
      const result = cache.get('non-existent');
      expect(result).toBeNull();
    });

    it('should handle different inputs with different keys', () => {
      const input1 = 'test input 1';
      const input2 = 'test input 2';
      const bullets1 = ['bullet 1'];
      const bullets2 = ['bullet 2'];

      cache.set(input1, bullets1, false);
      cache.set(input2, bullets2, false);

      const result1 = cache.get(input1);
      const result2 = cache.get(input2);

      expect(result1?.bullets).toEqual(bullets1);
      expect(result2?.bullets).toEqual(bullets2);
    });
  });

  describe('TTL functionality', () => {
    it('should expire entries after TTL', async () => {
      const input = 'test input';
      const bullets = ['bullet 1'];

      cache.set(input, bullets, false);

      // Wait for TTL to expire
      await new Promise(resolve => setTimeout(resolve, 1100));

      const result = cache.get(input);
      expect(result).toBeNull();
    });

    it('should not expire entries before TTL', async () => {
      const input = 'test input';
      const bullets = ['bullet 1'];

      cache.set(input, bullets, false);

      // Wait less than TTL
      await new Promise(resolve => setTimeout(resolve, 500));

      const result = cache.get(input);
      expect(result).not.toBeNull();
      expect(result?.bullets).toEqual(bullets);
    });
  });

  describe('maxSize functionality', () => {
    it('should respect maxSize limit', () => {
      // Fill cache to maxSize
      cache.set('input1', ['bullet1'], false);
      cache.set('input2', ['bullet2'], false);
      cache.set('input3', ['bullet3'], false);

      // This should trigger cleanup and remove oldest entries
      cache.set('input4', ['bullet4'], false);

      const stats = cache.getStats();
      expect(stats.size).toBeLessThanOrEqual(config.maxSize);
    });

    it('should remove oldest entries when cache is full', () => {
      // Fill cache to maxSize
      cache.set('input1', ['bullet1'], false);
      cache.set('input2', ['bullet2'], false);
      cache.set('input3', ['bullet3'], false);

      // Add one more to trigger cleanup
      cache.set('input4', ['bullet4'], false);

      // The oldest entry should be removed
      const result1 = cache.get('input1');
      expect(result1).toBeNull();

      // Newer entries should still be there
      const result4 = cache.get('input4');
      expect(result4).not.toBeNull();
    });
  });

  describe('cleanup functionality', () => {
    it('should remove expired entries during cleanup', async () => {
      const input1 = 'test input 1';
      const input2 = 'test input 2';

      cache.set(input1, ['bullet1'], false);

      // Wait for TTL to expire
      await new Promise(resolve => setTimeout(resolve, 1100));

      cache.set(input2, ['bullet2'], false);

      // input1 should be cleaned up
      const result1 = cache.get(input1);
      expect(result1).toBeNull();

      // input2 should still be there
      const result2 = cache.get(input2);
      expect(result2).not.toBeNull();
    });
  });

  describe('getStats', () => {
    it('should return correct statistics', () => {
      cache.set('input1', ['bullet1'], false);
      cache.set('input2', ['bullet2'], false);

      const stats = cache.getStats();

      expect(stats.size).toBe(2);
      expect(stats.maxSize).toBe(config.maxSize);
      expect(stats.enabled).toBe(config.enabled);
    });
  });

  describe('clear', () => {
    it('should clear all entries', () => {
      cache.set('input1', ['bullet1'], false);
      cache.set('input2', ['bullet2'], false);

      cache.clear();

      const result1 = cache.get('input1');
      const result2 = cache.get('input2');

      expect(result1).toBeNull();
      expect(result2).toBeNull();

      const stats = cache.getStats();
      expect(stats.size).toBe(0);
    });
  });
});
