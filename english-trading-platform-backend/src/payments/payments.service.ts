import { Injectable, BadRequestException, ConflictException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Enrollment } from 'src/enrollment/enrollment.entity';
import { TeachersService } from 'src/teacher/teacher.service';
import { buildSortedQuery, formatVNDate, hmacSHA512 } from './utils/vnpay.util';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  constructor(
    private readonly cfg: ConfigService,
    @InjectRepository(Enrollment) private readonly enrollRepo: Repository<Enrollment>,
    private readonly teachers: TeachersService,
  ) {}

  private vnp() {
    const vnp_TmnCode    = this.cfg.get<string>('VNP_TMN_CODE');
    const vnp_HashSecret = this.cfg.get<string>('VNP_HASH_SECRET');
    const vnp_Url        = this.cfg.get<string>('VNP_PAYMENT_URL');
    const vnp_ReturnUrl  = this.cfg.get<string>('VNP_RETURN_URL');
    const vnp_IpnUrl     = this.cfg.get<string>('VNP_IPN_URL');
    if (!vnp_TmnCode || !vnp_HashSecret || !vnp_Url || !vnp_ReturnUrl || !vnp_IpnUrl) {
      throw new Error('Missing VNPAY env config');
    }
    return { vnp_TmnCode, vnp_HashSecret, vnp_Url, vnp_ReturnUrl, vnp_IpnUrl };
  }

  /** Tạo URL thanh toán VNPAY cho enrollmentId */
  async createVnpayCheckout(enrollmentId: number, clientIp: string) {
    const en = await this.enrollRepo.findOne({ where: { id: enrollmentId } });
    if (!en) throw new BadRequestException('Enrollment not found');
    if (en.status === 'paid') throw new ConflictException('Enrollment already paid');

    // đánh dấu phương thức đã chọn
    if (en.paymentMethod !== 'vnpay') {
      en.paymentMethod = 'vnpay';
      await this.enrollRepo.save(en);
    }
    const { vnp_TmnCode, vnp_HashSecret, vnp_Url, vnp_ReturnUrl } = this.vnp();

    // Số tiền theo VNPAY: *100
    const amount = Math.round(Number(en.total) * 100);
    const orderInfo = `Thanh toan don hang #${en.id}`;
    const createDate = formatVNDate();
    const expireDate = formatVNDate(new Date(Date.now() + 15 * 60 * 1000));

    const params: Record<string, string | number> = {
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_TmnCode,
      vnp_Amount: amount,
      vnp_CurrCode: 'VND',
      vnp_TxnRef: String(en.id),                // dùng chính enrollmentId để idempotent
      vnp_OrderInfo: orderInfo,
      vnp_OrderType: 'other',
      vnp_ReturnUrl,
      vnp_Locale: 'vn',
      vnp_IpAddr: clientIp || '127.0.0.1',
      vnp_CreateDate: createDate,
      vnp_ExpireDate: expireDate,
    };

    // 1) sort + encode
    const data = buildSortedQuery(params);
    // 2) sign
    const vnp_SecureHash = hmacSHA512(vnp_HashSecret, data);
    // 3) tạo URL
    const checkoutUrl = `${vnp_Url}?${data}&vnp_SecureHash=${vnp_SecureHash}`;

    return { checkoutUrl };
  }

  /** Verify chữ ký của VNPAY (return/ipn) */
  private verifySignature(query: any): boolean {
    const { vnp_HashSecret } = this.vnp();
    const secureHash = query['vnp_SecureHash'];
    const copied = { ...query };
    delete copied['vnp_SecureHash'];
    delete copied['vnp_SecureHashType'];
    const data = buildSortedQuery(copied);
    const sign = hmacSHA512(vnp_HashSecret, data);
    return sign === secureHash;
  }

  /** Return URL (trình duyệt) — optional để FE show “đang xác nhận…” */
  async verifyVnpayReturn(query: any) {
    const ok = this.verifySignature(query);
    return {
      ok,
      code: query?.vnp_ResponseCode,
      orderId: Number(query?.vnp_TxnRef),
      amount: Number(query?.vnp_Amount || 0) / 100,
    };
  }

  /** IPN — chốt đơn: set paid + giữ chỗ (idempotent) */
  async handleVnpayIpn(query: any) {
    try {
      if (!this.verifySignature(query)) {
        return { RspCode: '97', Message: 'Invalid signature' };
      }

      const rspCode = String(query['vnp_ResponseCode'] || '');
      const orderId = Number(query['vnp_TxnRef'] || 0);
      const paidAmt = Number(query['vnp_Amount'] || 0) / 100;

      const en = await this.enrollRepo.findOne({ where: { id: orderId } });
      if (!en) return { RspCode: '01', Message: 'Order not found' };

      // idempotent
      if (en.status === 'paid') return { RspCode: '00', Message: 'OK' };

      const expectAmt = Math.round(Number(en.total));
      const amtOk = Math.round(paidAmt) === expectAmt;

      if (rspCode === '00' && amtOk) {
        // Log thông tin giao dịch
        en.paymentMethod = 'vnpay';
        en.paymentRef = query['vnp_TransactionNo'] || en.paymentRef;
        en.paymentMeta = {
          ...(en.paymentMeta || {}),
          bankCode: query['vnp_BankCode'],
          cardType: query['vnp_CardType'],
          payDate:  query['vnp_PayDate'],
          txnNo:    query['vnp_TransactionNo'],
          respCode: rspCode,
        };
        
        // (A) giữ chỗ nếu có preferredSlots
        if (Array.isArray(en.preferredSlots) && en.preferredSlots.length) {
          try {
            await this.teachers.tryReserveSlots(en.teacherId, en.preferredSlots, en.id);
          } catch (e) {
            // Nếu slot full -> vẫn ghi nhận đã thanh toán, nhưng KHÔNG giữ chỗ
            this.logger.warn(`Reserve slots failed for enrollment #${en.id}: ${e?.message}`);
          }
        }
        // (B) cập nhật trạng thái
        en.status = 'paid';
        await this.enrollRepo.save(en);

        return { RspCode: '00', Message: 'Success' };
      }

      // Không thành công
      return { RspCode: '00', Message: 'Received' };
    } catch (err) {
      this.logger.error('IPN error', err?.stack || err);
      return { RspCode: '99', Message: 'Unhandled error' };
    }
  }

  /** (Dev) Xác thực & CHỐT đơn dựa theo return URL (không dùng IPN) */
  async confirmByReturn(query: any) {
    try {
      // 1) Ký & parse
      if (!this.verifySignature(query)) {
        return { ok: false, reason: 'bad-signature' };
      }
      const orderId   = Number(query['vnp_TxnRef'] || 0);
      const rspCode   = String(query['vnp_ResponseCode'] || '');
      const txnStatus = String(query['vnp_TransactionStatus'] || ''); // có thể trống trên return
      const paidAmt   = Number(query['vnp_Amount'] || 0) / 100;

      const en = await this.enrollRepo.findOne({ where: { id: orderId } });
      if (!en) return { ok: false, reason: 'not-found', orderId };

      // 2) Kiểm số tiền và mã thành công
      const expectAmt = Math.round(Number(en.total));
      const amountOk  = Math.round(paidAmt) === expectAmt;
      const success   = rspCode === '00' && (txnStatus === '' || txnStatus === '00') && amountOk;

      if (!success) {
        return { ok: false, reason: 'gateway-declined', code: rspCode, orderId };
      }

      en.paymentMethod = 'vnpay';
      en.paymentRef = query['vnp_TransactionNo'] || en.paymentRef;
      en.paymentMeta = {
        ...(en.paymentMeta || {}),
        bankCode: query['vnp_BankCode'],
        cardType: query['vnp_CardType'],
        payDate:  query['vnp_PayDate'],
        txnNo:    query['vnp_TransactionNo'],
        respCode: rspCode,
      };

      // 3) Idempotent
      if (en.status !== 'paid') {
        // giữ chỗ nếu có
        if (Array.isArray(en.preferredSlots) && en.preferredSlots.length) {
          try {
            await this.teachers.tryReserveSlots(en.teacherId, en.preferredSlots, en.id);
          } catch (e: any) {
            this.logger.warn(`Reserve slots failed for enrollment #${en.id}: ${e?.message}`);
          }
        }
        en.status = 'paid';
        await this.enrollRepo.save(en);
      }

      return { ok: true, orderId, amount: paidAmt };
    } catch (e) {
      this.logger.error('confirmByReturn error', e);
      return { ok: false, reason: 'unhandled' };
    }
  }

  // (optional) Nếu muốn Return URL trỏ thẳng về BE rồi BE 302 về FE:
  async buildFrontendResultRedirect(ok: boolean, orderId?: number, code?: string) {
    const fe = this.cfg.get<string>('FRONTEND_URL') || 'http://localhost:3001';
    const url = new URL('/checkout/result', fe);
    if (orderId) url.searchParams.set('orderId', String(orderId));
    url.searchParams.set('result', ok ? 'success' : 'fail');
    if (code) url.searchParams.set('code', code);
    return url.toString();
  }
}
