// src/config/metric-thresholds.controller.ts
import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { MetricThresholdsService } from './metric-thresholds.service';
import { CreateMetricThresholdDto } from './dto/create-metric-threshold.dto';
import { UpdateMetricThresholdDto } from './dto/update-metric-threshold.dto';

@Controller('metric-thresholds')
export class MetricThresholdsController {
  constructor(private readonly svc: MetricThresholdsService) {}

  @Get()
  findAll() { return this.svc.findAll(); }

  @Get('config')
  getConfig() { return this.svc.getConfig(); }

  @Get(':key')
  findOne(@Param('key') key: string) { return this.svc.findOneByKey(key); }

  @Post()
  create(@Body() dto: CreateMetricThresholdDto) { return this.svc.create(dto); }

  // upsert hàng loạt (seed/chỉnh nhanh)
  @Post('upsert-many')
  upsertMany(@Body() items: CreateMetricThresholdDto[]) { return this.svc.upsertMany(items); }

  @Patch(':key')
  update(@Param('key') key: string, @Body() dto: UpdateMetricThresholdDto) {
    return this.svc.updateByKey(key, dto);
  }

  @Delete(':key')
  remove(@Param('key') key: string) { return this.svc.removeByKey(key); }
}
