import { Controller, Post, Body } from '@nestjs/common';
import { RoadmapService } from './roadmap.service';

@Controller('api/career')
export class RoadmapController {
  constructor(private readonly roadmapService: RoadmapService) {}

  @Post('roadmap')
  async createRoadmap(
    @Body() body: { user_profile: any },
  ) {
    return this.roadmapService.generateRoadmap(body.user_profile);
  }
}
