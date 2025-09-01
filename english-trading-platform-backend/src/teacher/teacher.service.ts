// src/teacher/teacher.service.ts
import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Teacher } from './teacher.entity';
import { QueryTeachersDto, CreateTeacherDto, UpdateTeacherDto } from './dto';
import { Review } from 'src/review/review.entity';
import { DAY_KEYS, DayKey, SLOT_RANGES } from './utils/availability-consts';
import { policyFor, toHHMM, toMin, parseCSV, normalizeDays } from './utils/availability-helpers';
import { matchAvailability } from './utils/match-availability';
import { PACKAGE_DISCOUNTS, PACKAGE_HOURS } from '../order/utils/order-consts';
import { PricingService } from 'src/pricing/pricing.service';
import { TeacherSlot } from './teacher-slot.entity';
import { TeacherSlotReservation } from './teacher-slot-reservation.entity';


@Injectable()
export class TeachersService {
  constructor(
    @InjectRepository(Teacher) private readonly repo: Repository<Teacher>,
    @InjectRepository(Review) private readonly reviewRepo: Repository<Review>,
    @InjectRepository(TeacherSlot) private readonly slotRepo: Repository<TeacherSlot>,
    private readonly pricing: PricingService,
     private readonly dataSource: DataSource,    
) {}

  // Chuyển ['mon 07:30-08:30', ...] -> { day,start,end }[]
  private parseKeys(keys: string[]) {
    return keys.map((k) => {
      const [day, range] = k.trim().split(/\s+/);
      const [start, end] = range.split('-');
      return { day, start, end };
    });
  }

