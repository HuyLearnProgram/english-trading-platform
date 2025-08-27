import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Teacher } from './teacher.entity';
import { TeachersService } from './teacher.service';
import { TeachersController } from './teacher.controller';
import { Review } from 'src/review/review.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Teacher, Review])],
  providers: [TeachersService],
  controllers: [TeachersController],
  exports: [TeachersService],
})
export class TeacherModule {}
