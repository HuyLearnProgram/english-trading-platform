// src/admin/admin.controller.ts
import { Controller, Get } from '@nestjs/common';
import { AdminService } from './admin.service';

@Controller('admin')

export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('users')
  findAllUsers() {
    return this.adminService.findAllUsers();
  }

}
