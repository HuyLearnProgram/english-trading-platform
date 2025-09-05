// src/schedule/schedule.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Enrollment } from 'src/enrollment/enrollment.entity';
import { Student } from 'src/student/student.entity';
import { StudentScheduleService } from './student-schedule.service';
import { Teacher } from 'src/teacher/teacher.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Enrollment, Student, Teacher])],
  providers: [StudentScheduleService],
  exports: [StudentScheduleService],
})
export class ScheduleModule {}
