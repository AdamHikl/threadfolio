import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

import { ScanResponseSchema, type ScanResponse } from './schema';

export type PreparedPhoto = { uri: string; base64: string };

/** Shrink a photo before upload: smaller, faster and cheaper to analyse. */
export async function preparePhoto(uri: string): Promise<PreparedPhoto> {
  const context = ImageManipulator.manipulate(uri);
  context.resize({ width: 1280 });
  const rendered = await context.renderAsync();
  const saved = await rendered.saveAsync({ format: SaveFormat.JPEG, compress: 0.7, base64: true });
  if (!saved.base64) throw new Error('Could not read the photo.');
  return { uri: saved.uri, base64: saved.base64 };
}

/** Send photos to the scan service and validate what comes back. */
export async function requestScan(photo: PreparedPhoto, label?: PreparedPhoto): Promise<ScanResponse> {
  const response = await fetch('/api/scan', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ photo: photo.base64, labelPhoto: label?.base64 }),
  });
  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      body && typeof body === 'object' && 'error' in body && typeof body.error === 'string'
        ? body.error
        : 'The scan failed. Please try again.';
    throw new Error(message);
  }
  const parsed = ScanResponseSchema.safeParse(body);
  if (!parsed.success) throw new Error('The scan returned something unexpected.');
  return parsed.data;
}
