import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { makeSignature } from '../utils/signature.util';


@Injectable()
export class HmacSignatureGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
        const req = context.switchToHttp().getRequest();


        // Allow Swagger assets without signature to keep docs accessible.
        const requestPath: string = (req.originalUrl || req.url || '').split('?')[0];
        if (requestPath.startsWith('/docs')) {
            return true;
        }


        const keyId = req.headers['x-api-key-id'];
        const ts = req.headers['x-api-ts'];
        const sig = req.headers['x-api-sig'];
        if (!keyId || !ts || !sig) {
            throw new UnauthorizedException('Missing signature headers');
        }


        const now = Math.floor(Date.now() / 1000);
        const ttl = Number(process.env.API_SIG_TTL || 300);
        const reqTs = Number(ts);
        if (!Number.isFinite(reqTs) || Math.abs(now - reqTs) > ttl) {
            throw new UnauthorizedException('Stale request timestamp');
        }


        if (keyId !== process.env.API_KEY_ID) {
            throw new UnauthorizedException('Invalid key id');
        }


        const secret = process.env.API_SECRET;
        if (!secret) {
            throw new UnauthorizedException('Server missing API secret');
        }


        const method = (req.method || 'GET').toUpperCase();
        const bodyPayload = this.extractBodyPayload(req);


        const expect = makeSignature(method, requestPath, bodyPayload, String(ts), secret);
        if (expect !== sig) {
            throw new UnauthorizedException('Invalid signature');
        }


        return true;
    }


    private extractBodyPayload(req: any): string {
        if (req.rawBody) {
            return req.rawBody.toString();
        }
        const body = req.body;
        if (!body || (typeof body === 'object' && !Object.keys(body).length)) {
            return '';
        }
        if (typeof body === 'string') {
            return body;
        }
        return JSON.stringify(body);
    }
}
