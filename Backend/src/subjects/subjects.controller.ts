import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Request } from 'express';
import { SubjectsService } from './subjects.service';
import { CreateSubjectDto } from './dto/create-subject.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('subjects')
@UseGuards(JwtAuthGuard)
export class SubjectsController {
  constructor(private readonly subjectsService: SubjectsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Req() req: Request, @Body() dto: CreateSubjectDto) {
    const userId = (req as any).user.sub;
    return this.subjectsService.create(userId, dto);
  }

  @Get()
  findAll(@Req() req: Request) {
    const userId = (req as any).user.sub;
    return this.subjectsService.findAll(userId);
  }

  @Get('dashboard/stats')
  getStats(@Req() req: Request) {
    const userId = (req as any).user.sub;
    return this.subjectsService.getDashboardStats(userId);
  }

  @Get(':id')
  findOne(@Req() req: Request, @Param('id') id: string) {
    const userId = (req as any).user.sub;
    return this.subjectsService.findOne(userId, id);
  }

  @Put(':id')
  update(@Req() req: Request, @Param('id') id: string, @Body() dto: CreateSubjectDto) {
    const userId = (req as any).user.sub;
    return this.subjectsService.update(userId, id, dto);
  }

  @Delete(':id')
  remove(@Req() req: Request, @Param('id') id: string) {
    const userId = (req as any).user.sub;
    return this.subjectsService.remove(userId, id);
  }
}
