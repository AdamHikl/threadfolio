import Anthropic from '@anthropic-ai/sdk';

import { ScanRequestSchema } from '@/scan/schema';
import { runScan, ScanError } from '@/server/scanService';

/** About 4 MB of image data per photo after base64 encoding. */
const MAX_BASE64_LENGTH = 5_500_000;

function error(message: string, status: number) {
  return Response.json({ error: message }, { status });
}

/**
 * POST /api/scan
 * Body: { photo: base64 JPEG, labelPhoto?: base64 JPEG }
 * Returns a ScanResult. Photos are used for this request only and never stored.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return error('Request body must be JSON.', 400);
  }

  const parsed = ScanRequestSchema.safeParse(body);
  if (!parsed.success) return error('Send a photo as base64 JPEG.', 400);
  const { photo, labelPhoto } = parsed.data;
  if (photo.length > MAX_BASE64_LENGTH || (labelPhoto?.length ?? 0) > MAX_BASE64_LENGTH) {
    return error('Photo is too large. Resize it before scanning.', 413);
  }

  try {
    return Response.json(await runScan(parsed.data));
  } catch (e) {
    if (e instanceof ScanError) return error(e.message, e.status);
    if (e instanceof Anthropic.RateLimitError) return error('Too many scans right now. Try again shortly.', 429);
    if (e instanceof Anthropic.AuthenticationError) {
      console.error('Scan provider rejected the API key.');
      return error('Scanning is not configured correctly.', 500);
    }
    if (e instanceof Anthropic.APIError) {
      console.error(`Scan provider error ${e.status}`);
      return error('The scan service is unavailable. Try again shortly.', 502);
    }
    console.error('Unexpected scan error', e);
    return error('Something went wrong while scanning.', 500);
  }
}
