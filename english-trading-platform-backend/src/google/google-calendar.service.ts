// src/google/google-calendar.service.ts
import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { google, calendar_v3 } from 'googleapis';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GoogleAccount } from './google-account.entity';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { StudentScheduleService } from 'src/student/student-schedule.service';

const SCOPES = [
  'openid', 'email', 'profile',
  'https://www.googleapis.com/auth/calendar.events',
];

@Injectable()
export class GoogleCalendarService {
  constructor(
    @InjectRepository(GoogleAccount) private readonly repo: Repository<GoogleAccount>,
    private readonly jwt: JwtService,
    private readonly cfg: ConfigService,
    private readonly studentSchedule: StudentScheduleService,
  ) {}

  private readonly logger = new Logger(GoogleCalendarService.name);


  // Tạo id ổn định, đúng chuẩn Google Calendar
private buildEventId(enrollmentId: number, lessonNo: number, date: string, start: string) {
  // a–v và số, cho phép dấu '-' ; KHÔNG dùng '_'
  const ds = date.replace(/-/g, '');     // 20250908
  const ts = start.replace(':', '');     // 0930
  const raw = `les-${enrollmentId}-${lessonNo}-${ds}-${ts}`;
  // hạ thường + lọc theo [a-v0-9-]
  return raw.toLowerCase().replace(/[^a-v0-9-]/g, '').slice(0, 1024);
}

  private oauthClient() {
    return new google.auth.OAuth2(
      this.cfg.get<string>('GOOGLE_CLIENT_ID'),
      this.cfg.get<string>('GOOGLE_CLIENT_SECRET'),
      this.cfg.get<string>('GOOGLE_CALENDAR_REDIRECT_URL'),
    );
  }

  /** URL để người dùng mở popup xin quyền */
  async generateAuthUrlFor(userId: number) {
    const oauth2 = this.oauthClient();
    const state = await this.jwt.signAsync(
      { sub: userId, typ: 'gcal' },
      { secret: this.cfg.get('JWT_ACCESS_SECRET'), expiresIn: '30m' },
    );
    const url = oauth2.generateAuthUrl({
      access_type: 'offline',                 // để lấy refresh_token
      prompt: 'select_account consent',                      // luôn hỏi lại để chắc có refresh_token
      include_granted_scopes: true,
      scope: SCOPES,
      state,
    });
    return url;
  }

  /** Callback từ Google: lưu refresh_token cho user */
  async handleOAuthCallback(code: string, state: string) {
    const payload = await this.jwt.verifyAsync(state, { secret: this.cfg.get('JWT_ACCESS_SECRET') });
    const userId = Number(payload.sub);
    if (!userId) throw new BadRequestException('Invalid state');

    const oauth2 = this.oauthClient();
    const { tokens } = await oauth2.getToken(code);
    if (!tokens.refresh_token) {
      throw new BadRequestException('Google did not provide a refresh token. Try again with consent.');
    }
    oauth2.setCredentials(tokens);

    // Lấy info account
    const oauth2Api = google.oauth2({ version: 'v2', auth: oauth2 });
    const me = await oauth2Api.userinfo.get();

    // upsert
    let acc = await this.repo.findOne({ where: { userId } });
    if (!acc) acc = this.repo.create({ userId, refreshToken: tokens.refresh_token });
    acc.refreshToken = tokens.refresh_token;
    acc.email = me.data.email || acc.email;
    acc.googleId = me.data.id || acc.googleId;
    await this.repo.save(acc);

    return { ok: true, email: acc.email };
  }

  /** Kiểm tra đã kết nối chưa */
  async getStatus(userId: number) {
    const acc = await this.repo.findOne({ where: { userId } });
    return { connected: !!acc, email: acc?.email || null };
  }

  private async calendarClient(userId: number): Promise<calendar_v3.Calendar> {
    const acc = await this.repo.findOne({ where: { userId } });
    if (!acc) throw new NotFoundException('Google Calendar not connected.');
    const oauth2 = this.oauthClient();
    oauth2.setCredentials({ refresh_token: acc.refreshToken });
    return google.calendar({ version: 'v3', auth: oauth2 });
  }


  /** Đồng bộ tất cả buổi học tương lai lên Google Calendar */
  async syncAllUpcoming(userId: number) {
    const calApi = await this.calendarClient(userId);
    const studentCal = await this.studentSchedule.getCalendarByUserId(userId);

    const today = new Date();
    const created: string[] = [];
    const updated: string[] = [];

    for (const entry of (studentCal.entries || [])) {
      const tz = entry.timezone || studentCal.timezone || 'Asia/Ho_Chi_Minh';
      const len = entry.lessonLength || 45;
      
      for (const ev of (entry.events || [])) {
        // bỏ qua quá khứ
        const isPast = new Date(`${ev.date}T00:00:00Z`).getTime() < new Date(today.toDateString()).getTime();
        if (isPast) continue;

        const id = this.buildEventId(entry.enrollmentId, ev.lessonNo, ev.date, ev.start);
        const startISO = `${ev.date}T${ev.start}:00`;
        const endISO   = `${ev.date}T${ev.end || ev.start}:00`;

        try {
        // Tìm event đã đồng bộ trước đó bằng extendedProperties
        const list = await calApi.events.list({
          calendarId: 'primary',
          privateExtendedProperty: [
            `enrollmentId=${entry.enrollmentId}`,
            `lessonNo=${ev.lessonNo}`,
          ],
          singleEvents: true,
          maxResults: 1,
          // thu hẹp phạm vi thời gian để nhanh hơn (không bắt buộc)
          timeMin: new Date(new Date(startISO).getTime() - 24 * 3600_000).toISOString(),
          timeMax: new Date(new Date(endISO).getTime() + 24 * 3600_000).toISOString(),
        });

        const existing = list.data.items?.[0];

        const requestBody: calendar_v3.Schema$Event = {
          summary: `Bài học #${ev.lessonNo} với ${entry.teacherName || 'gia sư'}`,
          description:
            `Bài học #${ev.lessonNo}\nGia sư: ${entry.teacherName || ('#' + entry.teacherId)}\nEnrollment ID: ${entry.enrollmentId}`,
          start: { dateTime: startISO, timeZone: tz },
          end:   { dateTime: endISO,   timeZone: tz },
          extendedProperties: {
            private: {
              enrollmentId: String(entry.enrollmentId),
              lessonNo: String(ev.lessonNo),
            },
          },
          reminders: { useDefault: true },
        };

        if (existing?.id) {
          await calApi.events.update({
            calendarId: 'primary',
            eventId: existing.id,
            requestBody,
          });
          updated.push(existing.id);
        } else {
          const inserted = await calApi.events.insert({
            calendarId: 'primary',
            requestBody,
          });
          created.push(inserted.data.id!);
          this.logger.debug(`Inserted event ${inserted.data.id} – enrollment ${entry.enrollmentId} lesson ${ev.lessonNo}`);
        }
      }catch (err: any) {
          const gmsg = err?.response?.data?.error?.message || err?.message || String(err);
          this.logger.warn(`Failed event enrollment=${entry.enrollmentId} lesson=${ev.lessonNo} start=${startISO} tz=${tz}: ${gmsg}`);
          // tiếp tục các event khác thay vì fail cả batch
        }
      }
    }

    return { created: created.length, updated: updated.length };
  }
}
