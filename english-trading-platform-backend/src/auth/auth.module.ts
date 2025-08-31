import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UsersModule } from '../users/users.module';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';
import { GoogleStrategy } from './google.strategy';
import { GoogleAuthController } from './google.controller';

@Module({
  imports: [
    ConfigModule,
    UsersModule,
     PassportModule.register({ session: false }),
    JwtModule.registerAsync({
      useFactory: (cs: ConfigService) => ({
        secret: cs.get('JWT_ACCESS_SECRET'),
        signOptions: { expiresIn: cs.get('JWT_ACCESS_TTL') || '15m' },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [AuthService, JwtStrategy, GoogleStrategy],
  controllers: [AuthController, GoogleAuthController],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}