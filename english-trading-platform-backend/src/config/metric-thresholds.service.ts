// src/config/metric-thresholds.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { MetricThreshold } from './metric-threshold.entity';
import { CreateMetricThresholdDto } from './dto/create-metric-threshold.dto';
import { UpdateMetricThresholdDto } from './dto/update-metric-threshold.dto';

@Injectable()
export class MetricThresholdsService {
  constructor(
    @InjectRepository(MetricThreshold) private repo: Repository<MetricThreshold>,
  ) {}

  // ---- Defaults (fallback khi DB chưa có) ----
  private DEFAULTS = {
    thresholds: {
      repeat_up:  [0.30, 0.15],
      ontime_up:  [0.95, 0.90],
      cancel_down:[0.05, 0.15],
      refund_down:[0.03, 0.08],
      renewal_up: [0.25, 0.15],
    },
    windows: { activityDays: 90, outcomeDays: 180 },
  };

  private cache: { data: any, at: number } | null = null;
  private TTL = 60_000; // 60s

  async create(dto: CreateMetricThresholdDto) {
    const row = this.repo.create({
      key: dto.key,
      direction: dto.direction,
      good: dto.good ?? null,
      warn: dto.warn ?? null,
      windowDays: dto.windowDays ?? null,
      updated_by: dto.updated_by ?? null,
    });
    return this.repo.save(row);
  }

  async upsertMany(items: CreateMetricThresholdDto[]) {
    // MySQL upsert theo key
    const rows = items.map(i => this.repo.create({
      key: i.key,
      direction: i.direction,
      good: i.good ?? null,
      warn: i.warn ?? null,
      windowDays: i.windowDays ?? null,
      updated_by: i.updated_by ?? null,
    }));
    await this.repo
      .createQueryBuilder()
      .insert()
      .into(MetricThreshold)
      .values(rows)
      .orUpdate(['direction','good','warn','windowDays','updated_by'], ['key'])
      .execute();
    this.cache = null;
    return { upserted: rows.length };
  }

  findAll() { return this.repo.find({ order: { key: 'ASC' } }); }

  async findOneByKey(key: string) {
    const row = await this.repo.findOne({ where: { key } });
    if (!row) throw new NotFoundException('metric_threshold not found');
    return row;
  }

  async updateByKey(key: string, dto: UpdateMetricThresholdDto) {
    const row = await this.findOneByKey(key);
    Object.assign(row, {
      key: dto.key ?? row.key,
      direction: dto.direction ?? row.direction,
      good: dto.good ?? row.good,
      warn: dto.warn ?? row.warn,
      windowDays: dto.windowDays ?? row.windowDays,
      updated_by: dto.updated_by ?? row.updated_by,
    });
    const saved = await this.repo.save(row);
    this.cache = null;
    return saved;
  }

  async removeByKey(key: string) {
    const row = await this.findOneByKey(key);
    await this.repo.remove(row);
    this.cache = null;
    return { deleted: true };
  }

  // ---- Config gom cho FE/metrics ----
  async getConfig() {
    const now = Date.now();
    if (this.cache && now - this.cache.at < this.TTL) return this.cache.data;

    const rows = await this.repo.find();
    const cfg = JSON.parse(JSON.stringify(this.DEFAULTS));

    for (const r of rows) {
      if (r.direction === 'window' && r.windowDays != null) {
        if (r.key === 'activityDays') cfg.windows.activityDays = r.windowDays;
        if (r.key === 'outcomeDays')  cfg.windows.outcomeDays  = r.windowDays;
        continue;
      }
      if (r.direction === 'up' || r.direction === 'down') {
        if (r.good != null && r.warn != null) {
          cfg.thresholds[r.key] = [Number(r.good), Number(r.warn)];
        }
      }
    }
    this.cache = { data: cfg, at: now };
    return cfg;
  }
}
