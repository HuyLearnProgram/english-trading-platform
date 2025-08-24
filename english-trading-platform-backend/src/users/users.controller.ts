// src/users/users.controller.ts
import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from './user.entity';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  create(@Body() createUserDto: CreateUserDto): Promise<User> {
    console.log('Creating user:', createUserDto);
    return this.usersService.create(createUserDto);
  }

  @Get('email/:email')
  findByEmail(@Param('email') email: string): Promise<User> {
    console.log('GET /users/email/:email called with email:', email);
    return this.usersService.findByEmail(email);
  }

  @Get('id/:id')
  findById(@Param('id') id: number): Promise<User> {
    console.log('GET /users/id/:id called with id:', id);
    return this.usersService.findById(id);
  }
}
