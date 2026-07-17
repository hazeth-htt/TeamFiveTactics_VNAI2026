# TÀI LIỆU CẬP NHẬT KIẾN TRÚC: AGENT 1, 2, 3
*Bổ sung tính năng Khung Năng Lực Động (5 Frameworks) và Phân tích Yếu tố Địa lý, Mức lương, Xu hướng Thị trường.*

---

## 1. HỆ THỐNG CÂU HỎI MỎ NEO 2 TẦNG (TWO-TIER BASE QUESTIONS) & DYNAMIC FRAMEWORKS

Hệ thống sử dụng cơ chế Hai Tầng để đặt câu hỏi, kết hợp với nhân xưng "mình - bạn" điềm đạm, thân thiện:
- **Tầng 1 (General):** Load cho tất cả user để đánh giá tính cách nền tảng.
- **Tầng 2 (Specific):** Load theo lĩnh vực user chọn để đánh giá độ phù hợp chuyên môn.

### 1.0. Khung Nền Tảng Chung (`core_framework.json`)
- **Base Questions (Tầng 1 - Bắt buộc):**
  - "Khi có thời gian rảnh rỗi, bạn thường ưu tiên làm những việc gì để thư giãn?"
  - "Trong quá trình học trên lớp, bạn cảm thấy mình đặc biệt hứng thú với môn học nào nhất?"
  - "Khi làm việc nhóm, bạn cảm thấy thoải mái nhất khi đảm nhận vai trò nào (như quản lý tiến độ, làm nội dung, hay thuyết trình)?"
  - "Bạn có thói quen lên kế hoạch kỹ lưỡng trước khi làm một việc gì đó, hay thích tùy cơ ứng biến hơn?"
  - "Khi gặp một vấn đề khó, bạn thường thích tự mình mày mò tìm ra đáp án, hay sẽ tham khảo ý kiến người khác để giải quyết nhanh hơn?"
  - "Bạn cảm thấy thế nào nếu tính chất công việc sau này yêu cầu bạn lặp đi lặp lại một quy trình mỗi ngày?"
- **Traits (Tiêu chí nền tảng):**
  - `introvert_vs_extrovert`: Hướng nội vs Hướng ngoại.
  - `analytical_vs_creative`: Phân tích logic vs Sáng tạo bay bổng.
  - `theoretical_vs_practical`: Lý thuyết hàn lâm vs Thực hành tay chân.

### 1.1. Khung IT & Công nghệ (`it_framework.json`)
- **Base Questions (Tầng 2 - Chuyên ngành IT):**
  - "Bạn có thường hay tò mò muốn biết cách các ứng dụng điện thoại hoặc thiết bị điện tử hoạt động như thế nào không?"
  - "Nếu máy tính hoặc mạng ở nhà gặp sự cố, bạn sẽ gọi người hỗ trợ ngay hay muốn tự mình tìm hiểu cách khắc phục trước?"
  - "Bạn cảm thấy thế nào nếu công việc yêu cầu phải ngồi tập trung trước màn hình máy tính nhiều giờ liền để tìm và sửa một lỗi nhỏ?"
  - "Bạn có hứng thú với những trò chơi hoặc thử thách đòi hỏi tính toán chiến thuật và tư duy logic cao không?"
  - "Mỗi khi có một công nghệ hay phần mềm mới ra mắt, bạn có xu hướng muốn tìm hiểu và trải nghiệm nó ngay lập tức không?"
- **Traits (Tiêu chí chuyên môn):**
  - `logical_thinking`: Tư duy logic, hệ thống và phân tích vấn đề.
  - `problem_solving`: Sự kiên nhẫn tìm lỗi, khắc phục sự cố.
  - `continuous_learning`: Khả năng tự học, cập nhật công nghệ mới.

### 1.2. Khung Kinh doanh & Thương mại (`business_framework.json`)
- **Base Questions (Tầng 2 - Chuyên ngành Business):**
  - "Trong các sự kiện hoặc câu lạc bộ, bạn thường muốn tham gia với tư cách là người đứng ra tổ chức hay đóng vai trò thành viên hỗ trợ?"
  - "Bạn có cảm thấy thoải mái và tự nhiên khi phải chủ động bắt chuyện làm quen với những người mới gặp không?"
  - "Khi đi mua sắm, bạn có hay để ý đến cách cửa hàng bày trí, định giá sản phẩm hay các chương trình khuyến mãi của họ không?"
  - "Khi thảo luận và có bất đồng quan điểm, bạn thường chọn cách nhường nhịn để giữ hòa khí, hay cố gắng dùng lý lẽ thuyết phục người khác?"
  - "Bạn có thói quen đặt ra các mục tiêu cá nhân (như tiết kiệm tiền mua một món đồ) và bám sát để hoàn thành nó không?"
- **Traits (Tiêu chí chuyên môn):**
  - `social_interaction`: Mở rộng mối quan hệ, thích giao tiếp.
  - `persuasion_negotiation`: Kỹ năng thuyết phục, đàm phán, trình bày.
  - `number_sensitivity`: Nhạy bén với số liệu, tài chính.

