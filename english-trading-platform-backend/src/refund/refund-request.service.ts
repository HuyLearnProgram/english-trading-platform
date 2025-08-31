// src/refund/refund-request.service.ts
import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { RefundRequest } from './refund-request.entity';
import { CreateRefundDto, UpdateRefundDto, QueryRefundsDto } from './dto';
import { NotificationsService } from 'src/notification/notification.service';


const canTransit = (from: 'pending'|'approved'|'rejected', to: 'pending'|'approved'|'rejected') => {
  if (from === to) return true;
  if (from === 'pending') return to === 'approved' || to === 'rejected';
  return false;
};
@Injectable()
export class RefundRequestsService {
  constructor(
    @InjectRepository(RefundRequest) private readonly repo: Repository<RefundRequest>,
    private readonly notifications: NotificationsService,
  ) {}

  async create(dto: CreateRefundDto) {
    const entity = this.repo.create({
      teacherId: dto.teacherId,
      studentId: dto.studentId,
      eligible: dto.eligible,
      status: dto.status,
      reason: dto.reason ?? null,
    });
    return this.repo.save(entity);
  }

  async update(id: number, dto: UpdateRefundDto) {
    const cur = await this.repo.findOne({ where: { id } });
    if (!cur) throw new NotFoundException('Refund request not found');

    // validate transition
    if (dto.status) {
      const from = cur.status as 'pending'|'approved'|'rejected';
      const to   = dto.status as 'pending'|'approved'|'rejected';
      if (!canTransit(from, to)) {
        throw new ForbiddenException(`Không thể chuyển từ: ${from} → ${to}. Chỉ được cập nhật 'pending' → 'approved'|'rejected'.`);
      }
      // reject bắt buộc có reason
      if (to === 'rejected' && !('reason' in dto) && !cur.reason) {
        throw new BadRequestException('Cần nhập lý do từ chối khi cập nhật trạng thái thành rejected');
      }
      cur.status = to as any;
    }

    if (dto.teacherId != null) cur.teacherId = dto.teacherId;
    if (dto.studentId != null) cur.studentId = dto.studentId;
    if (dto.eligible != null) cur.eligible = dto.eligible;
    if (dto.status != null) cur.status = dto.status as any;
    if (dto.reason !== undefined) cur.reason = dto.reason ?? null;

    const saved = await this.repo.save(cur);

    // === BẮN NOTIFICATION theo kết quả duyệt ===
    // studentId == userId (yêu cầu của bạn)
    if (dto.status === 'approved') {
      await this.notifications.create(
        saved.studentId,
        'Yêu cầu hoàn phí đã được DUYỆT',
        `Yêu cầu hoàn phí #${saved.id} đã được phê duyệt.`,
        'refund'
      );
    }
    if (dto.status === 'rejected') {
      const reason = dto.reason ?? saved.reason ?? '';
      await this.notifications.create(
        saved.studentId,
        'Yêu cầu hoàn phí đã bị TỪ CHỐI',
        `Yêu cầu hoàn phí #${saved.id} đã bị từ chối.${reason ? `\nLý do: ${reason}` : ''}`,
        'refund'
      );
    }

    return saved;
  }

  async delete(id: number) {
    const cur = await this.repo.findOne({ where: { id } });
    if (!cur) throw new NotFoundException('Refund request not found');
    await this.repo.remove(cur);
    return { deleted: true };
  }

  async findOne(id: number) {
    const cur = await this.repo.findOne({ where: { id } });
    if (!cur) throw new NotFoundException('Refund request not found');
    return cur;
  }

  async findAll(q: QueryRefundsDto) {
    const page = Math.max(1, q.page ?? 1);
    const limit = Math.min(100, Math.max(1, q.limit ?? 20));

    const where: FindOptionsWhere<RefundRequest> = {};
    if (q.teacherId != null) where.teacherId = q.teacherId;
    if (q.studentId != null) where.studentId = q.studentId;
    if (q.status) where.status = q.status;
    if (q.eligible != null) where.eligible = q.eligible === 'true';
    if (q.reason) where.reason = q.reason;

    const [items, total] = await this.repo.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { items, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }
}
