import { Controller, Post, Body, Query, Res, HttpStatus } from '@nestjs/common';
import { AutoScraperService } from './services/auto-scraper/auto-scraper.service';

@Controller('scraper')
export class ScraperController {
  constructor(private readonly autoScraperService: AutoScraperService) {}

  @Post('trigger')
  async triggerScraper(
    @Body('limit') bodyLimit?: number,
    @Query('limit') queryLimit?: number,
    @Body('source') bodySource?: 'all' | 'timviec365' | 'topcv',
    @Query('source') querySource?: 'all' | 'timviec365' | 'topcv',
  ) {
    const limit = bodyLimit ?? queryLimit ?? 2;
    const source = bodySource ?? querySource ?? 'all';
    
    // Run asynchronously to prevent API timeout on client side,
    // or run synchronously for simple testing. Let's run it and return results.
    const results = await this.autoScraperService.startScraping(limit, source);
    return {
      success: true,
      message: 'Scraping process finished.',
      results,
    };
  }
}
