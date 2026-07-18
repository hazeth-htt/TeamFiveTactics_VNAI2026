import { AiExtractionService } from '../ai-extraction/ai-extraction.service';
export declare class AutoScraperService {
    private readonly aiExtractionService;
    private readonly logger;
    private getSitemapsForSource;
    private readonly keywords;
    constructor(aiExtractionService: AiExtractionService);
    startScraping(limit?: number, source?: 'all' | 'timviec365' | 'topcv'): Promise<any>;
    private categorizeJob;
    private fetchHtml;
}
