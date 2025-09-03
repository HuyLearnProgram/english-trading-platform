import * as crypto from 'crypto';
import axios from 'axios';

export function hmacSHA256Hex(key: string, data: string) {
  return crypto.createHmac('sha256', key).update(Buffer.from(data, 'utf-8')).digest('hex');
}

/** apptransid dạng yyMMdd_{orderId} — dễ map Enrollment + idempotent */
export function buildAppTransId(orderId: number, d = new Date()): string {
  const yy = String(d.getFullYear()).slice(-2);
  const MM = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yy}${MM}${dd}_${orderId}`;
}

/** POST application/x-www-form-urlencoded */
export async function postForm<T = any>(url: string, params: Record<string, string>) {
  const body = new URLSearchParams(params).toString();
  const { data } = await axios.post<T>(url, body, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    timeout: 15000,
  });
  return data;
}
