// src/config/metric-thresholds.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MetricThreshold } from './metric-threshold.entity';
import { MetricThresholdsService } from './metric-thresholds.service';
import { MetricThresholdsController } from './metric-thresholds.controller';

@Module({
  imports: [TypeOrmModule.forFeature([MetricThreshold])],
  providers: [MetricThresholdsService],
  controllers: [MetricThresholdsController],
  exports: [MetricThresholdsService],
})
export class MetricThresholdsModule {}
