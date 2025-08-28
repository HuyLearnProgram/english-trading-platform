// src/refund/refund-request.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RefundRequest } from './refund-request.entity';
import { RefundRequestsService } from './refund-request.service';
import { RefundRequestsController } from './refund-request.controller';

@Module({
  imports: [TypeOrmModule.forFeature([RefundRequest])],
  providers: [RefundRequestsService],
  controllers: [RefundRequestsController],
  exports: [RefundRequestsService],
})
export class RefundRequestModule {}
