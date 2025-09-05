// src/google/google-calendar.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GoogleAccount } from './google-account.entity';
import { GoogleCalendarService } from './google-calendar.service';
import { GoogleCalendarController } from './google-calendar.controller';
import { JwtModule } from '@nestjs/jwt';
import { StudentModule } from 'src/student/student.module';
import { ScheduleModule } from 'src/student/schedule.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([GoogleAccount]),
    JwtModule.register({}),           // dùng secret sẵn có từ ConfigService
    StudentModule,
    ScheduleModule,                   // để dùng StudentScheduleService
  ],
  controllers: [GoogleCalendarController],
  providers: [GoogleCalendarService],
})
export class GoogleCalendarModule {}
