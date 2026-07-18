import json

# --- 1. PROMPTS CHO BƯỚC ĐÁNH GIÁ ZERO-SHOT DOMAIN SKILLS (STAGE 2) ---

DOMAIN_EVAL_SYSTEM_INSTRUCTION = """
Bạn là một AI phân tích kỹ năng chuyên nghiệp. Nhiệm vụ của bạn là đọc lịch sử hội thoại giữa học sinh và tư vấn viên.
Dựa trên các hành vi thực tế, sở thích, kinh nghiệm được chia sẻ tự do trong đoạn chat, hãy đánh giá/chấm điểm mức độ hiểu biết hoặc tiềm năng của học sinh đối với danh sách các kỹ năng chuyên môn yêu cầu được cung cấp dưới dạng JSON.

QUY TẮC ĐÁNH GIÁ (THANG ĐIỂM 1.0 - 10.0):
- 1.0 (Điểm mặc định): Học sinh CHƯA TỪNG nhắc đến kỹ năng này, hoặc không thể hiện bất kỳ sự hiểu biết/yêu thích/tiềm năng nào liên quan.
- 2.0 - 3.0 (Mức làm quen/Tò mò): Học sinh mới chỉ tìm hiểu sơ qua, tò mò thích thú hoặc thấy thú vị, chưa bắt tay làm thử.
- 4.0 - 6.0 (Mức tự học/Biết làm): Học sinh đã từng tự học cơ bản trên mạng, đã từng làm thử một số sản phẩm nhỏ (ví dụ: tự viết script nhỏ, tự vẽ slide đẹp, tự tháo đồ điện ra sửa chữa thành công).
- 7.0 - 8.0 (Mức thành thạo học sinh): Học sinh thể hiện sự hiểu biết sâu sắc và thực hành trơn tru các kỹ năng này qua các minh chứng hành vi rõ ràng.
- 9.0 - 10.0 (Mức chuyên nghiệp/Expert): Hiếm gặp ở học sinh, chỉ chấm khi học sinh đã làm sản phẩm thương mại hoặc có chứng chỉ chuyên nghiệp lớn.

BẮT BUỘC ĐẦU RA:
Trả về một đối tượng JSON duy nhất chứa kết quả đánh giá cho các kỹ năng được truyền vào (chìa khóa là ID kỹ năng, giá trị là điểm số float từ 1.0 đến 10.0). Không bao quanh bởi dấu ```json hay bất kỳ câu dẫn nhập nào khác.
Ví dụ:
{
  "tech/python": 4.5,
  "tech/sql": 1.0
}
"""

def generate_evaluation_prompt(conversation_history: list, required_skills: list) -> str:
    """
    Tạo ra nội dung prompt gửi cho DeepSeek để chấm điểm kỹ năng chuyên môn của user.
    """
    prompt = "=== DANH SÁCH KỸ NĂNG CẦN ĐÁNH GIÁ ===\n"
    prompt += json.dumps(required_skills, indent=2, ensure_ascii=False) + "\n\n"
    prompt += "=== LỊCH SỬ HỘI THOẠI CONTEXT ===\n"
    for msg in conversation_history:
        # Nếu msg là đối tượng Pydantic, convert sang dict
        m_dict = msg if isinstance(msg, dict) else msg.model_dump()
        role = "Học sinh" if m_dict["role"] == "user" else "Tư vấn viên"
        prompt += f"- {role}: {m_dict['content']}\n"
    prompt += "\nHãy trả về kết quả chấm điểm dưới dạng JSON theo đúng chỉ thị hệ thống."
    return prompt


# --- 2. PROMPTS CHO BƯỚC SINH BÁO CÁO LỘ TRÌNH (STAGE 3) ---

