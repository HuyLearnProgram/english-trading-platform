import { Controller, Get, Req, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';
import * as jwt from 'jsonwebtoken';

@Controller('auth/google')
export class GoogleAuthController {
  @Get()
  @UseGuards(AuthGuard('google'))
  // Passport sẽ tự redirect tới trang chọn tài khoản Google
  async googleAuth() {}

  @Get('callback')
  @UseGuards(AuthGuard('google'))
  async googleCallback(@Req() req: any, @Res() res: Response) {
    // req.user đến từ GoogleStrategy.validate()
    const u = req.user;
    const token = jwt.sign(
      {
        sub: u.id,
        email: u.email,
        role: u.role,
      },
      process.env.JWT_ACCESS_SECRET!,
      { expiresIn: '7d' }
    );

    // Redirect về FE kèm token
    const FE = process.env.FRONTEND_URL!;
    return res.redirect(`${FE}/login/callback?token=${encodeURIComponent(token)}`);
  }
}
