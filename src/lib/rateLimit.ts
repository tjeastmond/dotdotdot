import { vercelKVRateLimit } from './kvRateLimit';

export async function rateLimit(ip: string): Promise<{ success: boolean; remaining: number }> {
  return await vercelKVRateLimit.checkLimit(ip);
}
