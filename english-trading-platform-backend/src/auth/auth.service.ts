import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { CreateUserDto, LoginUserDto } from '../users/dto';
import { ConfigService } from '@nestjs/config';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { Redis } from 'ioredis';
import { User } from 'src/users/user.entity';

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

  // ===== Tokens =====
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

  // ===== Redis key: 1 key / user =====
  private rtKey(userId: number) {
    return `auth:rt:${userId}`; // không dùng jti trong key nữa
  }

  // Dọn các key kiểu cũ nếu còn (auth:rt:<id>:*)
  private async cleanupLegacyKeys(userId: number) {
    const pattern = `auth:rt:${userId}:*`;
    let cursor = '0';
    do {
      const [next, keys] = await this.redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
      cursor = next;
      if (keys.length) await this.redis.del(...keys);
    } while (cursor !== '0');
  }

  // Cấp phiên + set cookie (dùng chung cho login thường, Google callback, refresh)
  // mở rộng kiểu tham số để mang cả avatarUrl (nếu có)
  public async startSessionForUser(
    user: Pick<User,'id'|'email'|'role'|'avatarUrl'>,
    res: import('express').Response
  ) {
    const payload = { sub: user.id, email: user.email, role: user.role };
    const [access, refresh] = await Promise.all([this.signAccess(payload), this.signRefresh(payload)]);

    const rtHash = await bcrypt.hash(refresh, 10);
    const ttlSec = this.parseTtlSeconds(this.config.get('JWT_REFRESH_TTL') || '30d');
    await this.cleanupLegacyKeys(user.id);
    await this.redis.set(this.rtKey(user.id), rtHash, 'EX', ttlSec);

    res.cookie('rt', refresh, { httpOnly:true, secure:this.config.get('NODE_ENV')==='production', sameSite:'lax', maxAge: ttlSec*1000, path:'/auth' });

    const profile = { id: user.id, email: user.email, role: user.role, avatarUrl: user.avatarUrl ?? null };
    return { access, profile };
  }

  // ==== Public APIs ====
  async login(dto: LoginUserDto, res: import('express').Response) {
    const user = await this.validateUser(dto.email, dto.password); // user có avatarUrl
    const { access, profile } = await this.startSessionForUser(user, res);
    return { access_token: access, ...profile };
  }

  async refresh(req: import('express').Request, res: import('express').Response) {
    const token = req.cookies?.rt;
    if (!token) throw new UnauthorizedException('Missing refresh token');

    const payload = await this.jwtService.verifyAsync(token, { secret: this.config.get('JWT_REFRESH_SECRET') });

    const key = this.rtKey(payload.sub);
    const rtHash = await this.redis.get(key);
    if (!rtHash) throw new UnauthorizedException('Refresh token invalidated');
    const ok = await bcrypt.compare(token, rtHash);
    if (!ok) throw new UnauthorizedException('Refresh token mismatch');

    // lấy hồ sơ mới nhất (avatarUrl có thể đã đổi)
    const u = await this.usersService.findById(payload.sub);
    const { access, profile } = await this.startSessionForUser(u, res);
    return { access_token: access, profile };
  }

  async logout(req: import('express').Request, res: import('express').Response) {
    const token = req.cookies?.rt;
    if (token) {
      try {
        const payload = await this.jwtService.verifyAsync(token, {
          secret: this.config.get('JWT_REFRESH_SECRET'),
        });
        await this.redis.del(this.rtKey(payload.sub));
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

  private parseTtlSeconds(s: string): number {
    const m = /^(\d+)([smhd])$/.exec(s.trim());
    if (!m) return 60 * 60 * 24 * 30;
    const n = Number(m[1]);
    return { s: n, m: n * 60, h: n * 3600, d: n * 86400 }[m[2] as 's'|'m'|'h'|'d'];
  }
}