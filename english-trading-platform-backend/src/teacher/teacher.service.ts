// src/teacher/teacher.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { Teacher } from './teacher.entity';
import { QueryTeachersDto } from './dto/query-teacher.dto';
import { CreateTeacherDto } from './dto/create-teacher.dto';
import { UpdateTeacherDto } from './dto/update-teacher.dto';

const parseCSV = (v?: string) =>
  (v ? v.split(',').map(s => s.trim()).filter(Boolean) : []) as string[];

// Chuẩn hóa ngày -> key JSON trong weeklyAvailability
const DAY_INDEX_TO_KEY = ['mon','tue','wed','thu','fri','sat','sun'];
const normalizeDays = (raw: string[]): string[] => {
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

// Map timeOfDay id -> [startMin, endMin)
const SLOT_RANGES: Record<string, [number, number]> = {
  early_morning: [5*60,  7*60],    // 05:00–07:00
  morning:       [7*60,  11*60],   // 07:00–11:00
  noon:          [11*60, 13*60],   // 11:00–13:00
  afternoon:     [13*60, 17*60],   // 13:00–17:00
  evening:       [17*60, 19*60],   // 17:00–19:00
  late_evening:  [19*60, 22*60],   // 19:00–22:00
  late_night:    [22*60, 23*60],   // 22:00–23:00
};

const toMinutes = (hhmm: string): number => {
  const [h, m] = (hhmm || '').split(':').map(n => parseInt(n, 10));
  if (Number.isNaN(h) || Number.isNaN(m)) return -1;
  return h * 60 + m;
};

const overlaps = (aStart: number, aEnd: number, bStart: number, bEnd: number) =>
  Math.max(aStart, bStart) < Math.min(aEnd, bEnd);

// Kiểm tra 1 teacher có “rảnh” giao với tập slot & ngày đã chọn không
const matchAvailability = (
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
      const s = toMinutes(itv.start);
      const e = toMinutes(itv.end);
      if (s < 0 || e < 0 || s >= e) continue;

      for (const [rs, re] of slots) {
        if (overlaps(s, e, rs, re)) return true;
      }
    }
  }
  return false;
};

@Injectable()
export class TeachersService {
  constructor(@InjectRepository(Teacher) private readonly repo: Repository<Teacher>) {}

  async create(dto: CreateTeacherDto) {
    const t = this.repo.create({
      ...dto,
      rating: dto?.['rating'] ?? 0,
      reviewsCount: dto?.['reviewsCount'] ?? 0,
    });
    return this.repo.save(t);
  }

  async update(id: number, dto: UpdateTeacherDto) {
    const cur = await this.repo.preload({ id, ...dto });
    if (!cur) throw new NotFoundException('Teacher not found');
    return this.repo.save(cur);
  }

  async findOne(id: number) {
    const t = await this.repo.findOne({ where: { id } });
    if (!t) throw new NotFoundException('Teacher not found');
    return t;
  }

  async remove(id: number) {
    const t = await this.findOne(id);
    await this.repo.remove(t);
    return { deleted: true };
  }

  async findAll(q: QueryTeachersDto) {
    const page = Math.max(1, q.page ?? 1);
    const limit = Math.min(50, Math.max(1, q.limit ?? 12));

    const qb = this.repo.createQueryBuilder('t');

    // === Search chung theo tên/chuyên môn/headline ===
    if (q.search) {
      const s = `%${q.search.toLowerCase()}%`;
      qb.andWhere(
        new Brackets((w) => {
          w.where('LOWER(t.fullName) LIKE :s', { s })
           .orWhere('LOWER(t.specialties) LIKE :s', { s })
           .orWhere('LOWER(t.headline) LIKE :s', { s });
        }),
      );
    }

    // === country: hỗ trợ nhiều giá trị CSV ===
    const countries = parseCSV(q.country);
    if (countries.length) {
      qb.andWhere('t.country IN (:...countries)', { countries });
    }

    // === specialties: CSV -> match ANY bằng LIKE OR ===
    const specialties = parseCSV(q.specialties).map(x => x.toLowerCase());
    if (specialties.length) {
      qb.andWhere(new Brackets((w) => {
        specialties.forEach((sp, i) => {
          w.orWhere(`LOWER(t.specialties) LIKE :sp${i}`, { [`sp${i}`]: `%${sp}%` });
        });
      }));
    }

    // === gender: CSV -> IN (nếu bạn lưu 1 giá trị) hoặc LIKE OR (nếu lưu CSV)
    const genders = parseCSV(q.gender);
    if (genders.length) {
      // nếu cột gender lưu 1 giá trị duy nhất -> dùng IN:
      qb.andWhere('t.gender IN (:...genders)', { genders });
    }

    // === level: CSV -> LIKE OR (vì thường lưu dạng “Beginner,Intermediate”) ===
    const levels = parseCSV(q.level).map(x => x.toLowerCase());
    if (levels.length) {
      qb.andWhere(new Brackets((w) => {
        levels.forEach((lv, i) => {
          w.orWhere(`LOWER(t.level) LIKE :lv${i}`, { [`lv${i}`]: `%${lv}%` });
        });
      }));
    }

    // === certs: CSV -> LIKE OR ===
    const certs = parseCSV(q.certs).map(x => x.toLowerCase());
    if (certs.length) {
      qb.andWhere(new Brackets((w) => {
        certs.forEach((c, i) => {
          w.orWhere(`LOWER(t.certs) LIKE :c${i}`, { [`c${i}`]: `%${c}%` });
        });
      }));
    }

    // === rating / price filter (nếu có) ===
    if (q.minRating != null) qb.andWhere('t.rating >= :minRating', { minRating: q.minRating });
    if (q.priceMin != null) qb.andWhere('t.hourlyRate >= :priceMin', { priceMin: q.priceMin });
    if (q.priceMax != null) qb.andWhere('t.hourlyRate <= :priceMax', { priceMax: q.priceMax });

    // === sort ===
    switch (q.sort) {
      case 'price_asc':  qb.orderBy('t.hourlyRate', 'ASC'); break;
      case 'price_desc': qb.orderBy('t.hourlyRate', 'DESC'); break;
      case 'newest':     qb.orderBy('t.createdAt', 'DESC'); break;
      default:           qb.orderBy('t.rating', 'DESC'); // rating_desc (default)
    }

    const preItems = await qb.getMany();

    // ==== Lọc theo thời gian (nếu có) ====
    const pickedSlots = parseCSV(q.timeOfDay)
      .map(id => SLOT_RANGES[id])
      .filter(Boolean) as Array<[number,number]>;

    const pickedDays = normalizeDays(parseCSV(q.days));

    const filtered = (pickedSlots.length || pickedDays.length)
      ? preItems.filter(t => matchAvailability(t.weeklyAvailability, pickedDays, pickedSlots))
      : preItems;

    // ==== Tính total + phân trang sau khi đã lọc ====
    const total = filtered.length;
    const start = (page - 1) * limit;
    const items = filtered.slice(start, start + limit);

    return {
      items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
