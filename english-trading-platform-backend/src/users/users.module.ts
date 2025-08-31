// src/users/users.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { MailModule } from 'src/mail/mail.module';

@Module({
  imports: [TypeOrmModule.forFeature([User]),MailModule],
  providers: [UsersService],
  controllers: [UsersController],
  exports: [UsersService, TypeOrmModule],
})
export class UsersModule {}
