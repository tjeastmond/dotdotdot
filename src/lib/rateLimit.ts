// Stub rate limiting implementation - can be replaced with Redis later
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export async function rateLimit(
  ip: string
): Promise<{ success: boolean; remaining: number }> {
  const key = `rate_limit:${ip}`;
  const limit = 10; // requests per minute
  const window = 60 * 1000; // 60 seconds in milliseconds

  const now = Date.now();
  const current = rateLimitStore.get(key);

  if (!current || now > current.resetTime) {
    // First request or window expired
    rateLimitStore.set(key, { count: 1, resetTime: now + window });
    return { success: true, remaining: limit - 1 };
  }

  if (current.count >= limit) {
    return { success: false, remaining: 0 };
  }

  // Increment count
  current.count++;
  rateLimitStore.set(key, current);

  return { success: true, remaining: limit - current.count };
}
