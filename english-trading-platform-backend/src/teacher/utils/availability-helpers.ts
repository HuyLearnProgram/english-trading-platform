import { BadRequestException } from '@nestjs/common';
import { DAY_INDEX_TO_KEY, DAY_KEYS, DayKey, SLOT_POLICIES } from './availability-consts';

export const toMin = (hhmm: string) => {
  const [h, m] = (hhmm || '').split(':').map(n => parseInt(n, 10));
  if (Number.isNaN(h) || Number.isNaN(m)) return -1;
  return h * 60 + m;
};
export const toHHMM = (min: number) =>
  `${String(Math.floor(min/60)).padStart(2,'0')}:${String(min%60).padStart(2,'0')}`;

export const overlaps = (aStart: number, aEnd: number, bStart: number, bEnd: number) =>
  Math.max(aStart, bStart) < Math.min(aEnd, bEnd);

// Chia chuỗi CSV -> mảng string
export const parseCSV = (v?: string) =>
  (v ? v.split(',').map(s => s.trim()).filter(Boolean) : []) as string[];

// Chuẩn hóa ngày -> key JSON trong weeklyAvailability
export const normalizeDays = (raw: string[]): string[] => {
  if (!raw.length) return [];
  return raw.map(d => {
    const n = Number(d);
    if (!Number.isNaN(n) && n >= 0 && n <= 6) return DAY_INDEX_TO_KEY[n];
    const s = d.toLowerCase().slice(0,3);
    switch (s) {
      case 'mon': return 'mon';
      case 'tue': return 'tue';
      case 'wed': return 'wed';
      case 'thu': return 'thu';
      case 'fri': return 'fri';
      case 'sat': return 'sat';
      case 'sun': return 'sun';
      default:    return '';
    }
  }).filter(Boolean);
};

export const policyFor = (lessonLen: number) =>
  SLOT_POLICIES.find(p => p.lesson === lessonLen) || { lesson: lessonLen, slot: 60, gridStep: 30 };

export   /** Chuẩn hóa + validate weeklyAvailability theo policy */
  function sanitizeWeeklyAvailability(
    raw: any,
    lessonLengthMinutes = 45,
  ): Record<DayKey, Array<{ start: string; end: string }>> | null {
    if (!raw || typeof raw !== 'object') return null;

    const { slot, gridStep } = policyFor(lessonLengthMinutes);
    const out: Record<DayKey, Array<{start: string; end: string}>> = {
      mon: [], tue: [], wed: [], thu: [], fri: [], sat: [], sun: [],
    };

    for (const day of DAY_KEYS) {
      const arr = Array.isArray(raw[day]) ? raw[day] : [];
      const norm: Array<[number, number]> = [];

      for (const it of arr) {
        let s = toMin(it?.start), e = toMin(it?.end);
        if (s < 0 || e < 0 || s >= e) continue;
        // clamp biên trước:
        s = Math.max(0, s);
        e = Math.min(24 * 60, e);

        // biên phải nằm trên lưới step
        if (s % gridStep !== 0 || e % gridStep !== 0) {
          throw new BadRequestException(
            `Start/End must align to ${gridStep} minutes grid (day ${day})`,
          );
        }
        // độ dài phải chia hết cho slot
        const dur = e - s;
        if (dur % slot !== 0) {
          throw new BadRequestException(
            `Interval ${it.start}-${it.end} on ${day} must be a multiple of ${slot} minutes for lesson length ${lessonLengthMinutes}`,
          );
        }

        if (s < e) norm.push([s, e]);
      }

      // sort + merge, không cho overlap
      norm.sort((a, b) => a[0] - b[0]);
      const merged: Array<[number, number]> = [];
      for (const cur of norm) {
        const last = merged[merged.length - 1];
        if (!last) { merged.push(cur); continue; }
        if (cur[0] < last[1]) {
          throw new BadRequestException(`Intervals overlap on ${day}`);
        }
        // nếu sát nhau thì merge
        if (cur[0] === last[1]) last[1] = cur[1];
        else merged.push(cur);
      }

      out[day] = merged.map(([s, e]) => ({ start: toHHMM(s), end: toHHMM(e) }));
    }
    return out;
  }