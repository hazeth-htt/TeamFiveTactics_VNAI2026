"""
processors/llm_extractor.py - Dùng LLM (FPT Cloud / DeepSeek) để bóc tách
Job Description (JD) thô thành core_competencies và domain_competencies.

Cải tiến so với v1:
- RUBRIC CHI TIẾT: Mỗi mức điểm có mô tả cụ thể → LLM nhất quán hơn
- FEW-SHOT EXAMPLES: Cho LLM thấy ví dụ cụ thể → giảm hallucination
- EVIDENCE FIELD: Bắt LLM giải thích lý do → dễ debug và validate
"""
import json
import re
from openai import OpenAI
from config import LLM_API_KEY, LLM_BASE_URL, LLM_MODEL


def get_llm_client() -> OpenAI:
    if not LLM_API_KEY:
        raise ValueError("LLM_API_KEY chưa được cấu hình trong .env")
    return OpenAI(api_key=LLM_API_KEY, base_url=LLM_BASE_URL)


# ── RUBRIC CHI TIẾT (Giải quyết vấn đề thiếu chuẩn neo) ──────────────────────
SCORING_RUBRIC = """
=== THANG ĐIỂM CHUẨN (RUBRIC) ===
Áp dụng thang này để ĐỒNG NHẤT giữa các lần chấm:

analytical_thinking:
  2-3: "Thực hiện theo hướng dẫn", "công việc lặp đi lặp lại", "không cần phân tích"
  5-6: "Hiểu yêu cầu nghiệp vụ", "đọc báo cáo", "tổng hợp thông tin cơ bản"
  7-8: "Phân tích dữ liệu", "thiết kế giải pháp", "tối ưu hóa quy trình"
  9-10: "Thiết kế kiến trúc hệ thống phức tạp", "data science", "nghiên cứu & phát triển"

problem_solving:
  2-3: "Làm theo quy trình cố định", "liên hệ cấp trên khi có vấn đề"
  5-6: "Xử lý tình huống thông thường", "tìm giải pháp từ tài liệu có sẵn"
  7-8: "Debug lỗi phức tạp", "sáng tạo giải pháp mới", "xử lý sự cố hệ thống"
  9-10: "Giải quyết bài toán chưa có tiền lệ", "R&D", "phát minh quy trình mới"

effective_communication:
  2-3: "Ít phải giao tiếp", "làm việc độc lập hoàn toàn", "không tiếp xúc khách"
  5-6: "Báo cáo nội bộ", "email cơ bản", "họp team định kỳ"
  7-8: "Thuyết trình", "đàm phán", "đào tạo người khác", "viết tài liệu kỹ thuật"
  9-10: "Diễn thuyết trước đám đông", "đàm phán hợp đồng lớn", "phát ngôn thương hiệu"

continuous_learning:
  2-3: "Kỹ năng ổn định, ít thay đổi", "công việc thủ công truyền thống"
  5-6: "Cập nhật nghiệp vụ định kỳ", "tham gia training công ty"
  7-8: "Tự học công nghệ mới", "chứng chỉ chuyên môn", "theo dõi trend ngành"
  9-10: "Nghiên cứu học thuật", "tiên phong công nghệ mới", "cần học liên tục để không lỗi thời"

team_collaboration:
  2-3: "Làm việc hoàn toàn độc lập", "không cần phối hợp nhóm"
  5-6: "Phối hợp cơ bản", "chia sẻ thông tin", "họp nhóm nhỏ"
  7-8: "Dẫn dắt nhóm dự án", "cross-functional team", "mentor junior"
  9-10: "Quản lý nhiều team", "xây dựng văn hóa tổ chức", "lãnh đạo toàn công ty"

creativity_innovation:
  2-3: "Thực hiện đúng quy trình", "không cần ý tưởng mới", "công việc tiêu chuẩn hóa"
  5-6: "Cải tiến nhỏ trong quy trình", "đề xuất ý kiến khi họp"
  7-8: "Thiết kế sản phẩm mới", "branding", "viết nội dung sáng tạo", "UX design"
  9-10: "Innovation core job", "R&D leader", "nghệ sĩ chuyên nghiệp", "entrepreneur"

adaptability_resilience:
  2-3: "Môi trường ổn định, ít thay đổi", "công việc theo lịch cố định"
  5-6: "Chịu được áp lực deadline bình thường", "làm ca xoay"
  7-8: "Môi trường startup", "deadline khắt khe", "thay đổi yêu cầu liên tục"
  9-10: "Bác sĩ cấp cứu", "bộ đội", "nghề xử lý khủng hoảng", "sales áp lực cao"

critical_thinking:
  2-3: "Tin tưởng và thực hiện theo chỉ thị", "không cần đánh giá độc lập"
  5-6: "Kiểm tra lại thông tin cơ bản", "phản hồi có lý do"
  7-8: "Phân tích đa chiều", "đánh giá rủi ro", "nghiên cứu văn bản pháp lý"
  9-10: "Nghiên cứu khoa học", "thẩm phán", "kiểm toán", "nhà phân tích chính sách"

responsibility_autonomy:
  2-3: "Cần giám sát thường xuyên", "làm theo checklist có sẵn"
  5-6: "Tự hoàn thành task được giao", "báo cáo định kỳ"
  7-8: "Quản lý dự án độc lập", "tự quyết định trong phạm vi", "chịu trách nhiệm KPI"
  9-10: "CEO/CTO", "bác sĩ phẫu thuật độc lập", "trách nhiệm tính mạng/pháp lý"

work_ethics_integrity:
  2-3: "Ít rủi ro đạo đức", "sản phẩm/dịch vụ đơn giản"
  5-6: "Tuân thủ quy định công ty", "bảo mật thông tin cơ bản"
  7-8: "Xử lý tiền bạc/tài chính", "dữ liệu cá nhân khách hàng", "thay mặt pháp nhân"
  9-10: "Y tế (tính mạng)", "luật sư (bí mật khách hàng)", "kế toán kiểm toán (tiền tỷ)"
"""

