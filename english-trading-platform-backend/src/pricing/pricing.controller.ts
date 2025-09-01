// src/pricing/pricing.controller.ts  (gắn guard role=admin tuỳ hệ thống auth)
import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { PricingService } from './pricing.service';

@Controller('admin/pricing-plans')
export class PricingController {
  constructor(private readonly svc: PricingService) {}

  @Get() list() { return this.svc.listAll(); }
  @Post() create(@Body() dto: any) { return this.svc.create(dto); }
  @Patch(':id') update(@Param('id', ParseIntPipe) id: number, @Body() dto: any) { return this.svc.update(id, dto); }
  @Delete(':id') remove(@Param('id', ParseIntPipe) id: number) { return this.svc.remove(id); }
}
