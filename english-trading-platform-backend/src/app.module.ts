// src/app.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RedisModule } from '@nestjs-modules/ioredis';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AdminController } from './admin/admin.controller';
import { AdminService } from './admin/admin.service';
import { AdminModule } from './admin/admin.module';
import { ReviewModule } from './review/review.module';
import { TeacherModule } from './teacher/teacher.module';
import { BlogModule } from './blog/blog.module';
import { BlogCategoryModule } from './blog-category/blog-category.module';
import { ConsultationModule } from './consultation/consultation.module';
import { LessonModule } from './lesson/lesson.module';
import { EnrollmentModule } from './enrollment/enrollment.module';
import { RefundRequestModule } from './refund/refund-request.module';
import { MetricThresholdsModule } from './config/metric-thresholds.module';
import { NotificationModule } from './notification/notification.module';
import { MailModule } from './mail/mail.module';
import { PricingModule } from './pricing/pricing.module';
import { PaymentsModule } from './payments/payments.module';
import { ScheduleModule } from './student/schedule.module';
import { StudentModule } from './student/student.module';

@Module({
  imports: [
    ConfigModule.forRoot({ 
      isGlobal: true, 
      envFilePath: '.env',
    }),
    RedisModule.forRootAsync({
      useFactory: (cs: ConfigService) => ({
        type: 'single',
        options: {
          host: cs.get('REDIS_HOST'),
          port: Number(cs.get('REDIS_PORT')),
          password: cs.get('REDIS_PASSWORD') || undefined,
          family: 4,                         // ép IPv4, tránh rắc rối IPv6
          lazyConnect: true,
          enableReadyCheck: true,
          maxRetriesPerRequest: null,       // tránh lỗi ở các lệnh subscribe/stream dài
          reconnectOnError: (err) => {      // reconnect khi READONLY, MOVED, v.v.
            const msg = err?.message || '';
            return /READONLY|ETIMEDOUT|ECONNRESET/.test(msg);
          },
          connectTimeout: 10_000,
          retryStrategy: (times) => Math.min(times * 200, 2000),
        },
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        
        return {
          type: 'mysql',
          host: configService.get<string>('DATABASE_HOST'),
          port: configService.get<number>('DATABASE_PORT'),
          username: configService.get<string>('DATABASE_USERNAME'),
          password: configService.get<string>('DATABASE_PASSWORD'),
          database: configService.get<string>('DATABASE_NAME'),
          entities: [__dirname + '/**/*.entity{.ts,.js}'],
          synchronize: true,
        };
      },
      inject: [ConfigService],
    }),
    AuthModule,
    AdminModule,
    UsersModule,
    ReviewModule,
    TeacherModule,
    BlogModule,
    BlogCategoryModule,
    ConsultationModule,
    LessonModule,
    EnrollmentModule,
    RefundRequestModule,
    MetricThresholdsModule,
    NotificationModule,
    MailModule,
    PricingModule,
    PaymentsModule,
    ScheduleModule,
    StudentModule,
  ],
  controllers: [AppController, AdminController],
  providers: [AppService, AdminService],
})
export class AppModule {}
