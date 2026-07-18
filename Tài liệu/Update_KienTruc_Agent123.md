# TÀI LIỆU CẬP NHẬT KIẾN TRÚC: AGENT 1, 2, 3
*Bổ sung tính năng Khung Năng Lực Động (5 Frameworks) và Phân tích Yếu tố Địa lý, Mức lương, Xu hướng Thị trường.*

---

## 1. HỆ THỐNG 5 KHUNG NĂNG LỰC (DYNAMIC FRAMEWORKS)

Hệ thống sử dụng 5 file JSON chuẩn làm "thước đo" chung cho toàn bộ các Agent. Khi người dùng chọn Lĩnh vực ở màn hình Onboarding, NestJS sẽ nạp Framework tương ứng vào Agent 2.

### 1.1. Khung IT & Công nghệ (`iat_framework.json`)
- `logical_thinking`: Tư duy logic, hệ thống và phân tích vấn đề.
- `problem_solving`: Sự kiên nhẫn tìm lỗi, khắc phục sự cố kỹ thuật.
- `continuous_learning`: Khả năng tự học, cập nhật công nghệ mới.
- `team_collaboration`: Giao tiếp kỹ thuật, làm việc nhóm Scrum/Agile.

### 1.2. Khung Kinh doanh & Thương mại (`business_framework.json`)
- `social_interaction`: Mở rộng mối quan hệ, thích giao tiếp đám đông.
- `persuasion_negotiation`: Kỹ năng thuyết phục, đàm phán, trình bày.
- `number_sensitivity`: Nhạy bén với số liệu, tài chính, rủi ro.
- `adaptability`: Khả năng thích ứng với thị trường biến động.

### 1.3. Khung Nghệ thuật & Sáng tạo (`art_framework.json`)
- `creative_expression`: Nhu cầu sáng tạo cái mới, tránh rập khuôn.
- `aesthetics`: Thẩm mỹ, nhạy cảm với màu sắc, bố cục, âm thanh.
- `empathy`: Thấu cảm, hiểu tâm lý người dùng (User-centric).
- `attention_to_detail`: Sự tỉ mỉ, chăm chút từng chi tiết.

### 1.4. Khung Kỹ thuật Ứng dụng & Trường nghề (`vocational_framework.json`)
- `practical_hands_on`: Thích thực hành tay chân, thao tác với công cụ.
- `physical_stamina`: Chịu đựng áp lực thể chất, sức khỏe tốt.
- `attention_to_procedure`: Tuân thủ quy trình an toàn, tính kỷ luật.
- `immediate_result_focus`: Thích nhìn thấy kết quả công việc ngay lập tức.

### 1.5. Khung Chưa xác định (`general_framework.json`)
- `introvert_vs_extrovert`: Hướng nội vs Hướng ngoại.
- `analytical_vs_creative`: Phân tích logic vs Sáng tạo tự do.
- `theoretical_vs_practical`: Thích lý thuyết hàn lâm vs Thực hành tay chân.

---

## 2. CHI TIẾT CẬP NHẬT CÁC AGENT

### 2.1. Agent 1 — Market Data Pipeline (Offline Script)

**Nhiệm vụ mới:** Không chỉ lấy mô tả công việc (JD), Agent 1 còn phải lấy dữ liệu Tỉnh thành, Mức lương và dùng LLM để đánh giá xu hướng thị trường ở khu vực đó.

**Luồng xử lý Raw JSON:**
1. **Crawl:** Lấy Data thô (JD, Lương, Địa điểm).
2. **LLM Extraction & Scoring:** Gửi Text thô + `framework.json` vào LLM. LLM chấm điểm các tiêu chí (1-10).
3. **Trend Analysis:** Dựa vào Tỉnh thành và Mức lương trung bình, LLM gán `trend_score` (Độ hot) và `risk_of_unemployment` (Nguy cơ thất nghiệp).
4. **Lưu trữ:** Ghi vào Pinecone (Vector) và PostgreSQL (Structured Data).

