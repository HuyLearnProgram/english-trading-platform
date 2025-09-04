import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Enrollment } from 'src/enrollment/enrollment.entity';
import { Teacher } from 'src/teacher/teacher.entity';
import { User } from 'src/users/user.entity';
import { Student } from 'src/student/student.entity';
import { MailService } from 'src/mail/mail.service';
import { ConfigService } from '@nestjs/config';

let Puppeteer: typeof import('puppeteer') | null = null;
try { Puppeteer = require('puppeteer'); } catch { Puppeteer = null; }

@Injectable()
export class InvoiceService {
  private readonly logger = new Logger(InvoiceService.name);

  constructor(
    private readonly cfg: ConfigService,
    private readonly mail: MailService,
    @InjectRepository(Enrollment) private readonly enrollRepo: Repository<Enrollment>,
    @InjectRepository(Teacher) private readonly teacherRepo: Repository<Teacher>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(Student) private readonly studentRepo: Repository<Student>,
  ) {}

  private vnd(n: number) {
    return (Math.round(Number(n)) || 0).toLocaleString('vi-VN') + '₫';
  }

  private round2(n: number) {
    return Math.round((Number(n) + Number.EPSILON) * 100) / 100;
  }

  /** Xác định currency hiển thị của hóa đơn (USD cho PayPal nếu có; ngược lại VND) */
  private payCurrency(en: Enrollment) {
    const meta = (en.paymentMeta || {}) as any;
    const cur = (String(meta?.captureAmount?.currency_code || '')).toUpperCase();
    if ((en.paymentMethod || '').toLowerCase() === 'paypal' && cur) return cur; // ví dụ USD
    return (en.currency || 'VND').toUpperCase();
  }

