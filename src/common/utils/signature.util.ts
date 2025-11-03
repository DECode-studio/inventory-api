import { createHmac } from 'crypto';

export function makeSignature(method: string, path: string, body: string, ts: string, secret: string) {
    const payload = [method.toUpperCase(), path, body || '', ts].join('\n');
    return createHmac('sha256', secret).update(payload).digest('hex');
}