**Output JSON chuẩn hóa từ Agent 1:**
```json
{
  "career_track": "Backend Engineer",
  "field": "IT",
  "location_data": {
    "province": "Hà Nội",
    "salary_range": [15000000, 30000000],
    "trend_score": 0.85, 
    "risk_of_unemployment": "Low",
    "market_insight": "Nhu cầu cao tại HN nhưng đòi hỏi nhiều kinh nghiệm hệ thống lớn."
  },
  "required_traits": {
    "logical_thinking": 9,
    "problem_solving": 8,
    "continuous_learning": 8,
    "team_collaboration": 5
  }
}
```

---

### 2.2. Agent 2 — Counselor + Evaluator (Port 8002)

**Nhiệm vụ mới:** Tích hợp việc thu thập "Kỳ vọng mức lương" và "Khu vực làm việc mong muốn" một cách khéo léo qua giao tiếp.

**Thay đổi ở Agent 2A (Counselor):**
- System Prompt được cập nhật để yêu cầu AI hỏi lồng ghép về yếu tố thực tế: *"Sau này ra trường, em muốn ở lại quê làm việc cho gần gia đình hay muốn lên thành phố lớn để thử thách? Mức thu nhập khởi điểm em kỳ vọng là khoảng bao nhiêu?"*

**Thay đổi ở Agent 2B (Evaluator):**
- Schema JSON trả về có thêm block `market_expectations`.

**API Contract Cập nhật (NestJS → Agent 2):**
```json
// Request từ NestJS
{
  "session_id": "string",
  "message": "string",
  "target_field": "IT",
  "evaluation_framework": { "logical_thinking": "...", ... },
  "conversation_history": []
}

// Response từ Agent 2
{
  "reply": "Câu trả lời của Counselor",
  "profile_update": {
    "trait_scores": {
      "logical_thinking": 8,
      "problem_solving": 7
    },
    "market_expectations": {
      "preferred_locations": ["Hà Nội", "Hồ Chí Minh"],
      "expected_salary_min": 10000000,
      "willing_to_relocate": true
    },
    "confidence_scores": { ... }
  },
  "is_ready": true
}
```

---

### 2.3. Agent 3 — Roadmap Agent (Port 8003)

**Nhiệm vụ mới:** Kết hợp **Điểm Tính cách (Passion)** và **Kỳ vọng Thực tế (Location/Salary)** để đưa ra kết quả, đồng thời bổ sung **Cảnh báo Xu hướng**.

**Luồng xử lý mới của Agent 3:**
1. **Semantic Search:** Tìm các nghề trong Pinecone khớp với `trait_scores`.
2. **Hard Filtering:** Lọc lại danh sách các nghề ở bước 1 dựa trên `preferred_locations` và `expected_salary_min` (từ PostgreSQL).
3. **LLM Ranking & Warning Generation:** Đẩy danh sách đã lọc vào LLM để sinh ra Roadmap. Nếu ngành phù hợp tính cách nhưng đang ở trạng thái `risk_of_unemployment: "High"` ở khu vực người dùng chọn, LLM phải tự động thêm câu cảnh báo.

**API Contract Cập nhật (NestJS → Agent 3):**
```json
// Request từ NestJS
{
  "user_profile": {
    "trait_scores": { "logical_thinking": 8, ... },
    "market_expectations": {
      "preferred_locations": ["Đà Nẵng"],
      "expected_salary_min": 15000000
    }
  }
}

// Response từ Agent 3 (Thêm trường cảnh báo)
{
  "user_profile_summary": "...",
  "paths": [
    {
      "path_id": 1,
      "track_type": "academic",
      "career_track": "Web Developer",
      "match_score": 90,
      "why_it_fits": "Rất hợp với tư duy logic của bạn.",
      "market_warning": "CẢNH BÁO: Tại Đà Nẵng, mức lương khởi điểm cho Web Dev hiện tại có thể thấp hơn kỳ vọng 15 triệu của bạn, và cạnh tranh rất cao.",
      "role_progression": [...],
      "skill_tree": {...}
    }
  ]
}
```
