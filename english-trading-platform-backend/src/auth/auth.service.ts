import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { CreateUserDto, LoginUserDto } from '../users/dto';
import { ConfigService } from '@nestjs/config';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { Redis } from 'ioredis';
import { randomUUID } from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private config: ConfigService,
    @InjectRedis() private readonly redis: Redis,
  ) {}

  private validateEmail(email: string): boolean {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  }

  async validateUser(email: string, pass: string): Promise<any> {
    if (!this.validateEmail(email)) throw new UnauthorizedException('Invalid email format.');
    const user = await this.usersService.findByEmail(email);
    if (!user) throw new UnauthorizedException('User not found');

    if (await bcrypt.compare(pass, user.password)) {
      const { password, ...result } = user;
      return result;
    }
    throw new UnauthorizedException('Invalid password');
  }

  // ===== Refresh token helpers =====
  private async signAccess(payload: any) {
    return this.jwtService.signAsync(payload, {
      secret: this.config.get('JWT_ACCESS_SECRET'),
      expiresIn: this.config.get('JWT_ACCESS_TTL') || '15m',
    });
  }
  private async signRefresh(payload: any) {
    return this.jwtService.signAsync(payload, {
      secret: this.config.get('JWT_REFRESH_SECRET'),
      expiresIn: this.config.get('JWT_REFRESH_TTL') || '30d',
    });
  }
  private rtKey(userId: number, jti: string) {
    return `auth:rt:${userId}:${jti}`;
  }

  // Login: set HttpOnly cookie 'rt' + trả access token
  async login(loginUserDto: LoginUserDto, res: import('express').Response) {
    const user = await this.validateUser(loginUserDto.email, loginUserDto.password);
    const jti = randomUUID();
    const payload = { sub: user.id, email: user.email, role: user.role, jti };

    const [access, refresh] = await Promise.all([this.signAccess(payload), this.signRefresh(payload)]);

    // Lưu HASH refresh token vào Redis
    const rtHash = await bcrypt.hash(refresh, 10);
    const ttlSec = this.parseTtlSeconds(this.config.get('JWT_REFRESH_TTL') || '30d');
    await this.redis.set(this.rtKey(user.id, jti), rtHash, 'EX', ttlSec);

    // Cookie HttpOnly
    res.cookie('rt', refresh, {
      httpOnly: true,
      secure: this.config.get('NODE_ENV') === 'production',
      sameSite: 'lax',
      maxAge: ttlSec * 1000,
      path: '/auth',
    });

    return { access_token: access, id: user.id, role: user.role };
  }

  async refresh(req: import('express').Request, res: import('express').Response) {
    const token = req.cookies?.rt;
    if (!token) throw new UnauthorizedException('Missing refresh token');

    const payload = await this.jwtService.verifyAsync(token, {
      secret: this.config.get('JWT_REFRESH_SECRET'),
    });

    const key = this.rtKey(payload.sub, payload.jti);
    const rtHash = await this.redis.get(key);
    if (!rtHash) throw new UnauthorizedException('Refresh token invalidated');

    const ok = await bcrypt.compare(token, rtHash);
    if (!ok) throw new UnauthorizedException('Refresh token mismatch');

    // Rotate
    await this.redis.del(key);
    const newJti = randomUUID();
    const newPayload = { sub: payload.sub, email: payload.email, role: payload.role, jti: newJti };

    const [access, refresh] = await Promise.all([this.signAccess(newPayload), this.signRefresh(newPayload)]);

    const newHash = await bcrypt.hash(refresh, 10);
    const ttlSec = this.parseTtlSeconds(this.config.get('JWT_REFRESH_TTL') || '30d');
    await this.redis.set(this.rtKey(payload.sub, newJti), newHash, 'EX', ttlSec);

    res.cookie('rt', refresh, {
      httpOnly: true,
      secure: this.config.get('NODE_ENV') === 'production',
      sameSite: 'lax',
      maxAge: ttlSec * 1000,
      path: '/auth',
    });

    return { access_token: access };
  }

  async logout(req: import('express').Request, res: import('express').Response) {
    const token = req.cookies?.rt;
    if (token) {
      try {
        const payload = await this.jwtService.verifyAsync(token, {
          secret: this.config.get('JWT_REFRESH_SECRET'),
        });
        await this.redis.del(this.rtKey(payload.sub, payload.jti));
      } catch {}
    }
    res.clearCookie('rt', { path: '/auth' });
    return { success: true };
  }

  async register(createUserDto: CreateUserDto) {
    if (!this.validateEmail(createUserDto.email)) {
      throw new BadRequestException('Invalid email format.');
    }
    const user = await this.usersService.findByEmail(createUserDto.email);
    if (user) throw new BadRequestException('Email already exists');
    return this.usersService.create(createUserDto);
  }

  // parse "30d"/"15m"/"12h" -> seconds
  private parseTtlSeconds(s: string): number {
    const m = /^(\d+)([smhd])$/.exec(s.trim());
    if (!m) return 60 * 60 * 24 * 30;
    const n = Number(m[1]);
    return { s: n, m: n * 60, h: n * 3600, d: n * 86400 }[m[2] as 's'|'m'|'h'|'d'];
  }
}