import { UnauthorizedException } from '@nestjs/common';
import { TokenService } from '../../server/modules/auth/token.service';

describe('TokenService', () => {
  const service = new TokenService();
  const payload = { sub: 'user-1', username: 'tester', name: '测试员', role: 'operator', jti: 'session-1' };

  beforeEach(() => {
    process.env.JWT_SECRET = 'unit-test-secret-with-sufficient-entropy';
  });

  it('signs and verifies an authenticated session', () => {
    const token = service.sign(payload, 60);
    expect(service.verify(token)).toMatchObject(payload);
  });

  it('rejects a modified signature', () => {
    const token = service.sign(payload, 60);
    const lastCharacter = token.at(-1);
    const replacement = lastCharacter === 'x' ? 'y' : 'x';
    expect(() => service.verify(`${token.slice(0, -1)}${replacement}`)).toThrow(UnauthorizedException);
  });

  it('rejects an expired token', () => {
    const token = service.sign(payload, -1);
    expect(() => service.verify(token)).toThrow('登录已过期');
  });

  it('rejects tokens with extra segments', () => {
    const token = service.sign(payload, 60);
    expect(() => service.verify(`${token}.extra`)).toThrow(UnauthorizedException);
  });
});
