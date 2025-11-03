import { createHmac } from 'crypto';


export interface SignatureHeaders extends Record<string, string> {
  'x-api-key-id': string;
  'x-api-ts': string;
  'x-api-sig': string;
}


export function buildSignature(
  method: string,
  path: string,
  body: string | object | undefined,
  timestamp?: number,
): SignatureHeaders {
  const ts = timestamp ?? Math.floor(Date.now() / 1000);
  const bodyString =
    typeof body === 'string'
      ? body
      : body
        ? JSON.stringify(body)
        : '';

  const payload = [method.toUpperCase(), path, bodyString, String(ts)].join('\n');
  const secret = process.env.API_SECRET;
  if (!secret) {
    throw new Error('API_SECRET env var required for tests');
  }

  const sig = createHmac('sha256', secret).update(payload).digest('hex');
  return {
    'x-api-key-id': process.env.API_KEY_ID || 'test-key',
    'x-api-ts': String(ts),
    'x-api-sig': sig,
  };
}
