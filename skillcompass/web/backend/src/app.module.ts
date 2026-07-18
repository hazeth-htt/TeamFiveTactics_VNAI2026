import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { ChatModule } from './chat/chat.module';
import { RoadmapModule } from './roadmap/roadmap.module';
import { ScraperModule } from './modules/scraper/scraper.module';

@Module({
  imports: [UserModule, ChatModule, RoadmapModule, ScraperModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
