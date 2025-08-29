import crypto from 'crypto';

const CSRF_SECRET = process.env.CSRF_SECRET || 'dev-secret-change-in-production';

export function generateCSRFToken(): string {
  // Use a more deterministic approach for development to reduce hydration issues
  if (process.env.NODE_ENV === 'development') {
    // In development, use a more stable token generation
    const sessionId = process.env.SESSION_ID || 'dev-session';
    const payload = `dev:${sessionId}:${Date.now()}`;

    const hmac = crypto.createHmac('sha256', CSRF_SECRET);
    hmac.update(payload);
    const signature = hmac.digest('hex');

    return `${payload}:${signature}`;
  }

  // Production: use full security with timestamp and random bytes
  const timestamp = Date.now().toString();
  const random = crypto.randomBytes(16).toString('hex');
  const payload = `${timestamp}:${random}`;

  const hmac = crypto.createHmac('sha256', CSRF_SECRET);
  hmac.update(payload);
  const signature = hmac.digest('hex');

  return `${payload}:${signature}`;
}

export function validateCSRFToken(token: string): boolean {
  if (!token) return false;

  try {
    const parts = token.split(':');
    if (parts.length < 3) return false;

    // Handle development tokens differently
    if (process.env.NODE_ENV === 'development' && parts[0] === 'dev') {
      const [prefix, sessionId, timestamp, signature] = parts;
      const payload = `${prefix}:${sessionId}:${timestamp}`;

      // Check if token is too old (5 minutes)
      const tokenTime = parseInt(timestamp);
      const now = Date.now();
      if (now - tokenTime > 5 * 60 * 1000) return false;

      // Verify signature
      const hmac = crypto.createHmac('sha256', CSRF_SECRET);
      hmac.update(payload);
      const expectedSignature = hmac.digest('hex');

      return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
    }

    // Production token validation
    const [timestamp, random, signature] = parts;
    const payload = `${timestamp}:${random}`;

    // Check if token is too old (5 minutes)
    const tokenTime = parseInt(timestamp);
    const now = Date.now();
    if (now - tokenTime > 5 * 60 * 1000) return false;

    // Verify signature
    const hmac = crypto.createHmac('sha256', CSRF_SECRET);
    hmac.update(payload);
    const expectedSignature = hmac.digest('hex');

    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
  } catch {
    return false;
  }
}
