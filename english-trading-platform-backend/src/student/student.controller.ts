// src/student/student.controller.ts
import {
  BadRequestException, Controller, Get, Post, Param, ParseIntPipe, Body, ForbiddenException,
  Query,
  Patch
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Enrollment } from 'src/enrollment/enrollment.entity';
import { StudentScheduleService } from './student-schedule.service';
import { StudentService } from './student.service';
import { CheckSlotsDto, QueryStudentDto, UpdateStudentDto } from './dto';

@Controller('students')
export class StudentController {
  constructor(
    private readonly svc: StudentService,
    private readonly schedule: StudentScheduleService,
    @InjectRepository(Enrollment) private readonly enrollRepo: Repository<Enrollment>,
  ) {}

  @Get()
  findAll(@Query() q: QueryStudentDto) {
    return this.svc.findAll(q);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.svc.findOneProfile(id);     // profile đã trim
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateStudentDto
  ) {
    return this.svc.update(id, dto);
  }

  /** API tối ưu để kiểm tra xung đột slot (không trả calendar) */
  @Post(':id/check-slots')
  checkSlots(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: CheckSlotsDto
  ) {
    return this.svc.checkSlotConflicts(id, body?.slots || []);
  }

  /** Lấy tất cả entries lịch của 1 học viên */
  @Get(':studentId/calendar')
  getCalendar(@Param('studentId', ParseIntPipe) studentId: number) {
    return this.schedule.getCalendar(studentId);
  }

  /** Lấy lịch của 1 enrollment cụ thể thuộc học viên */
  @Get(':studentId/calendar/enrollments/:enrollmentId')
  getCalendarEntry(
    @Param('studentId', ParseIntPipe) studentId: number,
    @Param('enrollmentId', ParseIntPipe) enrollmentId: number,
  ) {
    return this.schedule.getCalendarEntry(studentId, enrollmentId);
  }

  /**
   * (Tùy chọn) Regenerate lịch cho 1 enrollment đã paid của học viên.
   * Body: { paidAt?: string(ISO), offsetDays?: number }
   */
  @Post(':studentId/calendar/enrollments/:enrollmentId/generate')
  async regenerate(
    @Param('studentId', ParseIntPipe) studentId: number,
    @Param('enrollmentId', ParseIntPipe) enrollmentId: number,
    @Body() body: { paidAt?: string; offsetDays?: number },
  ) {
    const en = await this.enrollRepo.findOne({ where: { id: enrollmentId } });
    if (!en) throw new BadRequestException('Enrollment not found');
    if (en.studentId !== studentId) throw new ForbiddenException('Enrollment not owned by student');

    const paidAt = body?.paidAt ? new Date(body.paidAt) : undefined;
    return this.schedule.generateForEnrollment(enrollmentId, paidAt, body?.offsetDays);
  }
}
