import { generateCSRFToken } from '@/lib/csrf';

export async function GET() {
  const token = generateCSRFToken();

  return Response.json({ token });
}
