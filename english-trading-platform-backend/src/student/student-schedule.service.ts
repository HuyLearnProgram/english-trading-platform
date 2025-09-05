// src/schedule/student-schedule.service.ts
import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Enrollment } from 'src/enrollment/enrollment.entity';
import { Student } from 'src/student/student.entity';
import { ConfigService } from '@nestjs/config';
import { Teacher } from 'src/teacher/teacher.entity';

type ParsedSlot = {
  weekday: 'mon'|'tue'|'wed'|'thu'|'fri'|'sat'|'sun';
  wIdx: number;      // 0..6 (Mon..Sun)
  start: string;     // 'HH:mm'
  end: string;       // 'HH:mm'
};

type CalendarEvent = {
  lessonNo: number;
  date: string;      // YYYY-MM-DD (local theo timezone của HS)
  start: string;     // HH:mm (local)
  end: string;       // HH:mm (local)
  weekday: ParsedSlot['weekday'];
};

@Injectable()
export class StudentScheduleService {
  constructor(
    private readonly cfg: ConfigService,
    @InjectRepository(Enrollment) private readonly enrollRepo: Repository<Enrollment>,
    @InjectRepository(Student) private readonly studentRepo: Repository<Student>,
    @InjectRepository(Teacher)    private readonly teacherRepo: Repository<Teacher>,
  ) {}

  private weekdayMap: Record<string, ParsedSlot['weekday']> = {
    mon: 'mon', tue: 'tue', wed: 'wed', thu: 'thu', fri: 'fri', sat: 'sat', sun: 'sun',
  };
  private toWIdx(w: ParsedSlot['weekday']) {
    return { mon:0,tue:1,wed:2,thu:3,fri:4,sat:5,sun:6 }[w];
  }
  private pad(n: number) { return n < 10 ? `0${n}` : `${n}`; }

  private addDaysStr(dateStr: string, days: number) {
    const d = new Date(dateStr + 'T00:00:00Z'); // UTC baseline
    d.setUTCDate(d.getUTCDate() + days);
    return `${d.getUTCFullYear()}-${this.pad(d.getUTCMonth()+1)}-${this.pad(d.getUTCDate())}`;
  }
  private dayOfWeekMon0(dateStr: string) {
    // Mon=0..Sun=6
    const dowSun0 = new Date(dateStr + 'T00:00:00Z').getUTCDay(); // 0..6 (Sun..Sat)
    return (dowSun0 + 6) % 7;
  }

  private parseSlots(slots: string[], lessonLenMin: number): ParsedSlot[] {
    const out: ParsedSlot[] = [];
    for (const raw of slots || []) {
      // "mon 20:00-21:00" hoặc "mon 20:00" (tự tính end theo lessonLen)
      const m = String(raw).trim().toLowerCase().match(/^(mon|tue|wed|thu|fri|sat|sun)\s+(\d{2}:\d{2})(?:-(\d{2}:\d{2}))?$/);
      if (!m) continue;
      const wd = this.weekdayMap[m[1]];
      const start = m[2];
      let end = m[3];
      if (!end) {
        const [h, mi] = start.split(':').map(Number);
        const total = h * 60 + mi + lessonLenMin;
        const eh = Math.floor(total / 60) % 24;
        const em = total % 60;
        end = `${this.pad(eh)}:${this.pad(em)}`;
      }
      out.push({ weekday: wd, wIdx: this.toWIdx(wd), start, end });
    }
    // sắp xếp theo thứ trong tuần rồi theo giờ
    out.sort((a,b) => a.wIdx - b.wIdx || (a.start < b.start ? -1 : 1));
    return out;
  }

  /** Lấy YYYY-MM-DD theo timezone */
  private localDateStr(d: Date, tz: string) {
    return new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
  }
  /** Lấy HH:mm theo timezone (24h) */
  private localTimeStr(d: Date, tz: string) {
    return new Intl.DateTimeFormat('en-GB', { timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: false }).format(d);
  }
  /** Cộng phút cho Date */
  private addMinutes(d: Date, minutes: number) {
    return new Date(d.getTime() + minutes * 60_000);
  }

  /**
   * Tìm ngày đầu tiên cho 1 slot tại hoặc sau mốc earliest (date+time).
   * - Nếu cùng thứ và slot.start >= earliestTime -> dùng chính ngày đó.
   * - Ngược lại nhảy tới lần xuất hiện tiếp theo trong tuần.
   */
  private firstOnOrAfter(earliestDate: string, earliestTime: string, slot: ParsedSlot) {
    const eW = this.dayOfWeekMon0(earliestDate);
    let delta = (slot.wIdx - eW + 7) % 7; // 0..6
    if (delta === 0) {
      // cùng ngày: chỉ lấy hôm đó nếu giờ slot >= mốc thời gian
      if (slot.start < earliestTime) delta = 7;
    }
    return this.addDaysStr(earliestDate, delta);
  }

