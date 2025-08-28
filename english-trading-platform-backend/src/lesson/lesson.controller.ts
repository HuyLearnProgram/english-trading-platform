// src/lesson/lesson.controller.ts
import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { LessonsService } from './lesson.service';
import { CreateLessonDto, UpdateLessonDto, QueryLessonsDto } from './dto';


@Controller('lessons')
export class LessonsController {
  constructor(private readonly svc: LessonsService) {}

  @Get()
  findAll(@Query() q: QueryLessonsDto) { return this.svc.findAll(q); }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) { return this.svc.findOne(id); }

  @Post()
  create(@Body() dto: CreateLessonDto) { return this.svc.create(dto); }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateLessonDto) { return this.svc.update(id, dto); }

  @Delete(':id')
  delete(@Param('id', ParseIntPipe) id: number) { return this.svc.delete(id); }
}
