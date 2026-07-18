import { Injectable, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import axios from 'axios';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);
  private readonly prisma: PrismaClient;
  private readonly counselorUrl = process.env.COUNSELOR_SERVICE_URL || 'http://localhost:8002/chat';

  constructor() {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const adapter = new PrismaPg(pool);
    this.prisma = new PrismaClient({ adapter });
  }

  async handleMessage(sessionId: string, message: string): Promise<{ reply: string; is_ready: boolean }> {
    this.logger.log(`Processing message for session: ${sessionId}`);

    // 1. Đảm bảo session tồn tại trong Database
    let session = await this.prisma.session.findUnique({
      where: { id: sessionId },
    });
    if (!session) {
      session = await this.prisma.session.create({
        data: { id: sessionId },
      });
      this.logger.log(`Created new session: ${sessionId}`);
    }

    // 2. Lấy lịch sử hội thoại trước đó
    const messages = await this.prisma.conversationMessage.findMany({
      where: { session_id: sessionId },
      orderBy: { created_at: 'asc' },
    });

    const conversationHistory = messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    // 3. Lấy UserProfile (state) hiện tại
    const userProfile = await this.prisma.userProfile.findUnique({
      where: { session_id: sessionId },
    });

    // Định dạng current_state cho Python Counselor
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

    const currentCoreScores: Record<string, number> = {};
    const traitScores = userProfile?.trait_scores as Record<string, any> | null;
    if (traitScores) {
      for (const trait of defaultTraits) {
        currentCoreScores[trait] = typeof traitScores[trait] === 'number' ? traitScores[trait] : 5.0;
      }
    } else {
      for (const trait of defaultTraits) {
        currentCoreScores[trait] = 5.0;
      }
    }

    const currentConfidenceScores = userProfile?.confidence_scores
      ? (userProfile.confidence_scores as Record<string, number>)
      : defaultTraits.reduce((acc, trait) => ({ ...acc, [trait]: 0.1 }), {});

    const marketExpectations = traitScores?.market_expectations || {};
    const preferredLocations = marketExpectations.preferred_locations || [];
    const expectedSalaryMin = marketExpectations.expected_salary_min || 0;
    const willingToRelocate = marketExpectations.willing_to_relocate || false;
    const familySupport = marketExpectations.family_support || null;
    const healthIssues = marketExpectations.health_issues || null;
    const askedFamily = marketExpectations.asked_family || false;
    const askedHealth = marketExpectations.asked_health || false;

    const currentState = {
      context_inferred: userProfile?.context_inferred || 'highschool',
      core_scores: currentCoreScores,
      domain_scores: {},
      market_expectations: {
        preferred_locations: preferredLocations,
        expected_salary_min: expectedSalaryMin,
        willing_to_relocate: willingToRelocate,
        family_support: familySupport,
        health_issues: healthIssues,
        asked_family: askedFamily,
        asked_health: askedHealth,
      },
      confidence_scores: currentConfidenceScores,
      is_ready: userProfile?.is_ready || false,
    };

    // 4. Tạo khung câu hỏi mỏ neo (evaluation_framework) gửi cho Agent 2
    const evaluationFramework = {
      general_base_questions: [
        'Khi có thời gian rảnh rỗi, bạn thường ưu tiên làm những việc gì để thư giãn?',
        'Trong quá trình học trên lớp, bạn cảm thấy mình đặc biệt hứng thú với môn học nào nhất?',
      ],
      field_specific_base_questions: [
        'Bạn thích những công việc thiên về vận động tay chân hay nghiêng về những công việc nhẹ nhàng, ít phải di chuyển hơn?',
        'Khi các vật dụng trong nhà bị hỏng hóc, bạn có thích tự lấy đồ nghề ra kiểm tra và cố gắng sửa chữa không?',
      ],
      traits_to_evaluate: {
        adaptability_resilience: 'Khả năng thích ứng và vượt khó.',
        analytical_thinking: 'Tư duy logic, phân tích dữ liệu và số liệu.',
        continuous_learning: 'Ham học hỏi và tự nâng cao trình độ.',
        creativity_innovation: 'Sáng tạo và đổi mới giải pháp.',
        critical_thinking: 'Tư duy phản biện và đánh giá đa chiều.',
        effective_communication: 'Giao tiếp thuyết phục và truyền đạt thông tin.',
        problem_solving: 'Giải quyết vấn đề và tìm phương án xử lý.',
        responsibility_autonomy: 'Làm việc độc lập và chịu trách nhiệm.',
        team_collaboration: 'Làm việc nhóm và hỗ trợ đồng nghiệp.',
        work_ethics_integrity: 'Đạo đức nghề nghiệp và tính trung thực.',
      },
    };

    // 5. Lưu tin nhắn của User vào DB
    await this.prisma.conversationMessage.create({
      data: {
        session_id: sessionId,
        role: 'user',
        content: message,
      },
    });

    let replyText = 'Rất tiếc, hệ thống chatbot đang gặp sự cố kết nối. Chúng ta hãy thử lại sau nhé.';
    let isReady = false;

    // 6. Gọi sang Python Counselor Service
    try {
      this.logger.log(`Calling Python Counselor API at ${this.counselorUrl}...`);
      const response = await axios.post(this.counselorUrl, {
        session_id: sessionId,
        message: message,
        target_field: 'General',
        evaluation_framework: evaluationFramework,
        conversation_history: [...conversationHistory, { role: 'user', content: message }],
        current_state: currentState,
      });

      const replies = response.data.replies as string[];
      replyText = replies.join('\n');

      const profileUpdate = response.data.profile_update;
      isReady = profileUpdate.is_ready;

      // 7. Lưu tin nhắn phản hồi của Assistant vào DB
      await this.prisma.conversationMessage.create({
        data: {
          session_id: sessionId,
          role: 'assistant',
          content: replyText,
        },
      });

      // 8. Cập nhật UserProfile trong DB
      await this.prisma.userProfile.upsert({
        where: { session_id: sessionId },
        update: {
          context_inferred: profileUpdate.context_inferred,
          trait_scores: {
            ...profileUpdate.core_scores,
            market_expectations: profileUpdate.market_expectations,
          },
          confidence_scores: profileUpdate.confidence_scores,
          is_ready: profileUpdate.is_ready,
          updated_at: new Date(),
        },
        create: {
          session_id: sessionId,
          context_inferred: profileUpdate.context_inferred,
          trait_scores: {
            ...profileUpdate.core_scores,
            market_expectations: profileUpdate.market_expectations,
          },
          confidence_scores: profileUpdate.confidence_scores,
          is_ready: profileUpdate.is_ready,
        },
      });

      this.logger.log(`Updated user profile state. Conversation is_ready: ${isReady}`);
    } catch (error) {
      this.logger.error(`Error communicating with Python Counselor: ${error.message}`);
    }

    return {
      reply: replyText,
      is_ready: isReady,
    };
  }
}
