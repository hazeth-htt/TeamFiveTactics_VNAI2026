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
var AiExtractionService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiExtractionService = void 0;
require("dotenv/config");
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const adapter_pg_1 = require("@prisma/adapter-pg");
const pg_1 = require("pg");
const openai_1 = __importDefault(require("openai"));
let AiExtractionService = AiExtractionService_1 = class AiExtractionService {
    logger = new common_1.Logger(AiExtractionService_1.name);
    prisma;
    deepseekClient = null;
    openaiClient = null;
    llmModel = 'deepseek-chat';
    constructor() {
        const pool = new pg_1.Pool({ connectionString: process.env.DATABASE_URL });
        const adapter = new adapter_pg_1.PrismaPg(pool);
        this.prisma = new client_1.PrismaClient({ adapter });
        this.initClients();
    }
    initClients() {
        const deepseekKey = process.env.LLM_API_KEY || process.env.DEEPSEEK_API_KEY;
        const deepseekBaseUrl = process.env.LLM_BASE_URL || process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com';
        this.llmModel = process.env.LLM_MODEL || 'deepseek-chat';
        const openaiKey = process.env.OPENAI_API_KEY;
        if (deepseekKey && deepseekKey !== 'sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx') {
            this.deepseekClient = new openai_1.default({
                apiKey: deepseekKey,
                baseURL: deepseekBaseUrl,
            });
            this.logger.log(`LLM client initialized with model: ${this.llmModel} at base URL: ${deepseekBaseUrl}`);
        }
        else {
            this.logger.warn('LLM API key is missing or placeholder. Running in fallback/mock mode.');
        }
        if (openaiKey) {
            this.openaiClient = new openai_1.default({
                apiKey: openaiKey,
            });
            this.logger.log('OpenAI client initialized for embeddings.');
        }
    }
    async extractAndSave(rawJob, category) {
        this.logger.log(`Extracting and saving job: "${rawJob.title}"`);
        if (!this.deepseekClient || !this.openaiClient) {
            this.initClients();
        }
        let structuredData = null;
        if (this.deepseekClient) {
            try {
                this.logger.log(`[MECHANISM] [REAL AI MODE] Standardizing job description using LLM API (${this.llmModel})...`);
                const prompt = this.buildPrompt(rawJob, category);
                const response = await this.deepseekClient.chat.completions.create({
                    model: this.llmModel,
                    messages: [
                        {
                            role: 'system',
                            content: 'You are a professional career guidance AI assistant. Analyze job postings to extract career track definitions, role progressions, and skill trees in Vietnamese. Always respond with raw, valid JSON.',
                        },
                        {
                            role: 'user',
                            content: prompt,
                        },
                    ],
                    temperature: 0.1,
                });
                let content = response.choices[0]?.message?.content;
                if (content) {
                    content = content.trim();
                    if (content.startsWith('```')) {
                        content = content.replace(/^```json\s*/i, '').replace(/```$/, '').trim();
                    }
                    structuredData = JSON.parse(content);
                }
            }
            catch (err) {
                this.logger.error(`Failed to call DeepSeek API: ${err.message}. Falling back to rule-based parser.`);
            }
        }
        if (!structuredData) {
            this.logger.warn('[MECHANISM] [FALLBACK MOCK MODE] Using rule-based structured mock parser (DeepSeek API failed or key missing)...');
            structuredData = this.generateMockStructuredData(rawJob, category);
        }
        let embeddingVector = [];
        if (this.openaiClient) {
            try {
                this.logger.log('[MECHANISM] [REAL EMBEDDING] Generating 1536-dimensional vector embedding via OpenAI (text-embedding-3-small)...');
                const embeddingText = `${structuredData.career_track} ${structuredData.description} ${structuredData.education_route}`;
                const embResponse = await this.openaiClient.embeddings.create({
                    model: 'text-embedding-3-small',
                    input: embeddingText,
                });
                embeddingVector = embResponse.data[0].embedding;
            }
            catch (err) {
                this.logger.error(`Failed to generate OpenAI embedding: ${err.message}. Using fallback vector.`);
            }
        }
        if (embeddingVector.length === 0) {
            this.logger.warn('[MECHANISM] [MOCK EMBEDDING] Generating deterministic mock vector (OpenAI API failed or key missing)...');
            embeddingVector = this.generateDeterministicVector(structuredData.career_track);
        }
        await this.syncToDatabase(structuredData, embeddingVector);
    }
    buildPrompt(rawJob, category) {
        return `
Hãy phân tích dữ liệu tin tuyển dụng dưới đây và chuyển đổi thành thông tin chuẩn hóa dạng JSON.

Dữ liệu tin tuyển dụng:
- Tiêu đề: ${rawJob.title}
- Công ty: ${rawJob.hiringOrganization?.name || 'Chưa rõ'}
- Mức lương thô: ${JSON.stringify(rawJob.baseSalary) || 'Thỏa thuận'}
- Địa điểm: ${rawJob.jobLocation?.address?.addressRegion || 'Việt Nam'}
- Mô tả & Yêu cầu: ${rawJob.description || 'Không có mô tả'}

Yêu cầu xuất ra JSON theo đúng cấu trúc sau:
{
  "career_track": "Tên ngành nghề hoặc vị trí công việc cụ thể được trích xuất và chuẩn hóa từ tin tuyển dụng (Ví dụ: 'Lập trình viên NodeJS', 'Kế toán tổng hợp', 'Kỹ thuật viên sửa chữa Ô tô', 'Nhân viên Xuất nhập khẩu')",
  "track_type": "Lĩnh vực nghề nghiệp lớn (Industry/Category) mà ngành nghề đó thuộc về (Ví dụ: 'Công nghệ thông tin', 'Tài chính - Kế toán', 'Cơ khí & Tự động hóa', 'Xuất nhập khẩu & Logistics', 'Y tế & Chăm sóc sức khỏe', 'Nghệ thuật & Sáng tạo')",
  "description": "Đoạn văn bản mô tả ngắn gọn (khoảng 2-3 câu) định nghĩa về đặc thù công việc của ngành này, tối ưu bằng ngôn ngữ dễ hiểu dành cho học sinh THPT.",
  "avg_salary_min": Mức lương trung bình tối thiểu trích xuất từ dữ liệu thị trường thực tế (Đơn vị: VND/tháng, ví dụ: 10000000). Nếu tin tuyển dụng ghi 'Thỏa thuận' hoặc không rõ, giá trị lưu là null.,
  "avg_salary_max": Mức lương trung bình tối đa trích xuất từ dữ liệu thị trường thực tế (Đơn vị: VND/tháng, ví dụ: 25000000). Nếu không rõ, giá trị lưu là null.,
  "education_route": "Gợi ý lộ trình hoặc hệ đào tạo phổ biến tương ứng ngoài thực tế do AI đúc kết từ yêu cầu bằng cấp trong các bài tuyển dụng (Ví dụ: 'Hệ Đại học chuyên ngành CNTT hoặc ATTT từ 4-5 năm', 'Hệ Cao đẳng hoặc trường nghề chuyên ngành Kỹ thuật ô tô từ 2-3 năm'). Nếu không rõ, lưu là null.",
  "typical_employers": ["Tên công ty tuyển dụng này và các doanh nghiệp lớn khác cùng ngành"],
  "region_demand": {
    "HN": "high" hoặc "medium" hoặc "low" hoặc "none",
    "HCM": "high" hoặc "medium" hoặc "low" hoặc "none",
    "DN": "high" hoặc "medium" hoặc "low" hoặc "none"
  },
  "local_demand_signals": {
    "HCM": {
      "hot_skills": ["danh sách kỹ năng/công cụ hot ở đây"],
      "growth_rate": "phần trăm tăng trưởng (ví dụ: '15%')"
    },
    "HN": {
      "hot_skills": ["danh sách kỹ năng/công cụ hot ở đây"],
      "growth_rate": "phần trăm tăng trưởng (ví dụ: '12%')"
    }
  },
  "timeline_trends": {
    "2025": "stable" hoặc "rising" hoặc "falling",
    "2026": "rising" hoặc "stable" hoặc "falling"
  },
  "skills": {
    "fundamentals": ["Kỹ năng nền tảng 1", "Kỹ năng nền tảng 2"],
    "core_technologies": ["Công cụ/Công nghệ cốt lõi 1", "Công nghệ cốt lõi 2"],
    "advanced_skills": ["Kỹ năng nâng cao/Chuyên sâu 1"]
  },
  "role_progressions": [
    {
      "level": "Entry",
      "title": "Tiêu đề công việc thực tập/mới đi làm",
      "description": "Mô tả trách nhiệm cấp Entry",
      "sort_order": 0
    },
    {
      "level": "Mid",
      "title": "Tiêu đề công việc cấp trung",
      "description": "Mô tả trách nhiệm cấp Mid",
      "sort_order": 1
    },
    {
      "level": "Advanced",
      "title": "Tiêu đề công việc cấp cao/quản lý",
      "description": "Mô tả trách nhiệm cấp Advanced",
      "sort_order": 2
    }
  ]
}
`;
    }
    async syncToDatabase(data, embedding) {
        try {
            this.logger.log(`Syncing career track: "${data.career_track}" to database...`);
            let careerTrack = await this.prisma.careerTrack.findFirst({
                where: {
                    career_track: {
                        equals: data.career_track,
                        mode: 'insensitive',
                    },
                },
            });
            if (careerTrack) {
                const employers = Array.from(new Set([...(careerTrack.typical_employers || []), ...(data.typical_employers || [])]));
                careerTrack = await this.prisma.careerTrack.update({
                    where: { id: careerTrack.id },
                    data: {
                        track_type: data.track_type || careerTrack.track_type,
                        description: data.description || careerTrack.description,
                        avg_salary_min: data.avg_salary_min !== undefined ? data.avg_salary_min : careerTrack.avg_salary_min,
                        avg_salary_max: data.avg_salary_max !== undefined ? data.avg_salary_max : careerTrack.avg_salary_max,
                        education_route: data.education_route !== undefined ? data.education_route : careerTrack.education_route,
                        typical_employers: employers,
                        region_demand: data.region_demand || careerTrack.region_demand,
                        local_demand_signals: data.local_demand_signals || careerTrack.local_demand_signals,
                        timeline_trends: data.timeline_trends || careerTrack.timeline_trends,
                        embedding: embedding,
                    },
                });
                this.logger.log(`Updated existing career track ID: ${careerTrack.id}`);
            }
            else {
                careerTrack = await this.prisma.careerTrack.create({
                    data: {
                        career_track: data.career_track,
                        track_type: data.track_type || 'Chưa xác định',
                        description: data.description,
                        avg_salary_min: data.avg_salary_min !== undefined ? data.avg_salary_min : null,
                        avg_salary_max: data.avg_salary_max !== undefined ? data.avg_salary_max : null,
                        education_route: data.education_route !== undefined ? data.education_route : null,
                        typical_employers: data.typical_employers || [],
                        region_demand: data.region_demand || {},
                        local_demand_signals: data.local_demand_signals || {},
                        timeline_trends: data.timeline_trends || {},
                        embedding: embedding,
                    },
                });
                this.logger.log(`Created new career track ID: ${careerTrack.id}`);
            }
            if (data.skills) {
                for (const [category, skills] of Object.entries(data.skills)) {
                    if (!Array.isArray(skills))
                        continue;
                    for (const skillName of skills) {
                        const trimmedSkill = skillName.trim();
                        if (!trimmedSkill)
                            continue;
                        const existingSkill = await this.prisma.skillTree.findFirst({
                            where: {
                                career_track_id: careerTrack.id,
                                skill_name: {
                                    equals: trimmedSkill,
                                    mode: 'insensitive',
                                },
                            },
                        });
                        if (!existingSkill) {
                            await this.prisma.skillTree.create({
                                data: {
                                    career_track_id: careerTrack.id,
                                    category: category,
                                    skill_name: trimmedSkill,
                                },
                            });
                        }
                    }
                }
                this.logger.log(`Synced skill tree for ID: ${careerTrack.id}`);
            }
            if (data.role_progressions && Array.isArray(data.role_progressions)) {
                for (const role of data.role_progressions) {
                    const existingRole = await this.prisma.roleProgression.findFirst({
                        where: {
                            career_track_id: careerTrack.id,
                            title: {
                                equals: role.title,
                                mode: 'insensitive',
                            },
                        },
                    });
                    if (!existingRole) {
                        await this.prisma.roleProgression.create({
                            data: {
                                career_track_id: careerTrack.id,
                                level: role.level,
                                title: role.title,
                                description: role.description || '',
                                sort_order: role.sort_order || 0,
                            },
                        });
                    }
                }
                this.logger.log(`Synced role progressions for ID: ${careerTrack.id}`);
            }
        }
        catch (dbErr) {
            this.logger.error(`Database sync failed for "${data.career_track}": ${dbErr.message}`);
        }
    }
    generateDeterministicVector(text) {
        const dimensions = 1536;
        const vector = new Array(dimensions);
        let hash = 0;
        for (let i = 0; i < text.length; i++) {
            hash = text.charCodeAt(i) + ((hash << 5) - hash);
        }
        for (let j = 0; j < dimensions; j++) {
            const seed = Math.sin(hash + j) * 10000;
            vector[j] = seed - Math.floor(seed);
            vector[j] = (vector[j] * 2) - 1;
        }
        let sumOfSquares = 0;
        for (let k = 0; k < dimensions; k++) {
            sumOfSquares += vector[k] * vector[k];
        }
        const norm = Math.sqrt(sumOfSquares);
        for (let k = 0; k < dimensions; k++) {
            vector[k] = vector[k] / norm;
        }
        return vector;
    }
    generateMockStructuredData(rawJob, category) {
        const title = rawJob.title || 'Vị trí mới';
        const company = rawJob.hiringOrganization?.name || 'Công ty ẩn danh';
        let careerTrack = 'Ngành nghề tổng hợp';
        let trackType = 'Lĩnh vực khác';
        if (category === 'it') {
            careerTrack = title.toLowerCase().includes('node') ? 'Lập trình viên NodeJS' : 'Lập trình viên Software';
            trackType = 'Công nghệ thông tin';
        }
        else if (category === 'business') {
            careerTrack = (title.toLowerCase().includes('kế toán') || title.toLowerCase().includes('ke toan'))
                ? 'Kế toán tổng hợp'
                : 'Nhân viên Kinh doanh';
            trackType = 'Tài chính - Kế toán';
        }
        else if (category === 'art') {
            careerTrack = 'Nhà thiết kế Đồ họa (Designer)';
            trackType = 'Nghệ thuật & Sáng tạo';
        }
        else if (category === 'vocational') {
            if (title.toLowerCase().includes('ô tô') || title.toLowerCase().includes('o to')) {
                careerTrack = 'Kỹ thuật viên sửa chữa Ô tô';
                trackType = 'Cơ khí & Tự động hóa';
            }
            else if (title.toLowerCase().includes('điện') || title.toLowerCase().includes('plc')) {
                careerTrack = 'Kỹ thuật viên Tự động hóa';
                trackType = 'Cơ khí & Tự động hóa';
            }
            else if (title.toLowerCase().includes('bếp') || title.toLowerCase().includes('nấu')) {
                careerTrack = 'Đầu bếp chuyên nghiệp';
                trackType = 'Ẩm thực & Nhà hàng';
            }
            else {
                careerTrack = 'Kỹ thuật viên Lắp ráp';
                trackType = 'Cơ khí & Tự động hóa';
            }
        }
        const defaultSkills = {
            it: {
                fundamentals: ['Tư duy Logic', 'Giải quyết vấn đề', 'Cấu trúc dữ liệu'],
                core_technologies: ['Git', 'Docker', 'REST API'],
                advanced_skills: ['Hệ thống phân tán', 'Cloud Computing'],
            },
            business: {
                fundamentals: ['Kỹ năng giao tiếp', 'Làm việc nhóm', 'Phân tích số liệu'],
                core_technologies: ['SEO', 'Google Analytics', 'CRM tools'],
                advanced_skills: ['Quản trị thương hiệu', 'Đàm phán nâng cao'],
            },
            art: {
                fundamentals: ['Thẩm mỹ thiết kế', 'Phối màu sắc', 'Tư duy sáng tạo'],
                core_technologies: ['Adobe Photoshop', 'Figma', 'Illustrator'],
                advanced_skills: ['Hệ thống Design System', 'Motion Graphics'],
            },
            vocational: {
                fundamentals: ['An toàn lao động', 'Kỷ luật quy trình', 'Bảo dưỡng định kỳ'],
                core_technologies: ['Sử dụng công cụ chuyên dụng', 'Đọc bản vẽ kỹ thuật'],
                advanced_skills: ['Chẩn đoán lỗi phức tạp', 'Quản lý đội kỹ thuật'],
            },
            general: {
                fundamentals: ['Giao tiếp cơ bản', 'Giải quyết tình huống'],
                core_technologies: ['Tin học văn phòng'],
                advanced_skills: ['Quản lý thời gian'],
            },
        };
        const selectedSkills = defaultSkills[category] || defaultSkills.general;
        return {
            career_track: careerTrack,
            track_type: trackType,
            description: `Ngành nghề liên quan đến lĩnh vực ${careerTrack}, thực hiện các công việc chuyên môn từ tuyển dụng thực tế.`,
            avg_salary_min: 8000000,
            avg_salary_max: 20000000,
            education_route: category === 'vocational' ? 'Cao đẳng nghề hoặc chứng chỉ thực hành (2-3 năm)' : 'Đại học chuyên ngành liên quan (4-5 năm)',
            typical_employers: [company],
            region_demand: { HN: 'high', HCM: 'high', DN: 'medium' },
            local_demand_signals: { HCM: { hot_skills: selectedSkills.core_technologies, growth_rate: '12%' } },
            timeline_trends: { '2025': 'stable', '2026': 'rising' },
            skills: selectedSkills,
            role_progressions: [
                { level: 'Entry', title: `Junior ${careerTrack}`, description: 'Thực hiện các công việc cơ bản dưới sự chỉ dẫn.', sort_order: 0 },
                { level: 'Mid', title: `Middle ${careerTrack}`, description: 'Độc lập xử lý công việc và phát triển kỹ năng cốt lõi.', sort_order: 1 },
                { level: 'Advanced', title: `Senior ${careerTrack}`, description: 'Giải quyết các vấn đề phức tạp và hỗ trợ đội nhóm.', sort_order: 2 },
            ],
        };
    }
};
exports.AiExtractionService = AiExtractionService;
exports.AiExtractionService = AiExtractionService = AiExtractionService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], AiExtractionService);
//# sourceMappingURL=ai-extraction.service.js.map