# ── FEW-SHOT EXAMPLES (Cho LLM thấy chuẩn cụ thể) ────────────────────────────
FEW_SHOT_EXAMPLES = """
=== VÍ DỤ MẪU (Để bạn hiểu cách chấm) ===

VÍ DỤ 1 - Backend Engineer:
Input JD: "Thiết kế REST API, tối ưu database query, deploy AWS. Thành thạo Python. Làm việc độc lập."
Output mong đợi:
{
  "core_competencies": {
    "analytical_thinking": 8, "problem_solving": 8, "effective_communication": 5,
    "continuous_learning": 8, "team_collaboration": 6, "creativity_innovation": 5,
    "adaptability_resilience": 7, "critical_thinking": 7, "responsibility_autonomy": 8,
    "work_ethics_integrity": 6
  },
  "domain_competencies": {
    "python_programming": {"weight_omega": 0.9, "required_level": 8},
    "rest_api_design": {"weight_omega": 0.85, "required_level": 7},
    "database_optimization": {"weight_omega": 0.8, "required_level": 7}
  },
  "evidence": "Thiết kế API và tối ưu DB → analytical+problem_solving cao; Làm việc độc lập → autonomy 8"
}

VÍ DỤ 2 - Nhân viên bán hàng:
Input JD: "Tư vấn và bán sản phẩm cho khách hàng, đạt chỉ tiêu doanh số, chăm sóc khách hàng sau bán."
Output mong đợi:
{
  "core_competencies": {
    "analytical_thinking": 4, "problem_solving": 6, "effective_communication": 9,
    "continuous_learning": 5, "team_collaboration": 6, "creativity_innovation": 5,
    "adaptability_resilience": 8, "critical_thinking": 5, "responsibility_autonomy": 7,
    "work_ethics_integrity": 7
  },
  "domain_competencies": {
    "customer_communication": {"weight_omega": 0.95, "required_level": 9},
    "sales_technique": {"weight_omega": 0.9, "required_level": 7},
    "crm_management": {"weight_omega": 0.6, "required_level": 5}
  },
  "evidence": "Tư vấn khách hàng → communication 9; Đạt chỉ tiêu doanh số → adaptability+autonomy cao"
}
"""

