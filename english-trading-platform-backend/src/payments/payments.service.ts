import { Injectable, BadRequestException, ConflictException, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Enrollment } from 'src/enrollment/enrollment.entity';
import { TeachersService } from 'src/teacher/teacher.service';
import { buildSortedQuery, formatVNDate, hmacSHA512 } from './utils/vnpay.util';
import { postForm as zlpPostForm, buildAppTransId, hmacSHA256Hex } from './utils/zalopay.util';
import axios from 'axios';
import { momoRawCreateSignature, momoRawRespSignature, hmacSHA256Hex as momoHmac } from './utils/momo.util';
import { InvoiceService } from './invoice.service';
import { StudentScheduleService } from 'src/student/student-schedule.service';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  constructor(
    private readonly cfg: ConfigService,
    @InjectRepository(Enrollment) private readonly enrollRepo: Repository<Enrollment>,
    private readonly teachers: TeachersService,
    private readonly invoice: InvoiceService,
    private readonly schedule: StudentScheduleService,
  ) {}
   /** ----- VNPAY SERVICE ----- */
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
        await this.schedule.generateForEnrollment(en.id, new Date()).catch(e=>
          this.logger.warn(`Generate schedule failed #${en.id}: ${e instanceof Error ? e.message : e}`),
        );
      }

      return { ok: true, orderId, amount: paidAmt };
    } catch (e) {
      this.logger.error('confirmByReturn error', e);
      return { ok: false, reason: 'unhandled' };
    }
  }

   /** ----- ZALOPAY SERVICE ----- */
   private zlp() {
    const appId = this.cfg.get<string>('ZLP_APP_ID');
    const key1 = this.cfg.get<string>('ZLP_KEY1');
    const key2 = this.cfg.get<string>('ZLP_KEY2');
    const url  = this.cfg.get<string>('ZLP_CREATE_ORDER_URL');
    const callbackUrl = this.cfg.get<string>('ZLP_CALLBACK_URL');
    const returnUrl   = this.cfg.get<string>('ZLP_RETURN_URL') || this.cfg.get<string>('FRONTEND_URL') + '/checkout/result';
    if (!appId || !key1 || !key2 || !url || !callbackUrl) throw new Error('Missing ZaloPay env config');
    return { appId, key1, key2, url, callbackUrl, returnUrl };
  }

  /** Tạo order ZaloPay và trả checkoutUrl */
  async createZaloPayCheckout(enrollmentId: number) {
    const en = await this.enrollRepo.findOne({ where: { id: enrollmentId } });
    if (!en) throw new BadRequestException('Enrollment not found');
    if (en.status === 'paid') throw new ConflictException('Enrollment already paid');

    // đánh dấu phương thức
    if ((en as any).paymentMethod !== 'zalopay') {
      (en as any).paymentMethod = 'zalopay';
      await this.enrollRepo.save(en);
    }

    const { appId, key1, url, callbackUrl, returnUrl } = this.zlp();
    const amount = Math.round(Number(en.total));
    const apptransid = buildAppTransId(en.id);
    const apptime = Date.now().toString();

    const embeddata = JSON.stringify({
      redirecturl: returnUrl,
      callbackurl: callbackUrl,
      merchantinfo: `enrollment#${en.id}`,
    });

    const items = JSON.stringify([
      { itemid: `plan_${en.planHours}`, itemname: 'English 1-1 package', itemprice: amount, itemquantity: 1 },
    ]);

    const params: Record<string, string> = {
      appid: String(appId),
      appuser: String(en.studentId),
      apptime,
      amount: String(amount),
      apptransid,
      embeddata,
      item: items,
      description: `Thanh toan goi hoc #${en.id}`,
      bankcode: 'zalopayapp',
    };

    // MAC = HMACSHA256(key1, appid|apptransid|appuser|amount|apptime|embeddata|item)
    const signData = [
      params.appid,
      params.apptransid,
      params.appuser,
      params.amount,
      params.apptime,
      params.embeddata,
      params.item,
    ].join('|');
    params['mac'] = hmacSHA256Hex(key1, signData);

    const zres: any = await zlpPostForm(url, params);
    if (zres.returncode !== 1) {
      throw new BadRequestException(zres.returnmessage || 'ZaloPay create order failed');
    }
    // zres: orderurl | deeplink | zptranstoken ...
    return { checkoutUrl: zres.orderurl, zptranstoken: zres.zptranstoken };
  }

  /** IPN ZaloPay: verify MAC (key2) + chốt đơn (idempotent) */
  async handleZaloPayCallback(body: any) {
    try {
      const { key2 } = this.zlp();
      const reqData = body?.data;
      const reqMac  = body?.mac;
      const macLocal = hmacSHA256Hex(key2, reqData || '');
      if (macLocal !== reqMac) {
        return { returncode: -1, returnmessage: 'mac not match' };
      }

      const data = JSON.parse(reqData); // { appid, apptransid, zptransid, amount, ... }
      const apptransid: string = data.apptransid;
      const zptransid: string  = data.zptransid;
      const amount: number     = Number(data.amount || 0);

      const orderId = Number(String(apptransid || '').split('_')[1] || 0);
      const en = await this.enrollRepo.findOne({ where: { id: orderId } });
      if (!en) return { returncode: 2, returnmessage: 'order not found' };
      if (en.status === 'paid') return { returncode: 1, returnmessage: 'OK' };

      const expect = Math.round(Number(en.total));
      if (expect !== Math.round(amount)) return { returncode: -1, returnmessage: 'amount mismatch' };

      // (giữ chỗ) — optional
      if (Array.isArray(en.preferredSlots) && en.preferredSlots.length) {
        try { await this.teachers.tryReserveSlots(en.teacherId, en.preferredSlots, en.id); }
        catch (e) { this.logger.warn(`Reserve failed for #${en.id}: ${e instanceof Error ? e.message : e}`); }
      }

      (en as any).status = 'paid';
      (en as any).paymentMethod = 'zalopay';
      (en as any).paymentRef = zptransid;
      (en as any).paymentMeta = { ...(en as any).paymentMeta, zptransid, apptransid };
      await this.enrollRepo.save(en);

      return { returncode: 1, returnmessage: 'OK' };
    } catch (e) {
      this.logger.error('ZLP callback error', e);
      // 0 = ZaloPay sẽ retry
      return { returncode: 0, returnmessage: 'server error' };
    }
  }

  /** DEV: xác nhận theo tham số return URL (không cần IPN) */
  async confirmZaloPayByReturn(query: any) {
    try {
      // Thực tế ZaloPay khuyến nghị chốt qua IPN; đây là fallback DEV.
      const apptransid = query?.apptransid || query?.appTransId || '';
      const orderId = Number(String(apptransid).split('_')[1] || query?.orderId || 0);
      if (!orderId) return { ok: false, reason: 'missing-order' };

      const en = await this.enrollRepo.findOne({ where: { id: orderId } });
      if (!en) return { ok: false, reason: 'not-found', orderId };

      // status có thể là '1'/'success' — linh hoạt cho DEV
      const status = String(query?.status ?? query?.returncode ?? query?.code ?? '').toLowerCase();
      const ok = status === '1' || status === 'success' || status === '00';

      if (!ok) return { ok: false, reason: 'gateway-declined', code: status, orderId };

      if (en.status !== 'paid') {
        if (Array.isArray(en.preferredSlots) && en.preferredSlots.length) {
          try { await this.teachers.tryReserveSlots(en.teacherId, en.preferredSlots, en.id); }
          catch (e: any) { this.logger.warn(`Reserve failed for #${en.id}: ${e?.message}`); }
        }
        (en as any).status = 'paid';
        (en as any).paymentMethod = 'zalopay';
        (en as any).paymentRef = query?.zptransid || (en as any).paymentRef;
        (en as any).paymentMeta = { ...(en as any).paymentMeta, apptransid, zptransid: query?.zptransid, devReturn: true };
        await this.enrollRepo.save(en);
        await this.schedule.generateForEnrollment(en.id, new Date()).catch(e=>
          this.logger.warn(`Generate schedule failed #${en.id}: ${e instanceof Error ? e.message : e}`),
        );
      }

      const amount = Number(query?.amount || en.total);
      return { ok: true, orderId, amount };
    } catch (e) {
      this.logger.error('confirmZaloPayByReturn error', e);
      return { ok: false, reason: 'unhandled' };
    }
  }


  /** ----- PAYPAL SERVICE ----- */
  private paypal() {
    const env = this.cfg.get<string>('PAYPAL_ENV') || 'sandbox';
    const base =
      env === 'live'
        ? 'https://api-m.paypal.com'
        : 'https://api-m.sandbox.paypal.com';

    const clientId = this.cfg.get<string>('PAYPAL_CLIENT_ID');
    const secret   = this.cfg.get<string>('PAYPAL_CLIENT_SECRET');
    const returnUrl= this.cfg.get<string>('PAYPAL_RETURN_URL');
    const cancelUrl= this.cfg.get<string>('PAYPAL_CANCEL_URL');
    const currency = (this.cfg.get<string>('PAYPAL_CURRENCY') || 'USD').toUpperCase();
    const vndUsd   = Number(this.cfg.get<string>('PAYPAL_VND_USD') || 24000); // dùng khi cần convert

    if (!clientId || !secret || !returnUrl || !cancelUrl) {
      throw new Error('Missing PayPal env config');
    }
    return { base, clientId, secret, returnUrl, cancelUrl, currency, vndUsd };
  }

  private async getPaypalToken() {
    const { base, clientId, secret } = this.paypal();
    const body = new URLSearchParams({ grant_type: 'client_credentials' }).toString();
    const { data } = await axios.post(
      `${base}/v1/oauth2/token`,
      body,
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        auth: { username: clientId, password: secret },
        timeout: 15000,
      }
    );
    return data?.access_token as string;
  }

  /** Tạo PayPal Order cho enrollment và trả về approval URL */
  async createPaypalCheckout(enrollmentId: number) {
    const en = await this.enrollRepo.findOne({ where: { id: enrollmentId } });
    if (!en) throw new BadRequestException('Enrollment not found');
    if (en.status === 'paid') throw new ConflictException('Enrollment already paid');

    // set phương thức
    if (en.paymentMethod !== 'paypal') {
      en.paymentMethod = 'paypal' as any;
      await this.enrollRepo.save(en);
    }

    const { base, returnUrl, cancelUrl, currency, vndUsd } = this.paypal();
    const token = await this.getPaypalToken();

    // TÍNH amount:
    // - Nếu bạn để PAYPAL_CURRENCY=USD mà giá en.total đang là VND -> convert tạm theo PAYPAL_VND_USD
    let value: string;
    if (currency === 'VND') {
      // PayPal KHÔNG hỗ trợ VND ở đa số tài khoản. Chỉ dùng nếu tài khoản của bạn thực sự hỗ trợ.
      value = Math.round(Number(en.total)).toString();
    } else {
      const usd = Math.max(0.01, Math.round((Number(en.total) / Math.max(1, vndUsd)) * 100) / 100);
      value = usd.toFixed(2);
    }

    const orderPayload = {
      intent: 'CAPTURE',
      purchase_units: [
        {
          reference_id: String(en.id),
          amount: {
            currency_code: currency,
            value,
          },
          description: `Enrollment #${en.id}`,
        },
      ],
      application_context: {
        brand_name: 'Antoree',
        user_action: 'PAY_NOW',
        return_url: returnUrl,   // PayPal redirect về đây sau khi approve
        cancel_url: cancelUrl,   // Cancel → mình sẽ 302 về FE với kết quả fail
      },
    };

    const { data: order } = await axios.post(
      `${base}/v2/checkout/orders`,
      orderPayload,
      { headers: { Authorization: `Bearer ${token}` }, timeout: 15000 }
    );

    const approve = (order?.links || []).find((l: any) => l.rel === 'approve')?.href;
    if (!approve) throw new Error('No approval link from PayPal');

    return { checkoutUrl: approve, orderId: order?.id };
  }

  /** Xác nhận (CAPTURE) sau khi PayPal redirect về return URL (dev) */
  async confirmPaypalByReturn(query: any) {
    try {
      const orderId = String(query?.token || '').trim(); // PayPal gửi token=orderId
      if (!orderId) return { ok: false, reason: 'missing-token' };

      const { base } = this.paypal();
      const token = await this.getPaypalToken();

      // CAPTURE
      const { data: capture } = await axios.post(
        `${base}/v2/checkout/orders/${orderId}/capture`,
        {},
        { headers: { Authorization: `Bearer ${token}` }, timeout: 15000 }
      );

      // PayPal order chứa purchase_units -> payments -> captures
      const status = capture?.status || capture?.purchase_units?.[0]?.payments?.captures?.[0]?.status;
      const refId  = capture?.purchase_units?.[0]?.payments?.captures?.[0]?.id;
      const referenceId = capture?.purchase_units?.[0]?.reference_id;
      const amountObj = capture?.purchase_units?.[0]?.payments?.captures?.[0]?.amount;

      const enrollmentId = Number(referenceId || 0);
      const en = await this.enrollRepo.findOne({ where: { id: enrollmentId } });
      if (!en) return { ok: false, reason: 'not-found', orderId: enrollmentId };

      const success = String(status).toUpperCase() === 'COMPLETED';

      if (!success) {
        return { ok: false, reason: 'gateway-declined', orderId: enrollmentId, code: status };
      }

      // Idempotent update
      en.paymentMethod = 'paypal' as any;
      en.paymentRef = refId || en.paymentRef;
      en.paymentMeta = {
        ...(en.paymentMeta || {}),
        paypalOrderId: orderId,
        captureStatus: status,
        captureAmount: amountObj,
      };

      if (en.status !== 'paid') {
        try {
          if (Array.isArray(en.preferredSlots) && en.preferredSlots.length) {
            await this.teachers.tryReserveSlots(en.teacherId, en.preferredSlots, en.id);
          }
        } catch (e: any) {
          this.logger.warn(`Reserve slots failed for enrollment #${en.id}: ${e?.message}`);
        }
        en.status = 'paid';
        await this.enrollRepo.save(en);
        await this.schedule.generateForEnrollment(en.id, new Date()).catch(e=>
          this.logger.warn(`Generate schedule failed #${en.id}: ${e instanceof Error ? e.message : e}`),
        );
      }

      return { ok: true, orderId: en.id };
    } catch (e) {
      this.logger.error('confirmPaypalByReturn error', e);
      return { ok: false, reason: 'unhandled' };
    }
  }


  /** ----- MOMO SERVICE ----- */

  private momo() {
    const partnerCode = this.cfg.get<string>('MOMO_PARTNER_CODE');
    const accessKey   = this.cfg.get<string>('MOMO_ACCESS_KEY');
    const secretKey   = this.cfg.get<string>('MOMO_SECRET_KEY');
    const createUrl   = this.cfg.get<string>('MOMO_CREATE_URL');
    const returnUrl   = this.cfg.get<string>('MOMO_RETURN_URL');
    const ipnUrl      = this.cfg.get<string>('MOMO_IPN_URL');
    if (!partnerCode || !accessKey || !secretKey || !createUrl || !returnUrl || !ipnUrl) {
      throw new Error('Missing MoMo env config');
    }
    return { partnerCode, accessKey, secretKey, createUrl, returnUrl, ipnUrl };
  }

  /** Tạo MoMo Order và trả link thanh toán (payUrl/deeplink) */
  async createMomoCheckout(enrollmentId: number) {
    const en = await this.enrollRepo.findOne({ where: { id: enrollmentId } });
    if (!en) throw new BadRequestException('Enrollment not found');
    if (en.status === 'paid') throw new ConflictException('Enrollment already paid');

    if (en.paymentMethod !== 'momo') {
      en.paymentMethod = 'momo' as any;
      await this.enrollRepo.save(en);
    }

    const { partnerCode, accessKey, secretKey, createUrl, returnUrl, ipnUrl } = this.momo();

    const amount = String(Math.round(Number(en.total)));
    // MoMo yêu cầu orderId duy nhất -> gắn timestamp giữ mapping bằng cách tách trước dấu "_"
    const orderId   = `${en.id}_${Date.now()}`;
    const requestId = orderId;
    const orderInfo = `Thanh toan goi hoc #${en.id}`;
    const requestType = 'payWithMethod';       // theo sample
    const extraData   = '';                    // tuỳ nhu cầu
    const autoCapture = true;
    const lang = 'vi';

    const raw = momoRawCreateSignature({
      accessKey, amount, extraData, ipnUrl, orderId, orderInfo,
      partnerCode, redirectUrl: returnUrl, requestId, requestType,
    });
    const signature = momoHmac(secretKey, raw);

    const payload = {
      partnerCode, partnerName: 'Antoree',
      storeId: 'AntoreeStore',
      requestId, amount, orderId, orderInfo,
      redirectUrl: returnUrl, ipnUrl,
      lang, requestType, autoCapture, extraData,
      signature,
    };

    const { data } = await axios.post(createUrl, payload, {
      headers: { 'Content-Type': 'application/json' }, timeout: 15000,
    });

    if (Number(data?.resultCode) !== 0) {
      throw new BadRequestException(data?.message || 'MoMo create order failed');
    }

    // payUrl (web) | deeplink (app)
    return { checkoutUrl: data.payUrl || data.deeplink, momoOrderId: orderId };
  }

  /** IPN MoMo (server->server) – dùng khi có public URL */
  async handleMomoIpn(body: any) {
    try {
      const { accessKey, secretKey } = this.momo();

      // xác thực chữ ký
      const raw = momoRawRespSignature(accessKey, body || {});
      const sign = momoHmac(secretKey, raw);
      if (sign !== body?.signature) {
        return { resultCode: 97, message: 'bad signature' };
      }

      const ok      = Number(body?.resultCode) === 0;
      const amount  = Number(body?.amount || 0);
      const idStr   = String(body?.orderId || '');
      const orderId = Number(idStr.split('_')[0] || 0);

      const en = await this.enrollRepo.findOne({ where: { id: orderId } });
      if (!en) return { resultCode: 0, message: 'order not found' };

      if (ok && en.status !== 'paid') {
        const expect = Math.round(Number(en.total));
        if (Math.round(amount) !== expect) return { resultCode: 0, message: 'amount mismatch' };

        // giữ chỗ nếu có
        if (Array.isArray(en.preferredSlots) && en.preferredSlots.length) {
          try { await this.teachers.tryReserveSlots(en.teacherId, en.preferredSlots, en.id); }
          catch (e) { this.logger.warn(`Reserve failed #${en.id}: ${e instanceof Error ? e.message : e}`); }
        }

        en.status = 'paid';
        en.paymentMethod = 'momo' as any;
        en.paymentRef = body?.transId || en.paymentRef;
        en.paymentMeta = {
          ...(en.paymentMeta || {}),
          momoOrderId: idStr,
          momoRequestId: body?.requestId,
          payType: body?.payType,
          message: body?.message,
          resultCode: body?.resultCode,
        };
        await this.enrollRepo.save(en);
      }

      return { resultCode: 0, message: 'success' };
    } catch (e) {
      this.logger.error('MoMo IPN error', e);
      // MoMo sẽ retry khi không trả về 0
      return { resultCode: 0, message: 'received' };
    }
  }

  /** DEV: xác nhận qua Return URL (localhost, không cần IPN) */
  async confirmMomoByReturn(query: any) {
    try {
      const { accessKey, secretKey } = this.momo();

      // verify signature nếu đủ field
      const raw = momoRawRespSignature(accessKey, query || {});
      const sign = momoHmac(secretKey, raw);
      if (query?.signature && sign !== query.signature) {
        return { ok: false, reason: 'bad-signature' };
      }

      const ok      = Number(query?.resultCode) === 0;
      const amount  = Number(query?.amount || 0);
      const idStr   = String(query?.orderId || '');
      const orderId = Number(idStr.split('_')[0] || 0);

      const en = await this.enrollRepo.findOne({ where: { id: orderId } });
      if (!en) return { ok: false, reason: 'not-found', orderId };

      if (!ok) return { ok: false, reason: 'gateway-declined', code: query?.resultCode, orderId };

      if (en.status !== 'paid') {
        const expect = Math.round(Number(en.total));
        if (Math.round(amount) !== expect) return { ok: false, reason: 'amount-mismatch', orderId };

        if (Array.isArray(en.preferredSlots) && en.preferredSlots.length) {
          try { await this.teachers.tryReserveSlots(en.teacherId, en.preferredSlots, en.id); }
          catch (e: any) { this.logger.warn(`Reserve failed #${en.id}: ${e.message}`); }
        }
        en.status = 'paid';
        en.paymentMethod = 'momo' as any;
        en.paymentRef = query?.transId || en.paymentRef;
        en.paymentMeta = {
          ...(en.paymentMeta || {}),
          momoOrderId: idStr,
          momoRequestId: query?.requestId,
          payType: query?.payType,
          resultCode: query?.resultCode,
          message: query?.message,
          devReturn: true,
        };
        await this.enrollRepo.save(en);
        await this.schedule.generateForEnrollment(en.id, new Date()).catch(e=>
          this.logger.warn(`Generate schedule failed #${en.id}: ${e instanceof Error ? e.message : e}`),
        );
      }

      return { ok: true, orderId, amount };
    } catch (e) {
      this.logger.error('confirmMomoByReturn error', e);
      return { ok: false, reason: 'unhandled' };
    }
  }
  // (optional) Nếu muốn Return URL trỏ thẳng về BE rồi BE 302 về FE:
  async buildFrontendResultRedirect(ok: boolean, orderId?: number, code?: string, provider?: string) {
    const fe = this.cfg.get<string>('FRONTEND_URL') || 'http://localhost:3001';
    const url = new URL('/checkout/result', fe);
    if (orderId) url.searchParams.set('orderId', String(orderId));
    url.searchParams.set('result', ok ? 'success' : 'fail');
    if (code) url.searchParams.set('code', code);
    if (provider) url.searchParams.set('provider', provider);
    return url.toString();
  }
  
  /** Gửi hóa đơn cho đơn đã thanh toán (idempotent ở tầng email provider) */
  async sendInvoiceForEnrollment(enrollmentId: number) {
    const en = await this.enrollRepo.findOne({ where: { id: enrollmentId } });
    if (!en) throw new NotFoundException('Enrollment not found');

    if (en.status !== 'paid') {
      throw new BadRequestException('Order has not been paid');
    }
    // trả về info để FE hiển thị (email, mã hóa đơn, có/không file đính kèm)
    return this.invoice.sendEnrollmentInvoice(enrollmentId);
  }
}
