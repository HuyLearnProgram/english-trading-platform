import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-google-oauth20';
import { UsersService } from 'src/users/users.service';
import { User } from 'src/users/user.entity';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private readonly users: UsersService) {
    super({
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: process.env.GOOGLE_CALLBACK_URL!,
      scope: ['openid', 'email', 'profile'],
    });
  }

  // passport sẽ gán return vào req.user
  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: (err: any, user?: any) => void,
  ) {
    const email: string | undefined = profile?.emails?.[0]?.value;
    const avatarUrl: string | undefined = profile?.photos?.[0]?.value;
    const displayName: string | undefined = profile?.displayName;

    if (!email) return done(new UnauthorizedException('Email not found in Google profile'));

    // Tìm hoặc tạo user
    let user: User | null = await this.users.findByEmail(email);
    if (!user) {
      user = await this.users.create({
        email,
        // đặt mật khẩu ngẫu nhiên (vì user đăng nhập bằng Google)
        password: Math.random().toString(36).slice(2),
        role: 'student',         // default role cho người mới
        avatarUrl,
        status: 'visible',
      } as any);
    } else if (!user.avatarUrl && avatarUrl) {
        await this.users.update(user.id, { avatarUrl });
    }

    // Nếu tài khoản bị khóa thì không cho vào
    if (user.status === 'hidden') {
      return done(new UnauthorizedException('Account is locked'));
    }

    done(null, {
      id: user.id,
      email: user.email,
      role: user.role,
      name: displayName,
    });
  }
}
