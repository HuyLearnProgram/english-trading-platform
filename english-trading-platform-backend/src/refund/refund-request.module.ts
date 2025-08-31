// src/refund/refund-request.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RefundRequest } from './refund-request.entity';
import { RefundRequestsService } from './refund-request.service';
import { RefundRequestsController } from './refund-request.controller';
import { NotificationModule } from 'src/notification/notification.module';

@Module({
  imports: [TypeOrmModule.forFeature([RefundRequest]),
  NotificationModule],
  providers: [RefundRequestsService],
  controllers: [RefundRequestsController],
  exports: [RefundRequestsService],
})
export class RefundRequestModule {}
