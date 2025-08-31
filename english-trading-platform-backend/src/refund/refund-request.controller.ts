// src/refund/refund-request.controller.ts
import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { RefundRequestsService } from './refund-request.service';
import { CreateRefundDto, UpdateRefundDto, QueryRefundsDto } from './dto';

@Controller('refund-requests')
export class RefundRequestsController {
  constructor(private readonly svc: RefundRequestsService) {}

  @Get()
  findAll(@Query() q: QueryRefundsDto) { return this.svc.findAll(q); }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) { return this.svc.findOne(id); }
  
  @Post()
  create(@Body() dto: CreateRefundDto) { return this.svc.create(dto); }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateRefundDto) { return this.svc.update(id, dto); }

  @Delete(':id')
  delete(@Param('id', ParseIntPipe) id: number) { return this.svc.delete(id); }
}
