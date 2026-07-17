export declare class RoadmapService {
    generateRoadmap(userProfile: any): Promise<{
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
