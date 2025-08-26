import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Consultation } from './consultation.entity';
import { ConsultationService } from './consultation.service';
import { ConsultationController } from './consultation.controller';
import { Teacher } from '../teacher/teacher.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Consultation, Teacher])],
  providers: [ConsultationService],
  controllers: [ConsultationController],
  exports: [ConsultationService],
})
export class ConsultationModule {}
