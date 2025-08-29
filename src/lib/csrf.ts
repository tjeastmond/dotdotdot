const CSRF_SECRET = process.env.CSRF_SECRET || 'dev-secret-change-in-production';

// Convert string to ArrayBuffer for Web Crypto API
function stringToArrayBuffer(str: string): ArrayBuffer {
  const encoder = new TextEncoder();
  return encoder.encode(str);
}

// Convert ArrayBuffer to hex string
function arrayBufferToHex(buffer: ArrayBuffer): string {
  const uint8Array = new Uint8Array(buffer);
  return Array.from(uint8Array)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// Generate HMAC using Web Crypto API
async function generateHMAC(message: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    stringToArrayBuffer(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign('HMAC', key, stringToArrayBuffer(message));
  return arrayBufferToHex(signature);
}

// Generate random bytes using Web Crypto API
function generateRandomBytes(length: number): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return arrayBufferToHex(array.buffer);
}

export async function generateCSRFToken(): Promise<string> {
  // Use a more deterministic approach for development to reduce hydration issues
  if (process.env.NODE_ENV === 'development') {
    // In development, use a more stable token generation
    const sessionId = process.env.SESSION_ID || 'dev-session';
    const payload = `dev:${sessionId}:${Date.now()}`;

    const signature = await generateHMAC(payload, CSRF_SECRET);
    return `${payload}:${signature}`;
  }

  // Production: use full security with timestamp and random bytes
  const timestamp = Date.now().toString();
  const random = generateRandomBytes(16);
  const payload = `${timestamp}:${random}`;

  const signature = await generateHMAC(payload, CSRF_SECRET);
  return `${payload}:${signature}`;
}

export async function validateCSRFToken(token: string): Promise<boolean> {
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
      const expectedSignature = await generateHMAC(payload, CSRF_SECRET);
      return signature === expectedSignature;
    }

    // Production token validation
    const [timestamp, random, signature] = parts;
    const payload = `${timestamp}:${random}`;

    // Check if token is too old (5 minutes)
    const tokenTime = parseInt(timestamp);
    const now = Date.now();
    if (now - tokenTime > 5 * 60 * 1000) return false;

    // Verify signature
    const expectedSignature = await generateHMAC(payload, CSRF_SECRET);
    return signature === expectedSignature;
  } catch {
    return false;
  }
}