### 1.3. Khung Nghệ thuật & Sáng tạo (`art_framework.json`)
- **Base Questions (Tầng 2 - Chuyên ngành Art):**
  - "Bạn có sở thích tự tay sắp xếp, trang trí lại góc học tập hay làm những món đồ thủ công mang dấu ấn cá nhân không?"
  - "Khi xem một bộ phim hay một bức ảnh, điều gì thường thu hút bạn nhất: nội dung câu chuyện, hay các yếu tố như màu sắc, góc quay, âm thanh?"
  - "Bạn có thường xuyên nghĩ ra những ý tưởng mới lạ và khác biệt so với số đông không?"
  - "Bạn sẽ cảm thấy thế nào nếu môi trường học tập hoặc làm việc yêu cầu bạn phải tuân thủ nghiêm ngặt các khuôn mẫu cứng nhắc?"
  - "Bạn có phải là người dễ dàng rung động hoặc có sự đồng cảm sâu sắc khi thưởng thức một tác phẩm nghệ thuật hay một bản nhạc buồn không?"
- **Traits (Tiêu chí chuyên môn):**
  - `creative_expression`: Nhu cầu sáng tạo cái mới, tránh rập khuôn.
  - `aesthetics`: Thẩm mỹ, nhạy cảm với màu sắc, bố cục, âm thanh.
  - `attention_to_detail`: Sự tỉ mỉ, chăm chút từng chi tiết.

### 1.4. Khung Kỹ thuật Ứng dụng & Trường nghề (`vocational_framework.json`)
- **Base Questions (Tầng 2 - Chuyên ngành Vocational):**
  - "Bạn thích những công việc thiên về vận động tay chân hay nghiêng về những công việc nhẹ nhàng, ít phải di chuyển hơn?"
  - "Khi các vật dụng trong nhà bị hỏng hóc, bạn có thích tự lấy đồ nghề ra kiểm tra và cố gắng sửa chữa không?"
  - "Bạn có cảm thấy hào hứng hơn khi nhìn thấy ngay kết quả công việc của mình (như lắp ráp xong một món đồ) so với việc tham gia những dự án kéo dài nhiều tháng không?"
  - "Bạn đánh giá sức bền của mình thế nào nếu phải làm việc trong môi trường đòi hỏi sự di chuyển và vận động thường xuyên?"
  - "Trong những công việc cần sử dụng công cụ hoặc máy móc, bạn là người cẩn thận tuân thủ quy tắc an toàn hay thích làm theo thói quen cá nhân?"
- **Traits (Tiêu chí chuyên môn):**
  - `practical_hands_on`: Thích thực hành tay chân, thao tác với công cụ.
  - `immediate_result_focus`: Thích nhìn thấy kết quả công việc ngay lập tức thay vì dự án dài hơi.

---

## 2. CHI TIẾT CẬP NHẬT CÁC AGENT

### 2.1. Agent 1 — Market Data Pipeline (Offline Script)

**Nhiệm vụ mới:** Agent 1 đóng vai trò như một "Chuyên gia Nhân sự (HR)". Không chỉ cào mô tả công việc (JD), Agent 1 còn phải lấy dữ liệu Tỉnh thành, Mức lương và dùng LLM để nội suy điểm số các tiêu chí tính cách/năng lực, đồng thời đánh giá xu hướng thị trường ở khu vực đó.

**Luồng xử lý Raw JSON (Từ JD thô ra Điểm số):**
1. **Crawl:** Lấy Data thô (JD, Lương, Địa điểm).
2. **LLM Extraction & Scoring:** 
   - Ném Text thô + `framework.json` vào LLM.
   - LLM đối chiếu các yêu cầu công việc với mô tả của từng tiêu chí (trait) trong framework để chấm điểm (1-10). 
   - *Ví dụ:* JD yêu cầu "Thường xuyên phải debug các sự cố sập server" -> LLM chấm `problem_solving`: 9. JD ghi "Làm việc remote, ít giao tiếp" -> LLM chấm `introvert_vs_extrovert`: 2.
3. **Aggregation (Tổng hợp thành Điểm chuẩn):**
   - Agent 1 gom hàng ngàn bài JD của cùng một nghề (vd: Backend Developer) lại, tính Trung bình cộng (Average) hoặc Trung vị (Median) để tạo ra một Vector điểm chuẩn đại diện cho nghề đó.
4. **Trend Analysis:** Dựa vào Tỉnh thành và Mức lương trung bình, LLM gán `trend_score` (Độ hot) và `risk_of_unemployment` (Nguy cơ thất nghiệp).
5. **Lưu trữ:** Ghi vào Pinecone (Vector chuẩn) và PostgreSQL (Structured Data).

**Output JSON chuẩn hóa từ Agent 1 (Sau khi Aggregation):**
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
    "problem_solving": 9,
    "introvert_vs_extrovert": 3,
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
  "evaluation_framework": {
    "general_base_questions": ["Lúc rảnh rỗi...", "Trong các môn học..."],
    "field_specific_base_questions": ["Bạn có hay tò mò...", "Bạn cảm thấy thế nào..."],
    "traits_to_evaluate": {
      "introvert_vs_extrovert": "...",
      "logical_thinking": "..."
    }
  },
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
