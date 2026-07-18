import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import axios from 'axios';

@Injectable()
export class RoadmapService {
  private readonly logger = new Logger(RoadmapService.name);
  private readonly prisma: PrismaClient;
  private getRoadmapUrl(): string {
    const raw = process.env.ROADMAP_SERVICE_URL || 'http://localhost:8003/generate-roadmap';
    return raw.endsWith('/generate-roadmap') ? raw : `${raw.replace(/\/+$/, '')}/generate-roadmap`;
  }

  constructor() {
    const connStr = process.env.DATABASE_URL || '';
    const pool = new Pool({
      connectionString: connStr,
      ssl: connStr.includes('sslmode=') || connStr.includes('neon.tech') ? { rejectUnauthorized: false } : undefined,
    });
    const adapter = new PrismaPg(pool);
    this.prisma = new PrismaClient({ adapter });
  }

  async generateRoadmap(input: any) {
    // Trích xuất sessionId từ input linh hoạt
    let sessionId = '';
    if (typeof input === 'string') {
      sessionId = input;
    } else if (input && typeof input === 'object') {
      sessionId = input.session_id || input.sessionId || (input.user_profile && typeof input.user_profile === 'object' ? input.user_profile.session_id : '') || (typeof input.user_profile === 'string' ? input.user_profile : '');
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!sessionId || !uuidRegex.test(sessionId)) {
      this.logger.error(`Invalid session ID format: ${sessionId}`);
      throw new HttpException('Session ID phải đúng định dạng UUID v4.', HttpStatus.BAD_REQUEST);
    }

    this.logger.log(`Generating roadmap for session: ${sessionId}`);

    // 1. Lấy UserProfile từ DB
    const userProfile = await this.prisma.userProfile.findUnique({
      where: { session_id: sessionId },
    });

    if (!userProfile) {
      this.logger.error(`No user profile found for session: ${sessionId}`);
      throw new HttpException(
        'Không tìm thấy hồ sơ năng lực của học sinh cho phiên này.',
        HttpStatus.NOT_FOUND,
      );
    }

    // 2. Lấy lịch sử hội thoại từ DB
    const messages = await this.prisma.conversationMessage.findMany({
      where: { session_id: sessionId },
      orderBy: { created_at: 'asc' },
    });

    const conversationHistory = messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    // 3. Chuẩn bị payload gửi cho Agent 3
    const traitScores = userProfile.trait_scores as Record<string, any> || {};
    const marketExpectations = traitScores.market_expectations || {};
    
    const cleanCoreScores: Record<string, number> = {};
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

    // 4. Gọi Python Roadmap Microservice
    try {
      const targetUrl = this.getRoadmapUrl();
      this.logger.log(`Calling Python Roadmap API at ${targetUrl}...`);
      const response = await axios.post(targetUrl, payload);

      const roadmapData = response.data;

      // 5. Lưu kết quả Roadmap vào PostgreSQL
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
    } catch (error) {
      this.logger.error(`Failed to generate roadmap from Python service: ${error.message}`);
      
      // Fallback mock nếu Python service bị lỗi/chưa bật
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
}
