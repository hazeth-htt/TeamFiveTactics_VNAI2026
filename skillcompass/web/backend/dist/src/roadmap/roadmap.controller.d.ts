import { RoadmapService } from './roadmap.service';
export declare class RoadmapController {
    private readonly roadmapService;
    constructor(roadmapService: RoadmapService);
    createRoadmap(body: {
        user_profile: any;
    }): Promise<{
        user_profile_summary: string;
        paths: {
            path_id: number;
            track_type: string;
            career_track: string;
            match_score: number;
            why_it_fits: string;
            role_progression: string[];
            skill_tree: {};
        }[];
        disclaimer: string;
    }>;
}
