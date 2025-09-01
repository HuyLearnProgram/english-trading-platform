// src/teacher/teacher.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Teacher } from './teacher.entity';
import { TeachersService } from './teacher.service';
import { TeachersController } from './teacher.controller';
import { Review } from 'src/review/review.entity';
import { Lesson } from '../lesson/lesson.entity';
import { Enrollment } from '../enrollment/enrollment.entity';
import { RefundRequest } from '../refund/refund-request.entity';
import { TeacherMetricsService } from './teacher-metrics.service';
import { MetricThresholdsModule } from 'src/config/metric-thresholds.module'; // <-- module ngưỡng
import { PricingModule } from 'src/pricing/pricing.module';
import { TeacherSlot } from './teacher-slot.entity';
import { TeacherSlotReservation } from './teacher-slot-reservation.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Teacher, Review, Lesson, Enrollment, 
      RefundRequest, TeacherSlot, TeacherSlotReservation]),
    MetricThresholdsModule,
    PricingModule, 
  ],
  providers: [TeachersService, TeacherMetricsService],
  controllers: [TeachersController],
  exports: [TeachersService],
})
export class TeacherModule {}
