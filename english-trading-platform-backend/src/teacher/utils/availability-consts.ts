export const DAY_KEYS = ['mon','tue','wed','thu','fri','sat','sun'] as const;
export type DayKey = typeof DAY_KEYS[number];
export const DAY_INDEX_TO_KEY: DayKey[] = ['mon','tue','wed','thu','fri','sat','sun'];

export // Map timeOfDay id -> [startMin, endMin)
const SLOT_RANGES: Record<string, [number, number]> = {
  early_morning: [5*60,  7*60],    // 05:00–07:00
  morning:       [7*60,  11*60],   // 07:00–11:00
  noon:          [11*60, 13*60],   // 11:00–13:00
  afternoon:     [13*60, 17*60],   // 13:00–17:00
  evening:       [17*60, 19*60],   // 17:00–19:00
  late_evening:  [19*60, 22*60],   // 19:00–22:00
  late_night:    [22*60, 23*60],   // 22:00–23:00
};

export /** Chính sách có thể mở rộng trong tương lai */
const SLOT_POLICIES: Array<{ lesson: number; slot: number; gridStep: number }> = [
  { lesson: 45, slot: 60,  gridStep:5 }, // 1h block, rơi đúng :00
  { lesson: 60, slot: 90,  gridStep: 5 }, // 1h30 block, rơi đúng :00/:30
  { lesson: 90, slot: 120, gridStep: 5 }, // 2h block, rơi đúng :00
];