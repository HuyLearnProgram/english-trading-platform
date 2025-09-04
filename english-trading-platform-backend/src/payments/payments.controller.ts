import { Body, Controller, Get, Post, Query, Req, BadRequestException, Res, Redirect, Param, ParseIntPipe } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { getClientIp } from './utils/vnpay.util';
import { OnlineProvider } from 'src/common/types/payment';

type CheckoutBody = {
  enrollmentId: number;
  provider?: OnlineProvider; // chỉ các phương thức online
};

@Controller('payments')
export class PaymentsController {
  constructor(private readonly svc: PaymentsService) {}

  /** FE gọi sau khi tạo enrollment (pending) để lấy URL thanh toán */
  @Post('checkout')
  async checkout(@Body() body: { enrollmentId: number; provider?: OnlineProvider }, @Req() req: any) {
    const { enrollmentId } = body || {};
    if (!Number.isInteger(enrollmentId)) {
      throw new BadRequestException('Missing or invalid enrollmentId');
    }

    const ip = getClientIp(req);
    const provider = body.provider ?? 'vnpay';

    switch (provider) {
      case 'vnpay':
        // createVnpayCheckout nên tự set en.paymentMethod = 'vnpay'
        return this.svc.createVnpayCheckout(enrollmentId, ip);
      case 'zalopay':
        return this.svc.createZaloPayCheckout(enrollmentId);
      case 'paypal':
        return this.svc.createPaypalCheckout(enrollmentId);
      case 'momo':
        return this.svc.createMomoCheckout(enrollmentId);
      
      default:
        throw new BadRequestException('Unsupported provider');
    }
  }

    /** ----- VNPAY ----- */


  /** Return URL cho browser (tuỳ bạn redirect về FE khác) */
  @Get('vnpay/return')
  async vnpayReturn(@Query() query: any) {
    // Thường bạn sẽ 302 redirect về FE kèm status; ở đây trả JSON đơn giản
    return this.svc.verifyVnpayReturn(query);
  }

  /** IPN VNPAY (server->server) */
  @Get('vnpay/ipn')
  async vnpayIpn(@Query() query: any) {
    return this.svc.handleVnpayIpn(query);
  }

  /** (DEV) FE-gọi: xác thực theo return & CHỐT đơn ngay */
  @Get('vnpay/confirm-by-return')
  async vnpayConfirmByReturn(@Query() query: any) {
    return this.svc.confirmByReturn(query);
  }

  /** (DEV) Nếu muốn cấu hình VNP_RETURN_URL trỏ về đây (BE) rồi 302 về FE */
  /** DEV: Return URL trỏ về BE → BE xử lý xong 302 về FE */
  @Get('vnpay/return-dev')
  @Redirect(undefined, 302) // Nest sẽ đọc { url } bạn return để redirect
  async vnpayReturnDev(@Query() query: any) {
    const result = await this.svc.confirmByReturn(query);
    const url = await this.svc.buildFrontendResultRedirect(
      !!result?.ok,
      result?.orderId,
      query?.vnp_ResponseCode,
    );
    return { url };
  }


  /** ----- ZALOPAY ----- */


  /** IPN (POST) — ZaloPay gọi server→server */
  @Post('zalopay/callback')
  async zaloPayCallback(@Body() body: any) {
    return this.svc.handleZaloPayCallback(body);
  }

  /** DEV: cho phép return về BE trước rồi 302 về FE (khi test localhost) */
  @Get('zalopay/return-dev')
  @Redirect(undefined, 302)
  async zaloPayReturnDev(@Query() query: any) {
    const r = await this.svc.confirmZaloPayByReturn(query);
    const url = await this.svc.buildFrontendResultRedirect(!!r?.ok, r?.orderId, query?.status || query?.code);
    return { url };
  }


  /** ----- PAYPAL DEV FLOW (localhost) ----- */

  @Get('paypal/return-dev')
  @Redirect(undefined, 302)
  async paypalReturnDev(@Query() query: any) {
    const r = await this.svc.confirmPaypalByReturn(query); // capture ngay
    const url = await this.svc.buildFrontendResultRedirect(!!r?.ok, r?.orderId, undefined, 'paypal');
    return { url };
  }

  @Get('paypal/cancel-dev')
  @Redirect(undefined, 302)
  async paypalCancelDev(@Query() query: any) {
    // Cancel thì không capture; chỉ quay lại FE và báo fail
    const url = await this.svc.buildFrontendResultRedirect(false, Number(query?.orderId || 0), 'canceled', 'paypal');
    return { url };
  }

    /** ----- MOMO ----- */

  // IPN (POST) — khi có public URL
  @Post('momo/ipn')
  async momoIpn(@Body() body: any) {
    return this.svc.handleMomoIpn(body);
  }

  // DEV Return: MoMo redirect → BE xác nhận → 302 về FE
  @Get('momo/return-dev')
  @Redirect(undefined, 302)
  async momoReturnDev(@Query() query: any) {
    const r = await this.svc.confirmMomoByReturn(query);
    const url = await this.svc.buildFrontendResultRedirect(
      !!r?.ok,
      r?.orderId,
      String(query?.resultCode || ''),
      'momo'
    );
    return { url };
  }

  @Post(':id/send-invoice')
  async sendInvoice(@Param('id', ParseIntPipe) id: number) {
    return this.svc.sendInvoiceForEnrollment(id);
  }
}
