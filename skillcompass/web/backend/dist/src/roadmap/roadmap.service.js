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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var RoadmapService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoadmapService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const adapter_pg_1 = require("@prisma/adapter-pg");
const pg_1 = require("pg");
const axios_1 = __importDefault(require("axios"));
let RoadmapService = RoadmapService_1 = class RoadmapService {
    logger = new common_1.Logger(RoadmapService_1.name);
    prisma;
    roadmapUrl = 'http://localhost:8003/generate-roadmap';
    constructor() {
        const pool = new pg_1.Pool({ connectionString: process.env.DATABASE_URL });
        const adapter = new adapter_pg_1.PrismaPg(pool);
        this.prisma = new client_1.PrismaClient({ adapter });
    }
    async generateRoadmap(input) {
        let sessionId = '';
        if (typeof input === 'string') {
            sessionId = input;
        }
        else if (input && typeof input === 'object') {
            sessionId = input.session_id || input.sessionId || (input.user_profile && typeof input.user_profile === 'object' ? input.user_profile.session_id : '') || (typeof input.user_profile === 'string' ? input.user_profile : '');
        }
        if (!sessionId) {
            this.logger.error('Session ID is missing in roadmap request.');
            throw new common_1.HttpException('Session ID là bắt buộc.', common_1.HttpStatus.BAD_REQUEST);
        }
        this.logger.log(`Generating roadmap for session: ${sessionId}`);
        const userProfile = await this.prisma.userProfile.findUnique({
            where: { session_id: sessionId },
        });
        if (!userProfile) {
            this.logger.error(`No user profile found for session: ${sessionId}`);
            throw new common_1.HttpException('Không tìm thấy hồ sơ năng lực của học sinh cho phiên này.', common_1.HttpStatus.NOT_FOUND);
        }
        const messages = await this.prisma.conversationMessage.findMany({
            where: { session_id: sessionId },
            orderBy: { created_at: 'asc' },
        });
        const conversationHistory = messages.map((msg) => ({
            role: msg.role,
            content: msg.content,
        }));
        const traitScores = userProfile.trait_scores || {};
        const marketExpectations = traitScores.market_expectations || {};
        const cleanCoreScores = {};
        const defaultTraits = [
            'adaptability_resilience',
            'analytical_thinking',
            'continuous_learning',
            'creativity_innovation',
            'critical_thinking',
            'effective_communication',
            'problem_solving',
            'responsibility_autonomy',
            'team_collaboration',
            'work_ethics_integrity',
        ];
        for (const trait of defaultTraits) {
            cleanCoreScores[trait] = typeof traitScores[trait] === 'number' ? traitScores[trait] : 5.0;
        }
        const preferredLocations = marketExpectations.preferred_locations || [];
        const expectedSalaryMin = marketExpectations.expected_salary_min || 0;
        const willingToRelocate = marketExpectations.willing_to_relocate || false;
        const familySupport = marketExpectations.family_support || null;
        const healthIssues = marketExpectations.health_issues || null;
        const payload = {
            user_profile: {
                core_scores: cleanCoreScores,
                market_expectations: {
                    preferred_locations: preferredLocations,
                    expected_salary_min: expectedSalaryMin,
                    willing_to_relocate: willingToRelocate,
                    family_support: familySupport,
                    health_issues: healthIssues,
                },
            },
            conversation_history: conversationHistory,
        };
        try {
            this.logger.log(`Calling Python Roadmap API at ${this.roadmapUrl}...`);
            const response = await axios_1.default.post(this.roadmapUrl, payload);
            const roadmapData = response.data;
            await this.prisma.roadmap.upsert({
                where: { session_id: sessionId },
                update: {
                    user_profile_summary: roadmapData.user_profile_summary,
                    paths: roadmapData.paths,
                    disclaimer: roadmapData.disclaimer,
                    generated_at: new Date(),
                },
                create: {
                    session_id: sessionId,
                    user_profile_summary: roadmapData.user_profile_summary,
                    paths: roadmapData.paths,
                    disclaimer: roadmapData.disclaimer,
                },
            });
            this.logger.log(`Successfully generated and saved roadmap for session: ${sessionId}`);
            return roadmapData;
        }
        catch (error) {
            this.logger.error(`Failed to generate roadmap from Python service: ${error.message}`);
            this.logger.warn('Returning mock fallback roadmap due to API failure.');
            return {
                user_profile_summary: 'Học sinh có thiên hướng tư duy phân tích và kỹ thuật cao (Fallback).',
                paths: [
                    {
                        path_id: 1,
                        track_type: 'academic',
                        career_track: 'Kỹ sư giải pháp công nghệ (Fallback)',
                        match_score: 85,
                        why_it_fits: 'Phù hợp với thế mạnh tư duy độc lập và phân tích điện tử.',
                        role_progression: [
                            { level: 'Entry', title: 'Junior Engineer', description: 'Hỗ trợ kỹ thuật' }
                        ],
                        skill_tree: { fundamentals: ['Lập trình'], core_technologies: ['API'], advanced_skills: ['Cloud'] },
                    },
                ],
                disclaimer: 'Đây là lộ trình dự phòng (Fallback) khi dịch vụ gặp gián đoạn.',
            };
        }
    }
};
exports.RoadmapService = RoadmapService;
exports.RoadmapService = RoadmapService = RoadmapService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], RoadmapService);
//# sourceMappingURL=roadmap.service.js.map