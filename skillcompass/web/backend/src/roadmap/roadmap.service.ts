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
      // Kèm trait_scores để FE hiển thị đủ 10 năng lực cốt lõi
      return { ...roadmapData, trait_scores: cleanCoreScores };
    } catch (error) {
      this.logger.error(`Failed to generate roadmap from Python service: ${error.message}`);
      
      // Fallback mock nếu Python service bị lỗi/chưa bật
      this.logger.warn('Returning mock fallback roadmap due to API failure.');

      // Tính match_score từ điểm thực tế (thang 0-10 → 0-100%)
      const avgScore = (keys: string[], weights?: number[]) => {
        const vals = keys.map((k, i) => {
          const s = cleanCoreScores[k] || 5.0;
          return weights ? s * (weights[i] || 1) : s;
        });
        const total = weights ? weights.reduce((a, b) => a + b, 0) : keys.length;
        const weighted = vals.reduce((a, b) => a + b, 0);
        return Math.round((weighted / total) * 10); // scale lên 0-100
      };

      const swScore = avgScore(
        ['analytical_thinking', 'problem_solving', 'critical_thinking', 'continuous_learning'],
        [1.5, 1.5, 1, 1]
      );
      const daScore = avgScore(
        ['analytical_thinking', 'critical_thinking', 'effective_communication'],
        [2, 1.5, 0.5]
      );
      const qaScore = avgScore(
        ['responsibility_autonomy', 'work_ethics_integrity', 'problem_solving'],
        [1.5, 1, 1]
      );

      return {
        user_profile_summary: 'Học sinh có thiên hướng tư duy phân tích và kỹ thuật cao.',
        trait_scores: cleanCoreScores,
        paths: [
          {
            path_id: 1,
            track_type: 'academic',
            career_track: 'Kỹ sư phần mềm',
            match_score: swScore,
            why_it_fits: 'Phù hợp với thế mạnh tư duy độc lập và kỹ năng phân tích logic.',
            role_progression: [
              { level: 'Junior', title: 'Junior Software Engineer', description: 'Xây dựng tính năng và kiểm thử' },
              { level: 'Mid', title: 'Software Engineer', description: 'Thiết kế module và tối ưu hệ thống' },
              { level: 'Senior', title: 'Tech Lead', description: 'Dẫn dắt kỹ thuật và mentoring' },
            ],
            skill_tree: { fundamentals: ['Thuật toán', 'Cấu trúc dữ liệu', 'Git'], core_technologies: ['Python/TypeScript', 'REST API', 'SQL'], advanced_skills: ['Cloud AWS/GCP', 'Microservices', 'CI/CD'] },
          },
          {
            path_id: 2,
            track_type: 'vocational',
            career_track: 'Nhà phân tích dữ liệu (Data Analyst)',
            match_score: daScore,
            why_it_fits: 'Phù hợp với khả năng tư duy số liệu và nhận diện xu hướng.',
            role_progression: [
              { level: 'Junior', title: 'Junior Data Analyst', description: 'Trực quan hóa dữ liệu và báo cáo' },
              { level: 'Mid', title: 'Data Analyst', description: 'Phân tích A/B test và xây dựng dashboard' },
              { level: 'Senior', title: 'Senior Data Analyst / BI Lead', description: 'Định hướng chiến lược dữ liệu' },
            ],
            skill_tree: { fundamentals: ['SQL', 'Excel/Google Sheets', 'Thống kê cơ bản'], core_technologies: ['Python Pandas', 'Power BI / Tableau', 'Google Analytics'], advanced_skills: ['Machine Learning cơ bản', 'Data Pipeline', 'Looker Studio'] },
          },
          {
            path_id: 3,
            track_type: 'vocational',
            career_track: 'Kỹ sư kiểm thử phần mềm (QA Engineer)',
            match_score: qaScore,
            why_it_fits: 'Tương thích với khả năng chú ý đến chi tiết và tư duy hệ thống.',
            role_progression: [
              { level: 'Junior', title: 'QA Tester', description: 'Viết test case và kiểm thử thủ công' },
              { level: 'Mid', title: 'QA Engineer', description: 'Tự động hóa kiểm thử với Selenium/Playwright' },
              { level: 'Senior', title: 'QA Lead / SDET', description: 'Xây dựng framework kiểm thử toàn diện' },
            ],
            skill_tree: { fundamentals: ['Test Case Design', 'Bug Reporting', 'Agile/Scrum'], core_technologies: ['Selenium / Playwright', 'Postman', 'JIRA'], advanced_skills: ['CI/CD Testing', 'Performance Testing', 'Security Testing'] },
          },
        ],
        disclaimer: 'Lộ trình được tổng hợp dựa trên hồ sơ năng lực AI đánh giá.',
      };
    }
  }
}
