import { VercelKVService } from './kv';

// Mock Vercel KV
jest.mock('@vercel/kv', () => ({
  kv: {
    get: jest.fn(),
    set: jest.fn(),
    setex: jest.fn(),
    del: jest.fn(),
    exists: jest.fn(),
    expire: jest.fn(),
    incr: jest.fn(),
    decr: jest.fn(),
    mget: jest.fn(),
    mset: jest.fn(),
    keys: jest.fn(),
    ping: jest.fn().mockResolvedValue('PONG'),
  },
}));

describe('VercelKVService', () => {
  let vercelKV: VercelKVService;
  let mockKV: any;

  beforeEach(() => {
    const { kv } = require('@vercel/kv');
    mockKV = kv;

    vercelKV = new VercelKVService({
      enabled: true,
      keyPrefix: 'test',
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
    // Reset the ping mock to return PONG by default
    mockKV.ping.mockResolvedValue('PONG');
  });

  describe('get', () => {
    it('should retrieve value from Vercel KV', async () => {
      const mockValue = { bullets: ['bullet 1'], truncated: false };
      mockKV.get.mockResolvedValue(mockValue);

      const result = await vercelKV.get('test-key');

      expect(mockKV.get).toHaveBeenCalledWith('test:test-key');
      expect(result).toEqual(mockValue);
    });

    it('should return null when key not found', async () => {
      mockKV.get.mockResolvedValue(null);

      const result = await vercelKV.get('non-existent');

      expect(result).toBeNull();
    });

    it('should return null when disabled', async () => {
      const disabledKV = new VercelKVService({ enabled: false });

      const result = await disabledKV.get('test-key');

      expect(result).toBeNull();
      expect(mockKV.get).not.toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockKV.get.mockRejectedValue(new Error('KV error'));

      const result = await vercelKV.get('test-key');

      expect(result).toBeNull();
      consoleSpy.mockRestore();
    });
  });

  describe('set', () => {
    it('should store value in Vercel KV without TTL', async () => {
      const value = { bullets: ['bullet 1'], truncated: false };

      await vercelKV.set('test-key', value);

      expect(mockKV.set).toHaveBeenCalledWith('test:test-key', value);
      expect(mockKV.setex).not.toHaveBeenCalled();
    });

    it('should store value with TTL', async () => {
      const value = { bullets: ['bullet 1'], truncated: false };
      const ttlSeconds = 3600;

      await vercelKV.set('test-key', value, ttlSeconds);

      expect(mockKV.setex).toHaveBeenCalledWith('test:test-key', ttlSeconds, value);
      expect(mockKV.set).not.toHaveBeenCalled();
    });

    it('should not store when disabled', async () => {
      const disabledKV = new VercelKVService({ enabled: false });

      await disabledKV.set('test-key', 'value');

      expect(mockKV.set).not.toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockKV.set.mockRejectedValue(new Error('KV error'));

      await expect(vercelKV.set('test-key', 'value')).resolves.not.toThrow();
      consoleSpy.mockRestore();
    });
  });

  describe('del', () => {
    it('should delete key from Vercel KV', async () => {
      await vercelKV.del('test-key');

      expect(mockKV.del).toHaveBeenCalledWith('test:test-key');
    });

    it('should handle errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockKV.del.mockRejectedValue(new Error('KV error'));

      await expect(vercelKV.del('test-key')).resolves.not.toThrow();
      consoleSpy.mockRestore();
    });
  });

  describe('exists', () => {
    it('should check if key exists', async () => {
      mockKV.exists.mockResolvedValue(1);

      const result = await vercelKV.exists('test-key');

      expect(mockKV.exists).toHaveBeenCalledWith('test:test-key');
      expect(result).toBe(true);
    });

    it('should return false when key does not exist', async () => {
      mockKV.exists.mockResolvedValue(0);

      const result = await vercelKV.exists('test-key');

      expect(result).toBe(false);
    });

    it('should handle errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockKV.exists.mockRejectedValue(new Error('KV error'));

      const result = await vercelKV.exists('test-key');

      expect(result).toBe(false);
      consoleSpy.mockRestore();
    });
  });

  describe('expire', () => {
    it('should set expiration for key', async () => {
      const ttlSeconds = 3600;

      await vercelKV.expire('test-key', ttlSeconds);

      expect(mockKV.expire).toHaveBeenCalledWith('test:test-key', ttlSeconds);
    });

    it('should handle errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockKV.expire.mockRejectedValue(new Error('KV error'));

      await expect(vercelKV.expire('test-key', 3600)).resolves.not.toThrow();
      consoleSpy.mockRestore();
    });
  });

  describe('incr', () => {
    it('should increment counter', async () => {
      mockKV.incr.mockResolvedValue(5);

      const result = await vercelKV.incr('counter');

      expect(mockKV.incr).toHaveBeenCalledWith('test:counter');
      expect(result).toBe(5);
    });

    it('should handle errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockKV.incr.mockRejectedValue(new Error('KV error'));

      const result = await vercelKV.incr('counter');

      expect(result).toBe(0);
      consoleSpy.mockRestore();
    });
  });

  describe('decr', () => {
    it('should decrement counter', async () => {
      mockKV.decr.mockResolvedValue(3);

      const result = await vercelKV.decr('counter');

      expect(mockKV.decr).toHaveBeenCalledWith('test:counter');
      expect(result).toBe(3);
    });

    it('should handle errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockKV.decr.mockRejectedValue(new Error('KV error'));

      const result = await vercelKV.decr('counter');

      expect(result).toBe(0);
      consoleSpy.mockRestore();
    });
  });

  describe('mget', () => {
    it('should get multiple values', async () => {
      const keys = ['key1', 'key2', 'key3'];
      const values = ['value1', 'value2', null];
      mockKV.mget.mockResolvedValue(values);

      const result = await vercelKV.mget(keys);

      expect(mockKV.mget).toHaveBeenCalledWith('test:key1', 'test:key2', 'test:key3');
      expect(result).toEqual(values);
    });

    it('should handle errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockKV.mget.mockRejectedValue(new Error('KV error'));

      const result = await vercelKV.mget(['key1', 'key2']);

      expect(result).toEqual([null, null]);
      consoleSpy.mockRestore();
    });
  });

  describe('mset', () => {
    it('should set multiple key-value pairs', async () => {
      const keyValuePairs = { key1: 'value1', key2: 'value2' };

      await vercelKV.mset(keyValuePairs);

      expect(mockKV.mset).toHaveBeenCalledWith({
        'test:key1': 'value1',
        'test:key2': 'value2',
      });
    });

    it('should handle errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockKV.mset.mockRejectedValue(new Error('KV error'));

      await expect(vercelKV.mset({ key1: 'value1' })).resolves.not.toThrow();
      consoleSpy.mockRestore();
    });
  });

  describe('keys', () => {
    it('should get keys matching pattern', async () => {
      const keys = ['test:key1', 'test:key2'];
      mockKV.keys.mockResolvedValue(keys);

      const result = await vercelKV.keys('*');

      expect(mockKV.keys).toHaveBeenCalledWith('test:*');
      expect(result).toEqual(keys);
    });

    it('should handle errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockKV.keys.mockRejectedValue(new Error('KV error'));

      const result = await vercelKV.keys('*');

      expect(result).toEqual([]);
      consoleSpy.mockRestore();
    });
  });

  describe('flushall', () => {
    it('should flush all keys with prefix', async () => {
      const keys = ['test:key1', 'test:key2'];
      mockKV.keys.mockResolvedValue(keys);
      mockKV.del.mockResolvedValue(2);

      await vercelKV.flushall();

      expect(mockKV.keys).toHaveBeenCalledWith('test:*');
      expect(mockKV.del).toHaveBeenCalledWith('test:key1', 'test:key2');
    });

    it('should handle empty keys gracefully', async () => {
      mockKV.keys.mockResolvedValue([]);

      await vercelKV.flushall();

      expect(mockKV.del).not.toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockKV.keys.mockRejectedValue(new Error('KV error'));

      await expect(vercelKV.flushall()).resolves.not.toThrow();
      consoleSpy.mockRestore();
    });
  });

  describe('ping', () => {
    it('should ping Vercel KV', async () => {
      const result = await vercelKV.ping();

      expect(mockKV.ping).toHaveBeenCalled();
      expect(result).toBe('PONG');
    });

    it('should handle ping errors', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockKV.ping.mockRejectedValue(new Error('KV error'));

      await expect(vercelKV.ping()).rejects.toThrow('KV error');
      consoleSpy.mockRestore();
    });
  });

  describe('isHealthy', () => {
    it('should return true when healthy', async () => {
      const result = await vercelKV.isHealthy();

      expect(result).toBe(true);
    });

    it('should return false when unhealthy', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockKV.ping.mockRejectedValue(new Error('KV error'));

      const result = await vercelKV.isHealthy();

      expect(result).toBe(false);
      consoleSpy.mockRestore();
    });
  });

  describe('key generation', () => {
    it('should generate keys with prefix', async () => {
      await vercelKV.set('test-key', 'value');

      expect(mockKV.set).toHaveBeenCalledWith('test:test-key', 'value');
    });

    it('should use custom prefix', async () => {
      const customKV = new VercelKVService({
        enabled: true,
        keyPrefix: 'custom',
      });

      await customKV.set('test-key', 'value');

      expect(mockKV.set).toHaveBeenCalledWith('custom:test-key', 'value');
    });
  });
});
