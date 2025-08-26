// src/app.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
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

@Module({
  imports: [
    ConfigModule.forRoot({ 
      isGlobal: true, 
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        console.log('DATABASE_HOST:', configService.get<string>('DATABASE_HOST'));
        console.log('DATABASE_PORT:', configService.get<number>('DATABASE_PORT'));
        console.log('DATABASE_USERNAME:', configService.get<string>('DATABASE_USERNAME'));
        console.log('DATABASE_PASSWORD:', configService.get<string>('DATABASE_PASSWORD'));
        console.log('DATABASE_NAME:', configService.get<string>('DATABASE_NAME'));
        
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
  ],
  controllers: [AppController, AdminController],
  providers: [AppService, AdminService],
})
export class AppModule {}
