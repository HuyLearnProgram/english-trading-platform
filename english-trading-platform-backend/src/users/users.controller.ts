// src/users/users.controller.ts
import { Controller, Post, Body, Get, Param, Patch, ParseIntPipe, Query } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto, QueryUsersDto, UpdateUserDto } from './dto';
import { User } from './user.entity';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  create(@Body() createUserDto: CreateUserDto): Promise<User> {
    return this.usersService.create(createUserDto);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserDto,
  ): Promise<User> {
    return this.usersService.update(id, dto);
  }

  @Get('email/:email')
  findByEmail(@Param('email') email: string): Promise<User> {
    return this.usersService.findByEmail(email);
  }

  @Get('id/:id')
  findById(@Param('id') id: number): Promise<User> {
    return this.usersService.findById(id);
  }

  @Get()
  list(@Query() q: QueryUsersDto) { return this.usersService.list(q); }

  @Patch(':id/lock')
  lock(
    @Param('id', ParseIntPipe) id: number,
    @Body('reason') reason: string,
  ) {
    return this.usersService.lockUser(id, String(reason || '').trim());
  }

  @Patch(':id/unlock')
  unlock(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.unlockUser(id);
  }
}
