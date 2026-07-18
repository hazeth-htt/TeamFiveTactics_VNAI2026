"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoadmapService = void 0;
const common_1 = require("@nestjs/common");
let RoadmapService = class RoadmapService {
    async generateRoadmap(userProfile) {
        return {
            user_profile_summary: 'Mock user profile summary based on input traits',
            paths: [
                {
                    path_id: 1,
                    track_type: 'vocational',
                    career_track: 'Mock Vocational Career Track',
                    match_score: 90,
                    why_it_fits: 'Based on your strong practical interest scores',
                    role_progression: ['Junior technician', 'Lead specialist'],
                    skill_tree: {},
                },
                {
                    path_id: 2,
                    track_type: 'it',
                    career_track: 'Mock IT Career Track',
                    match_score: 80,
                    why_it_fits: 'Matches IT and technical scores',
                    role_progression: ['Junior developer', 'Tech Lead'],
                    skill_tree: {},
                },
            ],
            disclaimer: 'This is a mock career roadmap disclaimer.',
        };
    }
};
exports.RoadmapService = RoadmapService;
exports.RoadmapService = RoadmapService = __decorate([
    (0, common_1.Injectable)()
], RoadmapService);
//# sourceMappingURL=roadmap.service.js.map