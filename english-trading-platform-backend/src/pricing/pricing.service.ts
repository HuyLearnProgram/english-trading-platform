// src/pricing/pricing.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PricingPlan } from './pricing-plan.entity';

@Injectable()
export class PricingService {
  constructor(@InjectRepository(PricingPlan) private readonly repo: Repository<PricingPlan>) {}

  getActivePlans() {
    return this.repo.find({ where: { isActive: true }, order: { sortOrder: 'ASC', hours: 'ASC' } });
  }

  // Admin:
  listAll() { return this.repo.find({ order: { sortOrder: 'ASC', hours: 'ASC' } }); }
  create(dto: Partial<PricingPlan>) { return this.repo.save(this.repo.create(dto)); }
  update(id: number, dto: Partial<PricingPlan>) { return this.repo.save({ id, ...dto }); }
  remove(id: number) { return this.repo.delete(id); }
}
