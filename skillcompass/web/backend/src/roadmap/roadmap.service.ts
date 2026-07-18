import { Injectable } from '@nestjs/common';

@Injectable()
export class RoadmapService {
  async generateRoadmap(userProfile: any) {
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
}
