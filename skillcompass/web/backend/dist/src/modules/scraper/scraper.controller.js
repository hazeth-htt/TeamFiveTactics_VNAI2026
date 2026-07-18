"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScraperController = void 0;
const common_1 = require("@nestjs/common");
const auto_scraper_service_1 = require("./services/auto-scraper/auto-scraper.service");
let ScraperController = class ScraperController {
    autoScraperService;
    constructor(autoScraperService) {
        this.autoScraperService = autoScraperService;
    }
    async triggerScraper(bodyLimit, queryLimit, bodySource, querySource) {
        const limit = bodyLimit ?? queryLimit ?? 2;
        const source = bodySource ?? querySource ?? 'all';
        const results = await this.autoScraperService.startScraping(limit, source);
        return {
            success: true,
            message: 'Scraping process finished.',
            results,
        };
    }
};
exports.ScraperController = ScraperController;
__decorate([
    (0, common_1.Post)('trigger'),
    __param(0, (0, common_1.Body)('limit')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Body)('source')),
    __param(3, (0, common_1.Query)('source')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, String, String]),
    __metadata("design:returntype", Promise)
], ScraperController.prototype, "triggerScraper", null);
exports.ScraperController = ScraperController = __decorate([
    (0, common_1.Controller)('scraper'),
    __metadata("design:paramtypes", [auto_scraper_service_1.AutoScraperService])
], ScraperController);
//# sourceMappingURL=scraper.controller.js.map