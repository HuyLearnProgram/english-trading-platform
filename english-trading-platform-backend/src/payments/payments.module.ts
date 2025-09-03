import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Enrollment } from 'src/enrollment/enrollment.entity';
import { TeacherModule } from 'src/teacher/teacher.module';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([Enrollment]),
    TeacherModule,
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService],
})
export class PaymentsModule {}