  /** Chuẩn hóa + validate weeklyAvailability theo policy */
  private sanitizeWeeklyAvailability(
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

  /** Tách thành block = slot phút */
  private expandToSlots(
    weekly: any,
    lessonLengthMinutes = 45,
  ): Record<DayKey, Array<{ start: string; end: string }>> {
    const { slot } = policyFor(lessonLengthMinutes);
    const result: Record<DayKey, Array<{start: string; end: string}>> = {
      mon: [], tue: [], wed: [], thu: [], fri: [], sat: [], sun: [],
    };
    if (!weekly) return result;

    for (const day of DAY_KEYS) {
      const arr = weekly[day] || [];
      for (const it of arr) {
        let s = toMin(it.start), e = toMin(it.end);
        if (s < 0 || e < 0 || s >= e) continue;
        for (let m = s; m + slot <= e; m += slot) {
          result[day].push({ start: toHHMM(m), end: toHHMM(m + slot) });
        }
      }
    }
    return result;
  }

  /** Đồng bộ bảng teacher_slots từ weeklyAvailability đã chuẩn hóa */
  private async syncSlotsFromWeekly(teacherId: number, weekly: Record<DayKey, Array<{ start: string; end: string }>>, lessonLengthMinutes: number) {
    const { slot } = policyFor(lessonLengthMinutes);
    const want: Array<{ day: DayKey; start: string; end: string }> = [];
    for (const day of DAY_KEYS) {
      (weekly?.[day] || []).forEach(({ start, end }) => {
        let s = toMin(start), e = toMin(end);
        for (let m = s; m + slot <= e; m += slot) {
          want.push({ day, start: toHHMM(m), end: toHHMM(m + slot) });
        }
      });
    }

    // Lấy slot hiện có
    const exists = await this.slotRepo.find({ where: { teacherId } });
    const key = (d:string,s:string,e:string) => `${d} ${s}-${e}`;
    const existsMap = new Map(exists.map(s => [key(s.day, s.start, s.end), s]));

    // Active/insert theo "want"
    const keepKeys: string[] = [];
    for (const w of want) {
      const k = key(w.day, w.start, w.end);
      keepKeys.push(k);
      const cur = existsMap.get(k);
      if (cur) {
        if (!cur.isActive) { cur.isActive = true; await this.slotRepo.save(cur); }
      } else {
        const row = this.slotRepo.create({ teacherId, day: w.day, start: w.start, end: w.end, isActive: true, capacity: 1, reservedCount: 0 });
        await this.slotRepo.save(row);
      }
    }

    // Deactivate các slot thừa (không xóa để giữ reservedCount history)
    const toDisable = exists.filter(s => !keepKeys.includes(key(s.day, s.start, s.end)) && s.isActive);
    if (toDisable.length) {
      await this.slotRepo.save(toDisable.map(s => ({ ...s, isActive: false })));
    }
  }

  async create(dto: CreateTeacherDto) {
    const lessonLen = dto['lessonLengthMinutes'] ?? 45;
    const weekly = this.sanitizeWeeklyAvailability(dto.weeklyAvailability, lessonLen);

    const t = this.repo.create({
      ...dto,
      lessonLengthMinutes: lessonLen,
      weeklyAvailability: weekly,
      rating: dto?.['rating'] ?? 0,
      reviewsCount: dto?.['reviewsCount'] ?? 0,
    });
    const saved = await this.repo.save(t);
    await this.syncSlotsFromWeekly(saved.id, weekly, lessonLen);
    return saved;
  }

  async update(id: number, dto: UpdateTeacherDto) {
    const cur = await this.repo.preload({ id, ...dto });
    if (!cur) throw new NotFoundException('Teacher not found');
    const lessonLen = dto['lessonLengthMinutes'] ?? cur.lessonLengthMinutes ?? 45;
    if (dto.weeklyAvailability !== undefined) {
      cur.weeklyAvailability = this.sanitizeWeeklyAvailability(dto.weeklyAvailability, lessonLen);
    }
    if (dto['lessonLengthMinutes'] !== undefined) cur.lessonLengthMinutes = lessonLen;
    const saved = await this.repo.save(cur);
    if (dto.weeklyAvailability !== undefined || dto['lessonLengthMinutes'] !== undefined) {
      await this.syncSlotsFromWeekly(saved.id, saved.weeklyAvailability, lessonLen);
    }
    return saved;
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

  // getPublicProfile: trả thêm slots + policy
  async getPublicProfile(id: number) {
    const teacher = await this.repo.findOne({ where: { id } });
    if (!teacher) throw new NotFoundException('Teacher not found');

    const { avg, count } = await this.reviewRepo
      .createQueryBuilder('r')
      .select('AVG(r.rating)', 'avg')
      .addSelect('COUNT(*)', 'count')
      .where('r.teacherId = :id', { id })
      .getRawOne<{ avg: string; count: string }>();

    const { slot, gridStep } = policyFor(teacher.lessonLengthMinutes);
    const weeklyAvailabilitySlots = this.expandToSlots(
      teacher.weeklyAvailability,
      teacher.lessonLengthMinutes,
    );

    return {
      teacher: {
        ...teacher,
        weeklyAvailabilitySlots,    // 
        slotMinutes: slot,          // 60 | 90 | 120
        gridStepMinutes: gridStep,  // 60 | 30 | 60
      },
      rating: { average: Number(avg ?? 0), total: Number(count ?? 0) },
    };
  }

  // Lấy thông tin giảng viên cho order, bao gồm policy + discount
  private roundMoney(n: number) { return Math.round((n + Number.EPSILON) * 100) / 100; }

  // Đếm tổng slot/tuần từ weeklyAvailabilitySlots (đã tách block theo slot)
  private countWeeklySlots(
    weekly: Record<DayKey, Array<{ start: string; end: string }>>
  ): number {
    if (!weekly) return 0;
    return (['mon','tue','wed','thu','fri','sat','sun'] as DayKey[])
      .reduce((s, d) => s + (weekly[d]?.length || 0), 0);
  }

  /** API cho trang đặt gói — thêm bookedKeys */
  async getOrderOptions(id: number) {
    const teacher = await this.repo.findOne({ where: { id } });
    if (!teacher) throw new NotFoundException('Teacher not found');

    const { slot } = policyFor(teacher.lessonLengthMinutes);
    const weeklyAvailabilitySlots = this.expandToSlots(teacher.weeklyAvailability, teacher.lessonLengthMinutes);

    // lấy các slot đã full (reservedCount >= capacity & isActive)
    const full = await this.slotRepo.find({
      where: { teacherId: id, isActive: true },
    });
    const bookedKeys = full
      .filter(s => s.reservedCount >= s.capacity)
      .map(s => `${s.day} ${s.start}-${s.end}`);

    const capacityPerWeek = this.countWeeklySlots(weeklyAvailabilitySlots);
    const maxLessonsPerWeek = Math.min(5, capacityPerWeek);

    const effMin = teacher.lessonLengthMinutes;
    const hourlyRate = Number(teacher.hourlyRate || 0);
    const basePerLesson = hourlyRate * (effMin / 60);

    const plans = await this.pricing.getActivePlans();
    const packages = plans.map(p => {
      const lessons = Math.ceil((p.hours * 60) / effMin);
      const gross = Math.round((lessons * basePerLesson + Number.EPSILON) * 100) / 100;
      const discountPct = p.discountPct ?? 0;
      const discount = Math.round((gross * discountPct + Number.EPSILON) * 100) / 100;
      const total = Math.round((gross - discount + Number.EPSILON) * 100) / 100;
      const pricePerLesson = Math.round((total / lessons + Number.EPSILON) * 100) / 100;
      return { hours: p.hours, lessons, gross, discountPct, discount, total, pricePerLesson };
    });

    return {
      teacher: {
        id: teacher.id,
        fullName: teacher.fullName,
        avatarUrl: teacher.avatarUrl,
        country: teacher.country,
        hourlyRate: hourlyRate,
        lessonLengthMinutes: teacher.lessonLengthMinutes,
      },
      slotMinutes: slot,
      weeklyAvailabilitySlots,
      bookedKeys,               
      capacityPerWeek,
      maxLessonsPerWeek,
      pricePerLessonBase: Math.round((basePerLesson + Number.EPSILON) * 100) / 100,
      packages,
    };
  }
  
  /** Giữ chỗ atomically, idempotent theo enrollmentId (MySQL) */
  async tryReserveSlots(teacherId: number, keys: string[], enrollmentId?: number) {
    if (!keys?.length) return;

    const slots = this.parseKeys(keys);
    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();
    try {
      // (A) ledger: idempotent (INSERT IGNORE / ON DUPLICATE KEY DO NOTHING)
      if (enrollmentId) {
        await qr.manager
          .createQueryBuilder()
          .insert()
          .into(TeacherSlotReservation)
          .values(slots.map(s => ({
            enrollmentId,
            teacherId,
            day: s.day,
            start: s.start,
            end: s.end,
          })))
          .orIgnore() // MySQL
          .execute();
      }

      // (B) tăng reservedCount nếu còn chỗ
      for (const s of slots) {
        const res = await qr.manager
          .createQueryBuilder()
          .update(TeacherSlot)
          .set({ reservedCount: () => 'reservedCount + 1' })
          .where(
            'teacherId = :tid AND day = :day AND start = :start AND `end` = :end AND isActive = true AND reservedCount < capacity',
            { tid: teacherId, day: s.day, start: s.start, end: s.end },
          )
          .execute();

        if (!res.affected) {
          // rollback ledger item (nếu có)
          if (enrollmentId) {
            await qr.manager.delete(TeacherSlotReservation, {
              enrollmentId, teacherId, day: s.day, start: s.start, end: s.end,
            });
          }
          throw new ConflictException(`Slot ${s.day} ${s.start}-${s.end} đã đầy hoặc không tồn tại.`);
        }
      }

      await qr.commitTransaction();
    } catch (e) {
      await qr.rollbackTransaction();
      throw e;
    } finally {
      await qr.release();
    }
  }

  /** Nhả chỗ; nếu có enrollmentId -> chỉ nhả khi ledger có record (idempotent) */
  async releaseSlots(teacherId: number, keys: string[], enrollmentId?: number) {
    if (!keys?.length) return;

    const slots = this.parseKeys(keys);
    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();
    try {
      for (const s of slots) {
        if (enrollmentId) {
          const existed = await qr.manager.findOne(TeacherSlotReservation, {
            where: { enrollmentId, teacherId, day: s.day, start: s.start, end: s.end },
            lock: { mode: 'pessimistic_write' },
          });
          if (!existed) continue; // chưa/không giữ -> bỏ qua
          await qr.manager.delete(TeacherSlotReservation, { id: existed.id });
        }

        await qr.manager
          .createQueryBuilder()
          .update(TeacherSlot)
          .set({ reservedCount: () => 'GREATEST(reservedCount - 1, 0)' })
          .where('teacherId = :tid AND day = :day AND start = :start AND `end` = :end', {
            tid: teacherId, day: s.day, start: s.start, end: s.end,
          })
          .execute();
      }
      await qr.commitTransaction();
    } catch (e) {
      await qr.rollbackTransaction();
      throw e;
    } finally {
      await qr.release();
    }
  }
}