  /**
   * Sinh lịch (events) cho 1 enrollment và lưu vào student.calendar.entries.
   * - startOffsetDays: số ngày chờ sau khi thanh toán (mặc định 0 – cho phép cùng ngày)
   * - COURSE_START_MINUTES_BUFFER: buffer tối thiểu theo phút (mặc định 0)
   */
  async generateForEnrollment(enrollmentId: number, paidAt?: Date, startOffsetDays?: number) {
    const en = await this.enrollRepo.findOne({ where: { id: enrollmentId } });
    if (!en) throw new NotFoundException('Enrollment not found');
    if (en.status !== 'paid') throw new BadRequestException('Enrollment is not paid');
    if (!Array.isArray(en.preferredSlots) || en.preferredSlots.length === 0) {
      throw new BadRequestException('No preferred slots to generate schedule');
    }

    const student = await this.studentRepo.findOne({ where: { id: en.studentId } });
    if (!student) throw new NotFoundException('Student not found');
    const teacher = en.teacherId
      ? await this.teacherRepo.findOne({
          where: { id: en.teacherId },
          select: { id: true, fullName: true, avatarUrl: true },
        })
      : null;
    if (!teacher) throw new NotFoundException('Teacher not found');
    const tz = student.timezone || 'Asia/Ho_Chi_Minh';
    const lessonLen = en.lessonLengthMinutesSnapshot;
    const lessons = en.lessons;

    const parsed = this.parseSlots(en.preferredSlots, lessonLen);
    if (!parsed.length) throw new BadRequestException('Preferred slots format invalid');

    // ==== Tính mốc earliest (theo timezone HS) ====
    const cfgOffsetDays = Number(this.cfg.get('COURSE_START_OFFSET_DAYS') ?? 0); // trước đây là 1 — đổi mặc định thành 0
    const cfgBufferMin  = Number(this.cfg.get('COURSE_START_MINUTES_BUFFER') ?? 0);

    const base = paidAt ? new Date(paidAt) : new Date();
    const earliestAbs = this.addMinutes(base, (startOffsetDays ?? cfgOffsetDays) * 1440 + cfgBufferMin);

    const earliestDate = this.localDateStr(earliestAbs, tz); // YYYY-MM-DD
    const earliestTime = this.localTimeStr(earliestAbs, tz); // HH:mm

    // ==== Khởi tạo con trỏ cho từng slot bằng "lần xuất hiện đầu tiên >= earliest" ====
    type Cursor = ParsedSlot & { dateStr: string };
    const cursors: Cursor[] = parsed.map(s => ({
      ...s,
      dateStr: this.firstOnOrAfter(earliestDate, earliestTime, s),
    }));

    // ==== Rải N buổi theo thứ tự thời gian ====
    const events: CalendarEvent[] = [];
    let count = 0;

    while (count < lessons) {
      // slot gần nhất (so sánh YYYY-MM-DD + HH:mm là đủ)
      let bestIdx = 0;
      for (let i = 1; i < cursors.length; i++) {
        const a = cursors[i], b = cursors[bestIdx];
        const keyA = `${a.dateStr}T${a.start}`;
        const keyB = `${b.dateStr}T${b.start}`;
        if (keyA < keyB) bestIdx = i;
      }
      const cur = cursors[bestIdx];
      count += 1;
      events.push({
        lessonNo: count,
        date: cur.dateStr,
        start: cur.start,
        end: cur.end,
        weekday: cur.weekday,
      });
      // lần kế tiếp của slot này là sau đúng 7 ngày
      cur.dateStr = this.addDaysStr(cur.dateStr, 7);
    }

    const startDate = events[0].date;
    const endDate   = events[events.length - 1].date;

    // ==== Lưu vào student.calendar (replace entry cùng enrollmentId nếu có) ====
    const entry = {
      enrollmentId: en.id,
      teacherId: en.teacherId,
      teacherAvatarUrl: teacher?.avatarUrl || null,   
      teacherName: teacher?.fullName || null,
      timezone: tz,
      startDate,
      endDate,
      lessons,
      lessonLength: lessonLen,
      lessonsPerWeek: en.lessonsPerWeek,
      slots: en.preferredSlots,
      events,
      createdAt: new Date().toISOString(),
    };

    const cal = student.calendar?.entries ? [...student.calendar.entries] : [];
    const idx = cal.findIndex(e => e.enrollmentId === en.id);
    if (idx >= 0) cal.splice(idx, 1, entry); else cal.push(entry);

    student.calendar = { entries: cal };
    if (!student.preferredSlots?.length) student.preferredSlots = en.preferredSlots;

    await this.studentRepo.save(student);

    return {
      studentId: student.id,
      timezone: tz,
      startDate,
      endDate,
      totalEvents: events.length,
      events,
    };
  }

  async getCalendar(studentId: number) {
    const st = await this.studentRepo.findOne({ where: { id: studentId } });
    if (!st) throw new NotFoundException('Student not found');
    return {
      studentId,
      timezone: st.timezone || 'Asia/Ho_Chi_Minh',
      entries: st.calendar?.entries ?? [],
    };
  }

  async getCalendarEntry(studentId: number, enrollmentId: number) {
    const st = await this.studentRepo.findOne({ where: { id: studentId } });
    if (!st) throw new NotFoundException('Student not found');
    const entry = st.calendar?.entries?.find(e => e.enrollmentId === enrollmentId);
    if (!entry) throw new NotFoundException('Calendar entry not found');
    return { timezone: st.timezone || 'Asia/Ho_Chi_Minh', ...entry };
  }

  /** Lấy tất cả entries lịch của học viên theo userId */
  async getCalendarByUserId(userId: number) {
    const st = await this.studentRepo.findOne({ where: { userId } });
    if (!st) throw new NotFoundException('Student not found');

    return {
      studentId: st.id,
      timezone: st.timezone || 'Asia/Ho_Chi_Minh',
      entries: st.calendar?.entries ?? [],
    };
  }

  /** (tuỳ chọn) Lấy lịch 1 enrollment theo userId */
  async getCalendarEntryByUserId(userId: number, enrollmentId: number) {
    const st = await this.studentRepo.findOne({ where: { userId } });
    if (!st) throw new NotFoundException('Student not found');
    const entry = st.calendar?.entries?.find(e => e.enrollmentId === enrollmentId);
    if (!entry) throw new NotFoundException('Calendar entry not found');
    return { timezone: st.timezone || 'Asia/Ho_Chi_Minh', ...entry };
  }
}
