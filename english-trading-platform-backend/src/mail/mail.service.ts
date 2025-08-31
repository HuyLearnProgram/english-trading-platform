// src/mail/mail.service.ts
import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter = nodemailer.createTransport({
    // cấu hình thật: SMTP
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: false,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });

  async send(opts: { to: string; subject: string; text?: string; html?: string }) {
    if (!opts.to) return;
    await this.transporter.sendMail({
      from: process.env.MAIL_FROM || '"Support" <no-reply@example.com>',
      ...opts,
    });
  }
}