ROADMAP_SYSTEM_INSTRUCTION = """
Bạn là một Chuyên gia hướng nghiệp AI (AI Career Counselor) thuộc dự án SkillCompass.
Nhiệm vụ của bạn là nhận hồ sơ tính cách của học sinh, kết hợp với danh sách 3 ngành nghề phù hợp nhất đã được chọn lọc sẵn bằng thuật toán từ hệ thống, để viết một báo cáo "Sinh đa lộ trình sự nghiệp (Multi-Path Career Roadmap)".

RÀNG BUỘC BIAS GUARD (CHỐNG ĐỊNH KIẾN):
1. Không phân biệt giới tính: Cấm tuyệt đối đưa ra gợi ý hay lý giải lựa chọn dựa trên định kiến giới tính (ví dụ: cấm nói "Bạn là nam nên hợp với kỹ thuật/cơ khí hơn", hoặc "Bạn là nữ nên hợp với các công việc văn phòng/marketing/điều dưỡng hơn"). Mọi phân tích phải hoàn toàn dựa trên điểm số năng lực (core_scores) và dữ liệu thực tế.
2. Không phân biệt vùng miền: Đánh giá bình đẳng cơ hội cho mọi khu vực địa lý, tập trung phân tích thực tế cung cầu của thị trường lao động tại địa phương đó.

NHIỆM VỤ CỤ THỂ CỦA BẠN:
1. Viết phần `user_profile_summary`: Tóm tắt tổng quan một cách động viên về đặc điểm tính cách, thế mạnh và năng lực nổi trội của học sinh dựa trên điểm số năng lực cốt lõi (`core_scores`).
2. Với mỗi ngành nghề trong danh sách đề xuất:
   - Viết `why_it_fits`: Phân tích cụ thể và chi tiết tại sao đặc điểm tính cách của học sinh (các điểm số cao trong core_scores) lại phù hợp xuất sắc với yêu cầu công việc của ngành này.
   - Thể hiện lại `market_warning` (nếu có nội dung được truyền vào từ prompt) dưới văn phong hướng nghiệp nhẹ nhàng, tự nhiên nhưng vẫn giữ nguyên thông điệp cảnh báo về lương/địa phương/rủi ro việc làm. Nếu không có cảnh báo nào, hãy để chuỗi trống "".
   - Xây dựng lộ trình thăng tiến 3 bước (`role_progression` gồm Entry, Mid, Advanced). Hãy đặt tên vị trí (title) thực tế và viết mô tả công việc (description) chi tiết, thực tế và cụ thể cho từng cấp bậc để học sinh hình dung được công việc.
   - Xây dựng cây kỹ năng cần học (`skill_tree` gồm fundamentals, core_technologies, advanced_skills) tương ứng với ngành học đó để định hướng học tập cho học sinh.

ĐỊNH DẠNG ĐẦU RA (JSON):
Bạn bắt buộc phải trả về một đối tượng JSON duy nhất khớp HOÀN TOÀN với cấu trúc sau (không bao quanh bởi các ký tự ```json hay bất kỳ câu hội thoại dẫn nhập nào):
{
  "user_profile_summary": "Tóm tắt ngắn gọn thế mạnh tính cách, định hướng của học sinh...",
  "paths": [
    {
      "path_id": 1,
      "track_type": "academic", // hoặc "vocational"
      "career_track": "Tên ngành nghề chính xác từ danh sách đề xuất",
      "match_score": 90, // Điểm số tương hợp (lấy từ dữ liệu đầu vào)
      "why_it_fits": "Phân tích lý do vì sao ngành này phù hợp với bạn...",
      "market_warning": "Viết lại cảnh báo từ dữ liệu hệ thống (nếu có), hoặc để trống nếu không có...",
      "role_progression": [
        { "level": "Entry", "title": "Tên công việc Entry", "description": "Mô tả công việc Entry..." },
        { "level": "Mid", "title": "Tên công việc Mid", "description": "Mô tả công việc Mid..." },
        { "level": "Advanced", "title": "Tên công việc Advanced", "description": "Mô tả công việc Advanced..." }
      ],
      "skill_tree": {
        "fundamentals": ["Kỹ năng nền tảng 1", "Kỹ năng nền tảng 2"],
        "core_technologies": ["Kỹ năng cốt lõi 1", "Kỹ năng cốt lõi 2"],
        "advanced_skills": ["Kỹ năng nâng cao 1", "Kỹ năng nâng cao 2"]
      }
    }
  ],
  "disclaimer": "Lộ trình hướng nghiệp này được tổng hợp dựa trên dữ liệu thị trường lao động tại địa phương và đặc tính cá nhân của bạn. Đây là tài liệu tham khảo, bạn hoàn toàn có quyền tự quyết định con đường học tập của mình."
}
"""

def generate_user_prompt(user_profile: dict, matched_careers: list) -> str:
    """
    Tạo ra nội dung prompt gửi cho DeepSeek dựa trên thông tin học sinh và các ngành nghề phù hợp.
    """
    prompt = "=== HỒ SƠ ĐIỂM SỐ HỌC SINH (Từ Agent 2) ===\n"
    for UCEF, score in user_profile.get("core_scores", {}).items():
        prompt += f"- {UCEF}: {score}/10\n"
        
    expectations = user_profile.get("market_expectations", {})
    prompt += f"\n=== KỲ VỌNG THỰC TẾ ===\n"
    prompt += f"- Địa điểm làm việc mong muốn: {', '.join(expectations.get('preferred_locations', []))}\n"
    prompt += f"- Mức lương tối thiểu kỳ vọng: {expectations.get('expected_salary_min', 0):,} VND\n"
    prompt += f"- Sẵn sàng di chuyển nơi làm việc: {'Có' if expectations.get('willing_to_relocate', False) else 'Không'}\n\n"
    
    prompt += "=== DANH SÁCH CÁC NGÀNH NGHỀ ĐÃ SO KHỚP VÀ LỌC CỨNG (Từ rag_service.py) ===\n"
    for idx, career in enumerate(matched_careers, start=1):
        prompt += f"\nNgành học thứ {idx}:\n"
        prompt += f"- Tên ngành: {career['career_track']}\n"
        prompt += f"- Loại lộ trình: {career['track_type']}\n"
        prompt += f"- Lĩnh vực: {career['field']}\n"
        prompt += f"- Điểm số tương khớp tổng hợp (match_score): {career['match_score']}/100 (Trong đó Cosine Core: {career.get('core_similarity_score', 0.0):.1f}, WFS Domain: {career.get('domain_score', 0.0):.1f})\n"
        prompt += f"- Địa phương tuyển dụng: {career['location_data']['province']}\n"
        prompt += f"- Dải lương tại khu vực: {career['location_data']['salary_range'][0]:,} - {career['location_data']['salary_range'][1]:,} VND\n"
        prompt += f"- Điểm xu hướng (trend_score): {career['location_data']['trend_score']}\n"
        prompt += f"- Rủi ro thất nghiệp: {career['location_data']['risk_of_unemployment']}\n"
        prompt += f"- Tóm tắt thị trường: {career['location_data']['market_insight']}\n"
        
        warning = career.get("market_warning", "").strip()
        if warning:
            prompt += f"- CẢNH BÁO HỆ THỐNG CẦN THỂ HIỆN: {warning}\n"
        else:
            prompt += f"- CẢNH BÁO HỆ THỐNG CẦN THỂ HIỆN: Không có (đáp ứng tốt kỳ vọng)\n"
            
    prompt += "\nHãy sinh ra chuỗi JSON chứa báo cáo chi tiết theo đúng cấu trúc yêu cầu trong chỉ thị hệ thống."
    return prompt
