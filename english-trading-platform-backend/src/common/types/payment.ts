export const PAYMENT_METHODS = [
  'unknown',
  'vnpay',
  'momo',
  'zalopay',
  'paypal',
  'bank_transfer',
] as const;

export type PaymentMethod = typeof PAYMENT_METHODS[number];

export type OnlineProvider =
  Exclude<PaymentMethod, 'unknown' | 'bank_transfer'>;

