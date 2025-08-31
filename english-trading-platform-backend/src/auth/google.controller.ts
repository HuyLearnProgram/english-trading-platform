import { Controller, Get, Req, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';
import { AuthService } from './auth.service';

@Controller('auth/google')
export class GoogleAuthController {
  constructor(private readonly auth: AuthService) {}

  @Get()
  @UseGuards(AuthGuard('google'))
  async googleAuth() {}

  @Get('callback')
  @UseGuards(AuthGuard('google'))
  async googleCallback(@Req() req: any, @Res() res: Response) {
    // req.user có id/email/role từ GoogleStrategy.validate()
    const u = req.user as { id: number; email: string; role: string };

    // Cấp session giống login thường: set cookie 'rt' + ghi Redis + trả access
    const { access_token } = await (async () => {
      const { access } = await (this.auth as any).startSessionForUser(u, res);
      return { access_token: access };
    })();

    // Redirect về FE kèm access token; FE sẽ set localStorage.hasSession=1
    const FE = process.env.FRONTEND_URL!;
    return res.redirect(`${FE}/login/callback?token=${encodeURIComponent(access_token)}`);
  }
}
