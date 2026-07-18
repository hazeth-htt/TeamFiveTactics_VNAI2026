import { Test, TestingModule } from '@nestjs/testing';
import { AiExtractionService } from './ai-extraction.service';

// Mock các module DB và Prisma để tránh kết nối thật
const mockCareerTrack = {
  findFirst: jest.fn(),
  update: jest.fn(),
  create: jest.fn(),
};

const mockSkillTree = {
  findFirst: jest.fn(),
  create: jest.fn(),
};

const mockRoleProgression = {
  findFirst: jest.fn(),
  create: jest.fn(),
};

jest.mock('@prisma/client', () => {
  return {
    PrismaClient: jest.fn().mockImplementation(() => {
      return {
        careerTrack: mockCareerTrack,
        skillTree: mockSkillTree,
        roleProgression: mockRoleProgression,
      };
    }),
  };
});

jest.mock('@prisma/adapter-pg', () => {
  return {
    PrismaPg: jest.fn(),
  };
});

jest.mock('pg', () => {
  return {
    Pool: jest.fn(),
  };
});

describe('AiExtractionService', () => {
  let service: AiExtractionService;

  beforeEach(async () => {
    // Reset mock history trước mỗi test case
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [AiExtractionService],
    }).compile();

    service = module.get<AiExtractionService>(AiExtractionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateDeterministicVector', () => {
    it('TC-NE-01: Tạo vector định danh 1536 chiều ổn định và có norm = 1', () => {
      const text = 'NodeJS Developer';
      const vector = (service as any).generateDeterministicVector(text);

      expect(vector).toBeDefined();
      expect(vector.length).toBe(1536);

      // Kiểm tra độ dài vector L2 norm gần bằng 1
      const sumOfSquares = vector.reduce((sum: number, val: number) => sum + val * val, 0);
      expect(sumOfSquares).toBeCloseTo(1, 5);
    });
  });

  describe('generateMockStructuredData', () => {
    it('TC-NE-02: Sinh dữ liệu mock phù hợp cho ngành IT', () => {
      const rawJob = {
        title: 'Tuyển Lập trình viên NodeJS Junior',
        hiringOrganization: { name: 'Công ty Công nghệ ABC' },
        description: 'Yêu cầu biết NodeJS, Javascript, SQL...',
      };

      const mockData = (service as any).generateMockStructuredData(rawJob, 'it');

      expect(mockData.career_track).toBe('Lập trình viên NodeJS');
      expect(mockData.track_type).toBe('Công nghệ thông tin');
      expect(mockData.avg_salary_min).toBe(8000000);
      expect(mockData.skills.fundamentals).toContain('Tư duy Logic');
      expect(mockData.role_progressions.length).toBe(3);
    });

    it('TC-NE-03: Sinh dữ liệu mock phù hợp cho ngành nghề khác', () => {
      const rawJob = {
        title: 'Tuyển Thợ sửa ô tô',
        hiringOrganization: { name: 'Gara Ô tô Hà Nội' },
      };

      const mockData = (service as any).generateMockStructuredData(rawJob, 'vocational');

      expect(mockData.career_track).toBe('Kỹ thuật viên sửa chữa Ô tô');
      expect(mockData.track_type).toBe('Cơ khí & Tự động hóa');
    });
  });

  describe('syncToDatabase', () => {
    it('TC-NE-04: Tạo mới career track, skill tree và role progressions nếu chưa tồn tại', async () => {
      const mockData = {
        career_track: 'Backend Developer',
        track_type: 'Công nghệ thông tin',
        description: 'Thiết kế REST API...',
        avg_salary_min: 10000000,
        avg_salary_max: 20000000,
        education_route: 'Đại học',
        typical_employers: ['Google'],
        region_demand: { HN: 'high' },
        skills: {
          fundamentals: ['Giao tiếp'],
        },
        role_progressions: [
          { level: 'Entry', title: 'Junior Backend', description: 'Basic work', sort_order: 0 },
        ],
      };
      const embedding = new Array(1536).fill(0.1);

      // Thiết lập database trả về rỗng (chưa tồn tại bản ghi nào)
      mockCareerTrack.findFirst.mockResolvedValue(null);
      mockCareerTrack.create.mockResolvedValue({ id: 100, career_track: 'Backend Developer' });
      mockSkillTree.findFirst.mockResolvedValue(null);
      mockRoleProgression.findFirst.mockResolvedValue(null);

      await (service as any).syncToDatabase(mockData, embedding);

      // Xác minh các mock db method được gọi
      expect(mockCareerTrack.findFirst).toHaveBeenCalled();
      expect(mockCareerTrack.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          career_track: 'Backend Developer',
          track_type: 'Công nghệ thông tin',
        }),
      });
      expect(mockSkillTree.create).toHaveBeenCalled();
      expect(mockRoleProgression.create).toHaveBeenCalled();
    });

    it('TC-NE-05: Cập nhật career track cũ nếu đã tồn tại trong database', async () => {
      const mockData = {
        career_track: 'Backend Developer',
        typical_employers: ['Amazon'],
      };
      const embedding = new Array(1536).fill(0.1);

      // Thiết lập database trả về bản ghi cũ
      mockCareerTrack.findFirst.mockResolvedValue({
        id: 100,
        career_track: 'Backend Developer',
        typical_employers: ['Google'],
      });
      mockCareerTrack.update.mockResolvedValue({
        id: 100,
        career_track: 'Backend Developer',
        typical_employers: ['Google', 'Amazon'],
      });

      await (service as any).syncToDatabase(mockData, embedding);

      expect(mockCareerTrack.findFirst).toHaveBeenCalled();
      expect(mockCareerTrack.update).toHaveBeenCalledWith({
        where: { id: 100 },
        data: expect.objectContaining({
          typical_employers: ['Google', 'Amazon'],
        }),
      });
    });
  });
});
