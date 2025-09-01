export const PACKAGE_HOURS = [30, 36, 60, 72, 108, 120, 144, 180] as const;
export type PackageHours = typeof PACKAGE_HOURS[number];

// Có thể chỉnh % này theo business sau này
export const PACKAGE_DISCOUNTS: Record<number, number> = {
  30: 0.00,
  36: 0.02,
  60: 0.05,
  72: 0.08,
  108: 0.12,
  120: 0.15,
  144: 0.18,
  180: 0.20,
};
