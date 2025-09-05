// src/student/student.service.ts
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { Student } from './student.entity';
import { QueryStudentDto, UpdateStudentDto } from './dto';

type Parsed = { w: number; start: number; end: number; raw: string };

@Injectable()
export class StudentService {
  constructor(
    @InjectRepository(Student) private readonly repo: Repository<Student>,
  ) {}

  private pad(n: number) { return n < 10 ? `0${n}` : `${n}`; }

  private parse(slots: string[], defaultLen = 45): Parsed[] {
    const W: Record<string, number> = { mon:0,tue:1,wed:2,thu:3,fri:4,sat:5,sun:6 };
    const out: Parsed[] = [];
    for (const s of slots || []) {
      // chấp nhận H:mm hoặc HH:mm
      const m = String(s).trim().toLowerCase()
        .match(/^(mon|tue|wed|thu|fri|sat|sun)\s+(\d{1,2}):(\d{2})(?:-(\d{1,2}):(\d{2}))?$/);
      if (!m) continue;
      const w = W[m[1]];
      const sh = Math.min(23, Math.max(0, +m[2]));
      const sm = Math.min(59, Math.max(0, +m[3]));
      const hasEnd = m[4] != null;
      const eh = hasEnd ? Math.min(23, Math.max(0, +m[4])) : sh;
      const em = hasEnd ? Math.min(59, Math.max(0, +m[5])) : sm + defaultLen;

      const sMin = sh * 60 + sm;
      const eMin = hasEnd ? (eh * 60 + em) : (sMin + defaultLen);

      // lưu raw dạng chuẩn HH:mm-HH:mm (để trả ra cho FE dễ đọc)
      const pad = (n:number)=> (n<10?`0${n}`:`${n}`);
      const raw = `${m[1]} ${pad(sh)}:${pad(sm)}-${pad(Math.floor(eMin/60)%24)}:${pad(eMin%60)}`;

      out.push({ w, start: sMin, end: eMin, raw });
    }
    return out;
  }

  /** Trả về true nếu 2 interval (phút) overlap */
  private overlap(aStart: number, aEnd: number, bStart: number, bEnd: number) {
    return Math.max(aStart, bStart) < Math.min(aEnd, bEnd);
  }

  async findAll(q: QueryStudentDto) {
    const page = Math.max(1, Number(q.page || 1));
    const limit = Math.min(100, Math.max(1, Number(q.limit || 20)));
    const where = q.q ? [
      { fullName: ILike(`%${q.q}%`) },
      { country: ILike(`%${q.q}%`) },
      { timezone: ILike(`%${q.q}%`) },
    ] : undefined;

    const [items, total] = await this.repo.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        // loại bỏ trường nặng
        id: true, userId: true, fullName: true, dob: true, gender: true,
        country: true, timezone: true, createdAt: true, updatedAt: true,
      }
    });

    return { items, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findOneProfile(id: number) {
    const st = await this.repo.findOne({ where: { id } });
    if (!st) throw new NotFoundException('Student not found');
    // TRIM: loại calendar, preferredSlots
    const { calendar, preferredSlots, ...profile } = st;
    return profile;
  }

  async update(id: number, dto: UpdateStudentDto) {
    const st = await this.repo.findOne({ where: { id } });
    if (!st) throw new NotFoundException('Student not found');

    // Chỉ cho phép cập nhật các field profile — không cho sửa preferredSlots/calendar trực tiếp
    if (dto.fullName !== undefined) st.fullName = dto.fullName;
    if (dto.dob !== undefined) st.dob = dto.dob;
    if (dto.gender !== undefined) st.gender = dto.gender;
    if (dto.country !== undefined) st.country = dto.country;
    if (dto.timezone !== undefined) st.timezone = dto.timezone;

    await this.repo.save(st);
    const { calendar, preferredSlots, ...profile } = st;
    return profile;
  }

  /**
   * Kiểm tra trùng slot: so sánh slots input với Student.preferredSlots (đang active).
   * Trả về danh sách conflict: inputSlot xung đột với existingSlot.
   */
  async checkSlotConflicts(studentIdOrUserId: number, inputSlots: string[]) {
    // thử theo id trước
    let st = await this.repo.findOne({ where: { id: studentIdOrUserId } });
    // fallback theo userId (để FE có thể truyền user.id)
    if (!st) st = await this.repo.findOne({ where: { userId: studentIdOrUserId } });
    if (!st) throw new NotFoundException('Student not found');

    const existing = this.parse(st.preferredSlots || []);
    const incoming = this.parse(inputSlots || []);

    const conflicts: Array<{ input: string; with: string; weekday: number }> = [];

    for (const i of incoming) {
      for (const e of existing) {
        if (i.w !== e.w) continue;
        if (this.overlap(i.start, i.end, e.start, e.end)) {
          conflicts.push({ input: i.raw, with: e.raw, weekday: i.w });
          break;
        }
      }
    }

    return { hasConflict: conflicts.length > 0, conflicts };
  }
}
