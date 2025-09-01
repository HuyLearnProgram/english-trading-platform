import { overlaps, toMin } from './availability-helpers';
import { DAY_INDEX_TO_KEY } from './availability-consts';

// Kiểm tra 1 teacher có “rảnh” giao với tập slot & ngày đã chọn không
export const matchAvailability = (
  weeklyAvailability: any,
  dayKeys: string[],                 // ['fri','sat'] ...
  slotRanges: Array<[number,number]> // [[1140,1320], ...] đơn vị phút
): boolean => {
  if (!weeklyAvailability) return false;

  // Nếu user không chọn ngày -> coi như “mỗi ngày đều xét”
  const days = dayKeys.length ? dayKeys : DAY_INDEX_TO_KEY;

  // Nếu không chọn khung giờ -> coi như “cả ngày”
  const slots = (slotRanges && slotRanges.length) ? slotRanges : [[0, 24 * 60]];

  for (const d of days) {
    const intervals: Array<{start:string; end:string}> = weeklyAvailability[d] || [];
    if (!intervals.length) continue;

    for (const itv of intervals) {
      const s = toMin(itv.start);
      const e = toMin(itv.end);
      if (s < 0 || e < 0 || s >= e) continue;

      for (const [rs, re] of slots) {
        if (overlaps(s, e, rs, re)) return true;
      }
    }
  }
  return false;
};