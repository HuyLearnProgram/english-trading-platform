import * as crypto from 'crypto';

// SHA256 hex
export function hmacSHA256Hex(key: string, data: string): string {
  return crypto.createHmac('sha256', key).update(Buffer.from(data, 'utf8')).digest('hex');
}

/** Raw signature khi gọi /create */
export function momoRawCreateSignature(p: {
  accessKey: string; amount: string; extraData: string; ipnUrl: string;
  orderId: string; orderInfo: string; partnerCode: string; redirectUrl: string;
  requestId: string; requestType: string;
}) {
  // Theo docs: accessKey&amount&extraData&ipnUrl&orderId&orderInfo&partnerCode&redirectUrl&requestId&requestType
  return [
    `accessKey=${p.accessKey}`,
    `amount=${p.amount}`,
    `extraData=${p.extraData}`,
    `ipnUrl=${p.ipnUrl}`,
    `orderId=${p.orderId}`,
    `orderInfo=${p.orderInfo}`,
    `partnerCode=${p.partnerCode}`,
    `redirectUrl=${p.redirectUrl}`,
    `requestId=${p.requestId}`,
    `requestType=${p.requestType}`,
  ].join('&');
}

/** Raw signature của response/return/ipn (v2).
 *  Lưu ý thứ tự key theo docs, chỉ nối các key có mặt trong payload.
 */
export function momoRawRespSignature(accessKey: string, anyObj: Record<string, any>) {
  const get = (k: string) => (anyObj?.[k] ?? ''); // luôn trả về string (kể cả rỗng)

  // CHÍNH XÁC thứ tự khóa MoMo yêu cầu:
  return `accessKey=${accessKey}` +
         `&amount=${get('amount')}` +
         `&extraData=${get('extraData')}` +
         `&message=${get('message')}` +
         `&orderId=${get('orderId')}` +
         `&orderInfo=${get('orderInfo')}` +
         `&orderType=${get('orderType')}` +
         `&partnerCode=${get('partnerCode')}` +
         `&payType=${get('payType')}` +
         `&requestId=${get('requestId')}` +
         `&responseTime=${get('responseTime')}` +
         `&resultCode=${get('resultCode')}` +
         `&transId=${get('transId')}`;
}
