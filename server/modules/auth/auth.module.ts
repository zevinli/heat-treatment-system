import { Global, Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { HealthController } from './health.controller';
import { AuthService } from './auth.service';
import { TokenService } from './token.service';

@Global()
@Module({
  controllers: [AuthController, HealthController],
  providers: [AuthService, TokenService],
  exports: [AuthService, TokenService],
})
export class AuthModule {}
