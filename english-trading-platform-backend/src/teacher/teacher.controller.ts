import { Body, Controller, Get, Param, ParseIntPipe, Post, Query, Patch, Delete } from '@nestjs/common';
import { TeachersService } from './teacher.service';
import { CreateTeacherDto, UpdateTeacherDto, QueryTeachersDto } from './dto';
import { TeacherMetricsService } from './teacher-metrics.service';
import { MetricThresholdsService } from 'src/config/metric-thresholds.service';


@Controller('teachers')
export class TeachersController {
  constructor(
    private readonly service: TeachersService,
    private readonly metrics: TeacherMetricsService,
    private readonly thresholds: MetricThresholdsService,
  ) {}

  @Get()
  findAll(@Query() q: QueryTeachersDto) {
    return this.service.findAll(q);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  // Admin seeding / tạm để tạo nhanh dữ liệu
  @Post()
  create(@Body() dto: CreateTeacherDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateTeacherDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
  @Get(':id/public')
  publicProfile(@Param('id', ParseIntPipe) id: number) {
    return this.service.getPublicProfile(id);
  }

  @Get(':id/metrics')
  async metricsForTeacher(@Param('id', ParseIntPipe) id: number) {
    const [m, cfg] = await Promise.all([
      this.metrics.getMetrics(id),
      this.thresholds.getConfig(),
    ]);
    return { ...m, windows: cfg.windows, thresholds: cfg.thresholds };
  }
}