SYSTEM_PROMPT = f"""Bạn là một Chuyên gia Nhân sự (HR Expert) với 20 năm kinh nghiệm. Nhiệm vụ: đọc JD và trả về JSON điểm số NHẤT QUÁN.

{SCORING_RUBRIC}

{FEW_SHOT_EXAMPLES}

=== OUTPUT FORMAT (JSON thuần, không có markdown hay giải thích ngoài) ===
{{
  "core_competencies": {{
    "analytical_thinking": <int 1-10>,
    "problem_solving": <int 1-10>,
    "effective_communication": <int 1-10>,
    "continuous_learning": <int 1-10>,
    "team_collaboration": <int 1-10>,
    "creativity_innovation": <int 1-10>,
    "adaptability_resilience": <int 1-10>,
    "critical_thinking": <int 1-10>,
    "responsibility_autonomy": <int 1-10>,
    "work_ethics_integrity": <int 1-10>
  }},
  "domain_competencies": {{
    "<skill_snake_case>": {{ "weight_omega": <float 0-1>, "required_level": <int 1-10> }}
  }},
  "evidence": "<Trích dẫn câu cụ thể trong JD chứng minh điểm số trên>"
}}

QUAN TRỌNG: Chỉ điền domain_competencies những kỹ năng THỰC SỰ được đề cập trong JD. Tối đa 6 kỹ năng.
"""


def extract_competencies_from_jd(job_title: str, jd_text: str) -> dict | None:
    """
    Gọi LLM để bóc tách một JD thô thành core và domain competencies.

    Args:
        job_title: Tên công việc (VD: "Backend Engineer")
        jd_text: Nội dung mô tả công việc thô từ crawler.

    Returns:
        Dict chứa core_competencies, domain_competencies và evidence, hoặc None nếu lỗi.
    """
    client = get_llm_client()

    user_message = f"""Vị trí tuyển dụng: {job_title}

Mô tả công việc:
---
{jd_text}
---

Hãy chấm điểm dựa trên RUBRIC đã cho. Nhớ bám vào thang điểm mẫu để nhất quán."""

    try:
        response = client.chat.completions.create(
            model=LLM_MODEL,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_message},
            ],
            temperature=0.1,
            max_tokens=2048,
        )

        raw_content = response.choices[0].message.content.strip()

        # Xóa markdown code block nếu LLM bọc ngoài
        cleaned = re.sub(r"^```(?:json)?\s*", "", raw_content)
        cleaned = re.sub(r"\s*```$", "", cleaned)

        result = json.loads(cleaned)
        return result

    except json.JSONDecodeError as e:
        print(f"  ⚠️  [LLM] JSON parse lỗi cho '{job_title}': {e}")
        print(f"       Raw response: {raw_content[:300]}")
        return None
    except Exception as e:
        print(f"  ❌ [LLM] Lỗi API cho '{job_title}': {e}")
        return None


def test_llm_connection() -> bool:
    """Test nhanh xem LLM API có hoạt động không."""
    print("🧪 Đang kiểm tra kết nối LLM API...")
    result = extract_competencies_from_jd(
        job_title="Software Engineer",
        jd_text="Yêu cầu ứng viên có kỹ năng lập trình Python, làm việc nhóm tốt và ham học hỏi."
    )
    if result and "core_competencies" in result:
        print(f"  ✅ [LLM] Kết nối thành công! Model: {LLM_MODEL}")
        print(f"  📝 Evidence: {result.get('evidence', 'N/A')}")
        return True
    else:
        print(f"  ❌ [LLM] Kết nối thất bại.")
        return False
