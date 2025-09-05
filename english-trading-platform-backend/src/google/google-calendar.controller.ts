// src/google/google-calendar.controller.ts
import { Controller, Get, Post, Query, Res, UseGuards, Req, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Response, Request } from 'express';
import { GoogleCalendarService } from './google-calendar.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

// Nếu bạn đã có JwtAuthGuard thì dùng guard của bạn.
// Ở đây giả định request.user đã có {sub: userId} sau khi qua guard.
import { AuthGuard } from '@nestjs/passport';

@Controller('integrations/google/calendar')
export class GoogleCalendarController {
  constructor(
    private readonly svc: GoogleCalendarService,
    private readonly jwt: JwtService,
    private readonly cfg: ConfigService,
  ) {}
  private readonly logger = new Logger(GoogleCalendarController.name);


  /** FE gọi để lấy URL popup */
  @Get('auth-url')
  @UseGuards(AuthGuard('jwt'))   // dùng guard JWT của bạn
  async getAuthUrl(@Req() req: any) {
    const userId = Number(req.user.userId);
    const url = await this.svc.generateAuthUrlFor(userId);
    return { url };
  }

  /** Google redirect về đây */
  @Get('callback')
  async callback(@Query('code') code: string, @Query('state') state: string, @Res() res: Response) {
    await this.svc.handleOAuthCallback(code, state);
    // Trang nhỏ thông báo và đóng popup
    const html = `
      <html><body style="font-family:system-ui">
        <p>Đã kết nối Google Calendar. Bạn có thể đóng cửa sổ này.</p>
        <script>
          if (window.opener) {
            window.opener.postMessage({ source:'google-calendar', success:true }, '*');
            setTimeout(()=>window.close(), 500);
          }
        </script>
      </body></html>`;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.send(html);
  }

  /** Kiểm tra trạng thái kết nối */
  @Get('status')
  @UseGuards(AuthGuard('jwt'))
  async status(@Req() req: any) {
    const userId = Number(req.user.userId);
    return this.svc.getStatus(userId);
  }

  /** Đẩy dữ liệu lịch lên Google Calendar */
  @Post('sync')
  @UseGuards(AuthGuard('jwt'))
  async sync(@Req() req: any) {
    const userId = Number(req.user.userId);
    try {
      return await this.svc.syncAllUpcoming(userId);
    } catch (e: any) {
      // Lấy message “thật” từ gaxios
      const gmsg =
        e?.response?.data?.error?.message || // Google API
        e?.message ||
        'Sync failed';
      this.logger.error(`Sync failed for user ${userId}: ${gmsg}`, e?.stack || gmsg);
      // Trả message rõ ràng về FE
      throw new HttpException({ message: gmsg }, e?.status || HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
