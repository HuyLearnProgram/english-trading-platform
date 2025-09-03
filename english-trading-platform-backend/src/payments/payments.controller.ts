import { Body, Controller, Get, Post, Query, Req, BadRequestException, Res, Redirect } from '@nestjs/common';
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

      // case 'stripe':
      //   return this.svc.createStripeCheckout(enrollmentId); // khi bạn thêm Stripe

      default:
        throw new BadRequestException('Unsupported provider');
    }
  }

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
}
