import * as crypto from 'crypto';

export function hmacSHA512(key: string, data: string): string {
  const h = crypto.createHmac('sha512', key);
  h.update(Buffer.from(data, 'utf-8'));
  return h.digest('hex');
}

export function getClientIp(req: any): string {
  const xff = (req.headers?.['x-forwarded-for'] || '').toString().split(',')[0].trim();
  let ip = xff || req.ip || req.socket?.remoteAddress || '';
  if (ip.startsWith('::ffff:')) ip = ip.slice(7);        // IPv6-mapped IPv4
  if (!/^\d{1,3}(\.\d{1,3}){3}$/.test(ip)) ip = '127.0.0.1'; // ép IPv4 khi local
  return ip;
}

export function randomDigits(len: number): string {
  const chars = '0123456789';
  let out = '';
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

/** Encode và sort đúng chuẩn VNPAY.
 *  - URL encode key & value
 *  - BẮT BUỘC đổi %20 -> +
 */
export function buildSortedQuery(params: Record<string, any>): string {
  const q = Object.keys(params)
    .filter(k => params[k] !== undefined && params[k] !== null && params[k] !== '')
    .sort()
    .map(k => {
      const key = encodeURIComponent(k);
      const val = encodeURIComponent(String(params[k]));
      return `${key}=${val}`;
    })
    .join('&');

  // điểm khác biệt quan trọng với encodeURIComponent thuần
  return q.replace(/%20/g, '+');
}

/** yyyyMMddHHmmss theo GMT+7 */
export function formatVNDate(date = new Date()): string {
  const offsetMin = 420 - date.getTimezoneOffset();
  const d = new Date(date.getTime() + offsetMin * 60 * 1000);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}`;
}