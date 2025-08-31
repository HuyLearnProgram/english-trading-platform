import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import { Notification, NotificationType } from './notification.entity';

@Injectable()
export class NotificationsService {
  constructor(@InjectRepository(Notification) private readonly repo: Repository<Notification>) {}

  create(userId: number, title: string, body?: string | null, type: NotificationType = 'system') {
    const n = this.repo.create({ userId, title, body: body ?? null, type });
    return this.repo.save(n);
  }

  list(where: FindOptionsWhere<Notification>) {
    return this.repo.find({ where, order: { createdAt: 'DESC' } });
  }

  markRead(id: number) {
    return this.repo.update({ id }, { read: true });
  }
  async countUnread(userId: number) {
    return this.repo.count({ where: { userId, read: false } });
  }
}
