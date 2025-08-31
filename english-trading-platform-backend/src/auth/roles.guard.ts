// src/auth/roles.guard.ts
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from './roles.decorator';
import { UserRole } from 'src/users/user.entity';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    // Ưu tiên metadata ở handler, fallback class
    const required = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);

    // Route không yêu cầu role => pass
    if (!required || required.length === 0) return true;

    const { user } = ctx.switchToHttp().getRequest<{ user?: { role?: UserRole } }>();
    if (!user || !user.role) return false; // JwtAuthGuard nên chạy trước, phòng hờ thì trả false

    // (Tuỳ chọn) admin được qua hết
    if (user.role === 'admin') return true;

    const ok = required.includes(user.role);
    if (!ok) {
      throw new ForbiddenException('Insufficient role');
    }
    return true;
  }
}
