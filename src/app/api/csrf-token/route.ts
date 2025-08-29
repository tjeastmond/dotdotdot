import { generateCSRFToken } from '@/lib/csrf';

export const runtime = 'edge';

export async function GET() {
  const token = await generateCSRFToken();

  return Response.json({ token });
}
