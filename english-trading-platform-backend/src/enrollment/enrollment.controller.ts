// src/enrollment/enrollment.controller.ts
import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query, Req } from '@nestjs/common';
import { EnrollmentsService } from './enrollment.service';
import { CreateEnrollmentDto, UpdateEnrollmentDto, QueryEnrollmentsDto } from './dto';

@Controller('enrollments')
export class EnrollmentsController {
  constructor(private readonly svc: EnrollmentsService) {}

  @Get()
  findAll(@Query() q: QueryEnrollmentsDto) { return this.svc.findAll(q); }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) { return this.svc.findOne(id); }

  /** Admin/manual create (snapshot ngay) */
  @Post()
  create(@Body() dto: CreateEnrollmentDto) { return this.svc.create(dto); }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateEnrollmentDto) { return this.svc.update(id, dto); }

  @Delete(':id')
  delete(@Param('id', ParseIntPipe) id: number) { return this.svc.delete(id); }

  /** Học sinh mua gói (snapshot + status pending) */
  @Post('purchase')
  async purchase(@Body() dto: CreateEnrollmentDto, @Req() req: any) {
    const studentId = req.user?.id ?? dto.studentId; // nếu có JWT thì lấy từ req.user
    return this.svc.purchase(dto, studentId);
  }

  /** Xác nhận thanh toán & giữ chỗ (dùng preferredSlots đã lưu hoặc override) */
  @Post(':id/confirm')
  async confirm(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { slots?: string[] }, // optional override
  ) {
    return this.svc.confirmAndReserve(id, body?.slots);
  }

  /** Hủy đơn -> nhả chỗ */
  @Post(':id/cancel')
  cancel(@Param('id', ParseIntPipe) id: number) {
    return this.svc.cancelAndRelease(id);
  }

  /** Refund -> nhả chỗ */
  @Post(':id/refund')
  refund(@Param('id', ParseIntPipe) id: number) {
    return this.svc.refundAndRelease(id);
  }
}
