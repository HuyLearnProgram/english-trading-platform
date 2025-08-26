import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { ConsultationService } from './consultation.service';
import { CreateConsultationDto, QueryConsultationDto, UpdateConsultationDto } from './dto';

@Controller('consultations')
export class ConsultationController {
  constructor(private readonly svc: ConsultationService) {}

  /** FE: form đăng ký */
  @Post()
  create(@Body() dto: CreateConsultationDto) {
    return this.svc.create(dto);
  }

  /** Admin: danh sách + lọc + phân trang */
  @Get()
  list(@Query() q: QueryConsultationDto) {
    return this.svc.findAll(q);
  }

  /** Admin: chi tiết */
  @Get(':id')
  get(@Param('id', ParseIntPipe) id: number) {
    return this.svc.findOne(id);
  }

  /** Admin: cập nhật trạng thái/ghi chú/assign... */
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateConsultationDto) {
    return this.svc.update(id, dto);
  }

  /** (tùy chọn) Admin: xóa */
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.svc.remove(id);
  }
}
