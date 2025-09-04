import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Enrollment } from 'src/enrollment/enrollment.entity';
import { TeacherModule } from 'src/teacher/teacher.module';
import { Teacher } from 'src/teacher/teacher.entity';
import { User } from 'src/users/user.entity';
import { Student } from 'src/student/student.entity';
import { MailModule } from 'src/mail/mail.module';
import { InvoiceService } from './invoice.service';
import { ScheduleModule } from 'src/student/schedule.module';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([Enrollment, Teacher, User, Student]),
    TeacherModule,
    MailModule,
    ScheduleModule,  
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService, InvoiceService],
})
export class PaymentsModule {}
