import 'dotenv/config';
export declare class AiExtractionService {
    private readonly logger;
    private readonly prisma;
    private deepseekClient;
    private openaiClient;
    private llmModel;
    constructor();
    private initClients;
    extractAndSave(rawJob: any, category: string): Promise<void>;
    private buildPrompt;
    private syncToDatabase;
    private generateDeterministicVector;
    private generateMockStructuredData;
}
