import { Controller, Get, Post, Body, Query, Patch, Param, ParseIntPipe, BadRequestException } from '@nestjs/common';
import { NotificationsService } from './notification.service';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly svc: NotificationsService) {}

  @Post()
  create(@Body() dto: { userId: number; title: string; body?: string; type?: string }) {
    return this.svc.create(dto.userId, dto.title, dto.body, (dto.type as any) ?? 'system');
  }

  @Get()
  list(@Query('userId') userId?: string) {
    const where = userId ? { userId: Number(userId) } : {};
    return this.svc.list(where as any);
  }

  @Patch(':id/read')
  markRead(@Param('id', ParseIntPipe) id: number) {
    return this.svc.markRead(id);
  }

  @Get('unread-count')
  async unreadCount(@Query('userId', ParseIntPipe) userId: number) {
    if (!userId) throw new BadRequestException('userId is required');
    const count = await this.svc.countUnread(userId);
    return { count };
  }
}
