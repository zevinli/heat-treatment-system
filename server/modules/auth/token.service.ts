import { Injectable, UnauthorizedException } from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'crypto';

export interface AuthTokenPayload {
  sub: string;
  username: string;
  name: string;
  role: string;
  jti: string;
  iat: number;
  exp: number;
}

@Injectable()
export class TokenService {
  private secret(): string {
    const value = process.env.JWT_SECRET;
    if (!value && process.env.NODE_ENV === 'production') {
      throw new Error('JWT_SECRET must be configured in production');
    }
    return value || 'local-development-secret-change-me';
  }

  sign(payload: Omit<AuthTokenPayload, 'iat' | 'exp'>, ttlSeconds = 8 * 60 * 60): string {
    const now = Math.floor(Date.now() / 1000);
    const body = Buffer.from(JSON.stringify({ ...payload, iat: now, exp: now + ttlSeconds })).toString('base64url');
    const signature = createHmac('sha256', this.secret()).update(body).digest('base64url');
    return `${body}.${signature}`;
  }

  verify(token: string): AuthTokenPayload {
    const [body, signature] = token.split('.');
    if (!body || !signature) throw new UnauthorizedException('无效的登录凭证');
    const expected = createHmac('sha256', this.secret()).update(body).digest();
    const received = Buffer.from(signature, 'base64url');
    if (received.length !== expected.length || !timingSafeEqual(received, expected)) {
      throw new UnauthorizedException('登录凭证签名无效');
    }
    let payload: AuthTokenPayload;
    try {
      payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    } catch {
      throw new UnauthorizedException('登录凭证格式无效');
    }
    if (!payload.sub || !payload.jti || payload.exp <= Math.floor(Date.now() / 1000)) {
      throw new UnauthorizedException('登录已过期，请重新登录');
    }
    return payload;
  }
}
