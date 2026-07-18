import { Module } from '@nestjs/common';
import { ScraperController } from './scraper.controller';
import { AutoScraperService } from './services/auto-scraper/auto-scraper.service';
import { AiExtractionService } from './services/ai-extraction/ai-extraction.service';

@Module({
  controllers: [ScraperController],
  providers: [AutoScraperService, AiExtractionService]
})
export class ScraperModule {}