  /** Format tiền theo currency */
  private fmtMoney(n: number, code: string) {
    if (code === 'VND') {
      return (Math.round(Number(n)) || 0).toLocaleString('vi-VN') + '₫';
    }
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: code,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(Number(n) || 0);
    } catch {
      // fallback
      return `${Number(n).toFixed(2)} ${code}`;
    }
  }

  /**
   * Tính bộ số tiền để hiển thị trên hóa đơn theo currency thanh toán.
   * - VND: dùng số từ DB (gross/discount/total).
   * - PayPal USD: dùng total chính xác từ PayPal; gross/discount quy đổi theo tỷ lệ total.
   */
  private priceBlock(en: Enrollment) {
    const cur = this.payCurrency(en);
    const meta = (en.paymentMeta || {}) as any;

    if (cur !== 'VND') {
      const paid = Number(meta?.captureAmount?.value || 0);       // total chính xác theo cur
      const vndTotal = Number(en.total || 0);
      const r = vndTotal > 0 ? paid / vndTotal : 0;               // tỷ lệ quy đổi tương đối

      const gross = this.round2(Number(en.gross || 0) * r);
      const discount = this.round2(Number(en.discount || 0) * r);
      const total = this.round2(paid);

      return {
        currency: cur,
        gross, discount, total,
        grossFmt: this.fmtMoney(gross, cur),
        discountFmt: '-' + this.fmtMoney(discount, cur),
        totalFmt: this.fmtMoney(total, cur),
        note: (en.paymentMethod || '').toLowerCase() === 'paypal'
          ? '(*Giá gốc và Giảm giá quy đổi ước tính theo tỷ lệ Tổng thanh toán PayPal*)'
          : '',
      };
    }

    // Mặc định VND
    const gross = Number(en.gross || 0);
    const discount = Number(en.discount || 0);
    const total = Number(en.total || 0);
    return {
      currency: 'VND',
      gross, discount, total,
      grossFmt: this.vnd(gross),
      discountFmt: '-' + this.vnd(discount),
      totalFmt: this.vnd(total),
      note: '',
    };
  }

  private dtStr(d = new Date()) {
    return new Intl.DateTimeFormat('vi-VN', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hour12: false,
      timeZone: 'Asia/Ho_Chi_Minh'
    }).format(d);
  }

  private company() {
    const name =
      this.cfg.get('COMPANY_NAME') ||
      (this.cfg.get('MAIL_FROM') || '').replace(/.*<|>.*/g, '') ||
      'Antoree';
    return {
      name,
      tax: this.cfg.get('COMPANY_TAX_CODE') || '',
      addr: this.cfg.get('COMPANY_ADDRESS') || '',
      phone: this.cfg.get('COMPANY_PHONE') || '',
      email: this.cfg.get('COMPANY_EMAIL') || this.cfg.get('SMTP_USER') || '',
    };
  }

  private formatSlots(slots?: string[]) {
    if (!Array.isArray(slots) || !slots.length) return '—';
    return slots.join(', ');
  }

  private emailInvoiceHtml(params: {
    en: Enrollment,
    teacher: Teacher | null,
    studentUser: User | null,
    studentProfile: Student | null,
    invoiceNo: string,
    paidAt: Date,
  }) {
    const { en, teacher, studentUser, studentProfile, invoiceNo, paidAt } = params;
    const comp = this.company();
    const brand = (this.cfg.get('BRAND_COLOR') || '#2563eb').trim();
    const logo = (this.cfg.get('COMPANY_LOGO_URL') || '').trim();
    const pm = (en.paymentMethod || '').toUpperCase();
    const pb = this.priceBlock(en);

    const studentName =
      studentProfile?.fullName ||
      (studentUser as any)?.fullName ||
      studentUser?.email ||
      `ID ${en.studentId}`;

    const slots = en.preferredSlots?.length
      ? en.preferredSlots
      : (studentProfile?.preferredSlots || []);

    // Lưu ý: dùng bảng 600px, style inline, không grid/flex phức tạp
    return `
<!doctype html>
<html lang="vi">
  <head>
    <meta charset="utf-8"/>
    <meta http-equiv="x-ua-compatible" content="ie=edge"/>
    <meta name="viewport" content="width=device-width, initial-scale=1"/>
    <meta name="x-apple-disable-message-reformatting"/>
    <title>Hóa đơn #${invoiceNo}</title>
  </head>
  <body style="margin:0;padding:0;background:#f3f4f6;color:#111827;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:24px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:600px;background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
            <!-- Header -->
            <tr>
              <td style="padding:20px 24px;background:#f8fafc;border-bottom:1px solid #e5e7eb;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="vertical-align:top;">
                      ${logo
                        ? `<img src="${logo}" alt="${comp.name}" style="height:32px;display:block;border:0;outline:none;text-decoration:none;">`
                        : `<div style="font-size:18px;font-weight:800;color:#0f172a;">${comp.name}</div>`
                      }
                    </td>
                    <td align="right" style="vertical-align:top;text-align:right;">
                      <div style="font-size:13px;color:#334155;line-height:1.5;">
                        <div><strong style="color:#0f172a;">HÓA ĐƠN</strong> #${invoiceNo}</div>
                        <div>Ngày: ${this.dtStr(paidAt)}</div>
                        <div>Phương thức: <span style="display:inline-block;background:${brand}15;color:${brand};border:1px solid ${brand}33;padding:2px 8px;border-radius:999px;font-weight:700;">${pm}</span></div>
                        ${en.paymentRef ? `<div>Mã giao dịch: ${en.paymentRef}</div>` : ''}
                      </div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Parties -->
            <tr>
              <td style="padding:16px 24px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td width="50%" style="vertical-align:top;padding-right:8px;border:1px solid #e5e7eb;border-radius:10px;padding:12px;">
                      <div style="font-size:14px;font-weight:700;margin-bottom:6px;color:#0f172a;">Bên bán (Doanh nghiệp)</div>
                      <div style="font-size:13px;color:#475569;line-height:1.5;">
                        ${comp.name}<br/>
                        ${comp.addr || ''}<br/>
                        Mã số thuế: ${comp.tax || '—'}<br/>
                        ${comp.phone ? `Điện thoại: ${comp.phone}<br/>` : ''}
                        ${comp.email ? `Email: ${comp.email}` : ''}
                      </div>
                    </td>
                    <td width="50%" style="vertical-align:top;padding-left:8px;border:1px solid #e5e7eb;border-radius:10px;padding:12px;">
                      <div style="font-size:14px;font-weight:700;margin-bottom:6px;color:#0f172a;">Bên mua (Học viên)</div>
                      <div style="font-size:13px;color:#475569;line-height:1.5;">
                        ${studentName}<br/>
                        Email: ${studentUser?.email || '—'}<br/>
                        Mã đơn: #${en.id}
                      </div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Course info -->
            <tr>
              <td style="padding:0 24px 8px;">
                <div style="font-size:14px;font-weight:700;color:#0f172a;margin-bottom:6px;">Thông tin khóa học</div>
                <div style="font-size:13px;color:#475569;line-height:1.6;">
                  Giáo viên đăng ký: <strong>${teacher?.fullName || ('GV #' + en.teacherId)}</strong><br/>
                  Khóa học: <strong>${en.planHours} giờ</strong> · <strong>${en.lessonsPerWeek}</strong> buổi/tuần · ${en.lessonLengthMinutesSnapshot} phút/buổi<br/>
                  Lịch học dự kiến: ${this.formatSlots(slots)}
                </div>
              </td>
            </tr>

            <!-- Items -->
            <tr>
              <td style="padding:8px 24px 4px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                  <thead>
                    <tr>
                      <th align="left" style="background:#f9fafb;border:1px solid #e5e7eb;border-bottom:none;padding:10px;font-size:13px;color:#0f172a;">Nội dung</th>
                      <th align="right" style="background:#f9fafb;border:1px solid #e5e7eb;border-bottom:none;padding:10px;font-size:13px;color:#0f172a;">Thành tiền</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style="border:1px solid #e5e7eb;border-top:none;padding:10px;font-size:13px;color:#111827;">
                        Gói học ${en.planHours} giờ (${en.lessons} lessons × ${en.lessonLengthMinutesSnapshot} phút)
                      </td>
                      <td align="right" style="border:1px solid #e5e7eb;border-top:none;padding:10px;font-size:13px;color:#111827;">
                        ${pb.grossFmt}
                      </td>
                    </tr>
                    <tr>
                      <td style="border:1px solid #e5e7eb;border-top:none;padding:10px;font-size:13px;color:#111827;">
                        Giảm giá (${Math.round(Number(en.discountPctApplied || 0) * 100)}%)
                      </td>
                      <td align="right" style="border:1px solid #e5e7eb;border-top:none;padding:10px;font-size:13px;color:#111827;">
                        -${pb.discountFmt}
                      </td>
                    </tr>
                  </tbody>
                  <tfoot>
                    <tr>
                      <td align="left" style="padding:12px 10px;font-size:14px;color:#0f172a;border-left:1px solid #e5e7eb;border-bottom:1px solid #e5e7eb;border-right:none;font-weight:700;">
                        Tổng thanh toán
                      </td>
                      <td align="right" style="padding:12px 10px;font-size:16px;color:${brand};border-right:1px solid #e5e7eb;border-bottom:1px solid #e5e7eb;border-left:none;font-weight:800;">
                        ${pb.totalFmt}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </td>
            </tr>

            <!-- Payment info -->
            <tr>
              <td style="padding:4px 24px 16px;">
                <div style="font-size:13px;color:#475569;">
                  Hình thức thanh toán: <strong>${pm}</strong>${en.paymentMeta?.bankCode ? ' ('+en.paymentMeta.bankCode+')' : ''}. 
                  Tiền tệ: ${pb.currency}.
                </div>
                ${pb.note ? `<div class="muted" style="margin-top:4px;font-style:italic">${pb.note}</div>` : ''}
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="padding:12px 24px;background:#fafafa;border-top:1px solid #e5e7eb;">
                <div style="font-size:12px;color:#64748b;line-height:1.6;">
                  Đây là hóa đơn điện tử phát hành bởi ${comp.name}. Vui lòng lưu trữ email này để tham chiếu khi cần hỗ trợ.
                </div>
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`.trim();
  }

  private invoiceHtml(params: {
    en: Enrollment,
    teacher: Teacher | null,
    studentUser: User | null,
    studentProfile: Student | null,
    invoiceNo: string,
    paidAt: Date,
  }) {
    const { en, teacher, studentUser, studentProfile, invoiceNo, paidAt } = params;
    const comp = this.company();
    const pm = (en.paymentMethod || '').toUpperCase();
    const pb = this.priceBlock(en);

    const studentName =
      studentProfile?.fullName ||
      (studentUser as any)?.fullName ||  // phòng trường hợp User có fullName
      studentUser?.email ||
      `ID ${en.studentId}`;

    // ưu tiên lịch từ order; nếu chưa có thì dùng preferredSlots của Student profile
    const slots = en.preferredSlots?.length
      ? en.preferredSlots
      : (studentProfile?.preferredSlots || []);

    return `
<!doctype html>
<html lang="vi">
<meta charset="utf-8"/>
<title>Hóa đơn #${invoiceNo}</title>
<style>
  body{font-family:Arial,Helvetica,sans-serif;color:#111827;margin:0;background:#f8fafc;}
  .wrap{max-width:720px;margin:24px auto;background:#fff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden}
  .hd{display:flex;justify-content:space-between;align-items:flex-start;padding:16px 20px;background:#f1f5f9;border-bottom:1px solid #e5e7eb}
  .brand{font-weight:800;font-size:18px}
  .inv{font-size:13px;color:#475569;text-align:right}
  .sec{padding:16px 20px}
  .grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
  .card{border:1px solid #e5e7eb;border-radius:10px;padding:12px}
  .card h4{margin:0 0 6px;font-size:14px}
  .muted{color:#6b7280;font-size:13px;line-height:1.4}
  table{width:100%;border-collapse:collapse;margin-top:8px}
  th,td{padding:10px;border-bottom:1px dashed #e5e7eb;font-size:14px}
  th{text-align:left;background:#f9fafb}
  tfoot td{border-top:1px solid #e5e7eb;border-bottom:0;font-weight:700}
  .total td{font-size:15px}
  .tag{display:inline-block;background:#eef2ff;color:#1e40af;border-radius:6px;padding:2px 8px;font-weight:700;font-size:12px}
  .foot{padding:12px 20px;color:#64748b;font-size:12px;border-top:1px solid #e5e7eb;background:#fafafa}
</style>
<div class="wrap">
  <div class="hd">
    <div class="brand">${comp.name}</div>
    <div class="inv">
      <div><b>HÓA ĐƠN</b> #${invoiceNo}</div>
      <div>Ngày: ${this.dtStr(paidAt)}</div>
      <div>Phương thức: <span class="tag">${pm}</span></div>
      ${en.paymentRef ? `<div>Mã giao dịch: ${en.paymentRef}</div>` : ''}
    </div>
  </div>

  <div class="sec grid">
    <div class="card">
      <h4>Bên bán (Doanh nghiệp)</h4>
      <div class="muted">
        ${comp.name}<br/>
        ${comp.addr || ''}<br/>
        Mã số thuế: ${comp.tax || '—'}<br/>
        ${comp.phone ? 'Điện thoại: '+comp.phone+'<br/>' : ''}
        ${comp.email ? 'Email: '+comp.email : ''}
      </div>
    </div>
    <div class="card">
      <h4>Bên mua (Học viên)</h4>
      <div class="muted">
        ${studentName}<br/>
        Email: ${studentUser?.email || '—'}<br/>
        Mã đơn: #${en.id}
      </div>
    </div>
  </div>

  <div class="sec">
    <h4 style="margin:0 0 8px">Thông tin khóa học</h4>
    <div class="muted">
      Giáo viên đăng ký: <b>${teacher?.fullName || ('GV #' + en.teacherId)}</b><br/>
      Khóa học: <b>${en.planHours} giờ</b> · <b>${en.lessonsPerWeek}</b> buổi/tuần · ${en.lessonLengthMinutesSnapshot} phút/buổi<br/>
      Lịch học dự kiến: ${this.formatSlots(slots)}
    </div>

    <table>
      <thead>
        <tr><th>Nội dung</th><th style="text-align:right">Thành tiền</th></tr>
      </thead>
      <tbody>
        <tr>
          <td>Gói học ${en.planHours} giờ (${en.lessons} lessons × ${en.lessonLengthMinutesSnapshot} phút)</td>
          <td style="text-align:right">${pb.grossFmt}</td>
        </tr>
        <tr>
          <td>Giảm giá (${Math.round(Number(en.discountPctApplied || 0) * 100)}%)</td>
          <td style="text-align:right">-${pb.discountFmt}</td>
        </tr>
      </tbody>
      <tfoot>
        <tr class="total"><td>Tổng thanh toán</td><td style="text-align:right">${pb.totalFmt}</td></tr>
      </tfoot>
    </table>

    <div class="muted" style="margin-top:8px">
      Hình thức thanh toán: <b>${pm}</b>${en.paymentMeta?.bankCode ? ' ('+en.paymentMeta.bankCode+')' : ''}.
      Tiền tệ: ${pb.currency}.
    </div>
    ${pb.note ? `<div class="muted" style="margin-top:4px;font-style:italic">${pb.note}</div>` : ''}
  </div>

  <div class="foot">
    Đây là hóa đơn điện tử phát hành bởi ${comp.name}. Vui lòng lưu trữ email này để tham chiếu khi cần hỗ trợ.
  </div>
</div>
</html>
`.trim();
  }

  private async tryMakePdf(html: string): Promise<Buffer | null> {
    if (!Puppeteer) return null;
    try {
        const browser = await Puppeteer.launch({
        headless: true, 
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        } as any);

        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: 'networkidle0' });

        // Puppeteer mới trả Uint8Array
        const raw = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '14mm', bottom: '14mm', left: '12mm', right: '12mm' },
        });

        await browser.close();

        // Ép về Buffer để khớp kiểu hàm trả về
        const buf: Buffer = Buffer.isBuffer(raw) ? raw : Buffer.from(raw);
        return buf;
    } catch (e) {
        this.logger.warn('PDF generation failed, send HTML only: ' + (e as any)?.message);
        return null;
    }
  }


  async sendEnrollmentInvoice(enrollmentId: number, paidAt = new Date()) {
    const en = await this.enrollRepo.findOne({ where: { id: enrollmentId } });
    if (!en) return;

    if (en.status !== 'paid') { // chặn gọi từ FE khi chưa paid
    throw new BadRequestException('Enrollment not paid');
  }

    const [teacher, studentProfile, studentUser] = await Promise.all([
      this.teacherRepo.findOne({ where: { id: en.teacherId } }),
      this.studentRepo.findOne({ where: { id: en.studentId }, relations: ['user'] }),
      this.userRepo.findOne({ where: { id: en.studentId } }), // fallback nếu chưa có hồ sơ Student
    ]);

    const to = studentProfile?.user?.email || studentUser?.email;
    if (!to) {
      this.logger.warn(`No email for student userId=${en.studentId}; skip invoice #${en.id}`);
      return;
    }

    const invoiceNo = `INV-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${en.id}`;
    // tách html cho email và html cho PDF
    const htmlEmail = this.emailInvoiceHtml({
      en, teacher,
      studentUser: studentProfile?.user || studentUser || null,
      studentProfile: studentProfile || null,
      invoiceNo, paidAt,
    });

    const htmlPdf = this.invoiceHtml({
      en, teacher,
      studentUser: studentProfile?.user || studentUser || null,
      studentProfile: studentProfile || null,
      invoiceNo, paidAt,
    });

    const pdf = await this.tryMakePdf(htmlPdf);
    const attachments = pdf ? [{ filename: `${invoiceNo}.pdf`, content: pdf }] : undefined;

    await this.mail.send({
      to,
      subject: `Hóa đơn #${en.id} - ${this.company().name}`,
       html: htmlEmail,
      text: `Hóa đơn #${invoiceNo} - Tổng thanh toán: ${this.vnd(Number(en.total))}.`,
      ...(attachments ? { attachments } : {}),
    });

    return { ok: true, to, invoiceNo, attached: !!attachments };
  }
}
