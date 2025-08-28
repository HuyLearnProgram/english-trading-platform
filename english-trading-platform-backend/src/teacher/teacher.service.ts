// src/teacher/teacher.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { Teacher } from './teacher.entity';
import { QueryTeachersDto } from './dto/query-teacher.dto';
import { CreateTeacherDto } from './dto/create-teacher.dto';
import { UpdateTeacherDto } from './dto/update-teacher.dto';
import { Review } from 'src/review/review.entity';

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
  constructor(@InjectRepository(Teacher) private readonly repo: Repository<Teacher>,
  @InjectRepository(Review) private readonly reviewRepo: Repository<Review>,
) {}

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
    const page  = Math.max(1, q.page ?? 1);
    const limit = Math.min(50, Math.max(1, q.limit ?? 12));

    const qb = this.repo.createQueryBuilder('t');

    // === (các filter hiện có) ===
    // ... y nguyên phần search/country/specialties/gender/level/certs/price ở code của bạn

    // sort DB-level cho price/newest; rating sẽ sort ở memory sau khi gom thống kê
    switch (q.sort) {
      case 'price_asc':  qb.orderBy('t.hourlyRate', 'ASC'); break;
      case 'price_desc': qb.orderBy('t.hourlyRate', 'DESC'); break;
      case 'newest':     qb.orderBy('t.createdAt', 'DESC'); break;
      default:           qb.orderBy('t.createdAt', 'ASC'); // tạm, rating sort sau
    }

    // Lấy trước danh sách thô theo filter DB
    const preItems = await qb.getMany();

    // Lọc theo khung giờ/ngày (logic của bạn)
    const pickedSlots = parseCSV(q.timeOfDay)
      .map(id => SLOT_RANGES[id])
      .filter(Boolean) as Array<[number,number]>;
    const pickedDays  = normalizeDays(parseCSV(q.days));

    const filtered = (pickedSlots.length || pickedDays.length)
      ? preItems.filter(t => matchAvailability(t.weeklyAvailability, pickedDays, pickedSlots))
      : preItems;

    // ===== Gom thống kê rating & count cho toàn bộ danh sách đã lọc =====
    const ids = filtered.map(t => t.id);
    const statMap = new Map<number, { avg: number; cnt: number }>();
    if (ids.length) {
      const stats = await this.reviewRepo.createQueryBuilder('r')
        .select('r.teacherId', 'teacherId')
        .addSelect('AVG(r.rating)', 'avg')
        .addSelect('COUNT(*)', 'cnt')
        .where('r.teacherId IN (:...ids)', { ids })
        .groupBy('r.teacherId')
        .getRawMany<{ teacherId: string; avg: string; cnt: string }>();

      for (const s of stats) {
        statMap.set(Number(s.teacherId), { avg: Number(s.avg), cnt: Number(s.cnt) });
      }
    }

    // ===== Nếu sort theo rating_desc -> sort theo AVG thực =====
    if (q.sort === 'rating_desc') {
      filtered.sort((a, b) => {
        const aAvg = statMap.get(a.id)?.avg ?? (a as any).rating ?? 0;
        const bAvg = statMap.get(b.id)?.avg ?? (b as any).rating ?? 0;
        if (bAvg !== aAvg) return bAvg - aAvg;
        const aCnt = statMap.get(a.id)?.cnt ?? (a as any).reviewsCount ?? 0;
        const bCnt = statMap.get(b.id)?.cnt ?? (b as any).reviewsCount ?? 0;
        return bCnt - aCnt; // tie-break: nhiều nhận xét hơn đứng trước
      });
    }

    // ===== Phân trang sau khi sort/lọc =====
    const total = filtered.length;
    const start = (page - 1) * limit;
    const pageItems = filtered.slice(start, start + limit);

    // Gắn trường tính toán vào item trả về
    const items = pageItems.map(t => {
      const s = statMap.get(t.id);
      return {
        ...t,
        ratingAverage: s?.avg ?? (t as any).rating ?? 0,
        reviewsCountComputed: s?.cnt ?? (t as any).reviewsCount ?? 0,
      };
    });

    return {
      items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(Math.max(0, total) / limit) || 1,
      },
    };
  }

  async getPublicProfile(id: number) {
    const teacher = await this.repo.findOne({ where: { id } });
    if (!teacher) throw new NotFoundException('Teacher not found');
  
    const { avg, count } = await this.reviewRepo
      .createQueryBuilder('r')
      .select('AVG(r.rating)', 'avg')
      .addSelect('COUNT(*)', 'count')
      .where('r.teacherId = :id', { id })
      .getRawOne<{ avg: string; count: string }>();
  
    // const reviews = await this.reviewRepo.find({
    //   where: { teacher: { id } },
    //   relations: ['user'],
    //   order: { createdAt: 'DESC' },
    //   take: 20, // lấy 20 cái gần nhất
    // });
  
    return {
      teacher,
      rating: { average: Number(avg ?? 0), total: Number(count ?? 0) },
      // reviews,
    };
  }
}
