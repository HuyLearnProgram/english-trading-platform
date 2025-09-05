// src/student/student.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Student } from './student.entity';
import { Enrollment } from 'src/enrollment/enrollment.entity';
import { StudentController } from './student.controller';
import { ScheduleModule } from './schedule.module';
import { StudentService } from './student.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Student, Enrollment]), 
    ScheduleModule
  ],
  controllers: [StudentController],
  providers: [StudentService],
  exports: [StudentService],
})
export class StudentModule {}
