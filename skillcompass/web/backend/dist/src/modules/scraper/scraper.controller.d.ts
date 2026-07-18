import { AutoScraperService } from './services/auto-scraper/auto-scraper.service';
export declare class ScraperController {
    private readonly autoScraperService;
    constructor(autoScraperService: AutoScraperService);
    triggerScraper(bodyLimit?: number, queryLimit?: number, bodySource?: 'all' | 'timviec365' | 'topcv', querySource?: 'all' | 'timviec365' | 'topcv'): Promise<{
        success: boolean;
        message: string;
        results: any;
    }>;
}
