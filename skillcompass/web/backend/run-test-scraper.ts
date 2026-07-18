import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { AutoScraperService } from './src/modules/scraper/services/auto-scraper/auto-scraper.service';
import * as dotenv from 'dotenv';

// Load env variables
dotenv.config();

async function bootstrap() {
  console.log('Bootstrapping NestJS application context...');
  try {
    const app = await NestFactory.createApplicationContext(AppModule);
    const scraper = app.get(AutoScraperService);
    
    const sourceArg = (process.argv[2] || 'topcv') as 'all' | 'timviec365' | 'topcv';
    const limitArg = process.argv[3] ? parseInt(process.argv[3], 10) : 2;
    console.log(`Starting scraper (limit ${limitArg} per category, source: ${sourceArg})...`);
    const results = await scraper.startScraping(limitArg, sourceArg);
    
    console.log('====================================');
    console.log('Scraping completed successfully!');
    console.log('Results Summary:', JSON.stringify(results, null, 2));
    console.log('====================================');
    
    await app.close();
    process.exit(0);
  } catch (err) {
    console.error('Error during scraper execution:', err);
    process.exit(1);
  }
}

bootstrap();
