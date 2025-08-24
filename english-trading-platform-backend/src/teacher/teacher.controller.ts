import { Body, Controller, Get, Param, ParseIntPipe, Post, Query, Patch, Delete } from '@nestjs/common';
import { TeachersService } from './teacher.service';
import { CreateTeacherDto, UpdateTeacherDto, QueryTeachersDto } from './dto';


@Controller('teachers')
export class TeachersController {
  constructor(private readonly service: TeachersService) {}

  @Get()
  findAll(@Query() q: QueryTeachersDto) {
    return this.service.findAll(q);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  // Admin seeding / tạm để tạo nhanh dữ liệu
  @Post()
  create(@Body() dto: CreateTeacherDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateTeacherDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
