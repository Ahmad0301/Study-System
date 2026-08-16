import { Controller, Get, UseGuards, Req, Query } from '@nestjs/common';
import { Request } from 'express';
import { ActivitiesService } from './activities.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('activities')
@UseGuards(JwtAuthGuard)
export class ActivitiesController {
  constructor(private readonly activitiesService: ActivitiesService) {}

  @Get('recent')
  async getRecent(@Req() req: Request, @Query('limit') limit?: string) {
    const userId = (req as any).user.sub;
    const parsedLimit = limit ? parseInt(limit, 10) : 5;
    return this.activitiesService.getRecent(userId, parsedLimit);
  }

  @Get('weekly-stats')
  async getWeeklyStats(@Req() req: Request) {
    const userId = (req as any).user.sub;
    return this.activitiesService.getWeeklyStudyStats(userId);
  }
}
