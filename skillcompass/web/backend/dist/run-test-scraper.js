"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./src/app.module");
const auto_scraper_service_1 = require("./src/modules/scraper/services/auto-scraper/auto-scraper.service");
const dotenv = __importStar(require("dotenv"));
dotenv.config();
async function bootstrap() {
    console.log('Bootstrapping NestJS application context...');
    try {
        const app = await core_1.NestFactory.createApplicationContext(app_module_1.AppModule);
        const scraper = app.get(auto_scraper_service_1.AutoScraperService);
        const sourceArg = (process.argv[2] || 'topcv');
        const limitArg = process.argv[3] ? parseInt(process.argv[3], 10) : 2;
        console.log(`Starting scraper (limit ${limitArg} per category, source: ${sourceArg})...`);
        const results = await scraper.startScraping(limitArg, sourceArg);
        console.log('====================================');
        console.log('Scraping completed successfully!');
        console.log('Results Summary:', JSON.stringify(results, null, 2));
        console.log('====================================');
        await app.close();
        process.exit(0);
    }
    catch (err) {
        console.error('Error during scraper execution:', err);
        process.exit(1);
    }
}
bootstrap();
//# sourceMappingURL=run-test-scraper.js.map