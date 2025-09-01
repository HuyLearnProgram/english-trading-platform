// src/enrollment/enrollment.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Enrollment } from './enrollment.entity';
import { EnrollmentsService } from './enrollment.service';
import { EnrollmentsController } from './enrollment.controller';
import { Teacher } from 'src/teacher/teacher.entity';
import { PricingModule } from 'src/pricing/pricing.module';
import { TeacherModule } from 'src/teacher/teacher.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Enrollment, Teacher]),
    PricingModule, TeacherModule
  ],
  providers: [EnrollmentsService],
  controllers: [EnrollmentsController],
  exports: [EnrollmentsService],
})
export class EnrollmentModule {}
