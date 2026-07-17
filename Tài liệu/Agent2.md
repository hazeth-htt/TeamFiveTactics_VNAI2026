# CHI TIẾT THIẾT KẾ & KẾ HOẠCH TRIỂN KHAI: AI AGENT 2
*Bản đặc tả chi tiết cho Counselor + Evaluator Microservice (Python FastAPI - Port 8002)*

---

## 1. TỔNG QUAN VAI TRÒ & HOẠT ĐỘNG CỦA AGENT 2

AI Agent 2 chịu trách nhiệm **phỏng vấn ngầm thích ứng (Implicit Profiling)** thông qua giao diện chat. Thay vì bắt người dùng điền khảo sát hay làm trắc nghiệm khô khan, Agent 2 đóng vai một cố vấn thấu cảm để thu thập thông tin qua trò chuyện tự nhiên.

### Cơ chế 2 Sub-Agents chạy song song:
1. **Agent 2A (Counselor):** Tạo câu phản hồi (reply) thân thiện, thấu cảm, dẫn dắt câu chuyện tự nhiên dựa trên ngữ cảnh đã biết.
2. **Agent 2B (Evaluator):** Chạy ngầm phân tích nội dung chat, chấm điểm năng lực/tính cách (`trait_scores`), ước lượng mức độ tin cậy (`confidence_scores`), phán đoán bối cảnh (`context_inferred`) và quyết định xem đã thu thập đủ dữ liệu chưa (`is_ready`).

---

## 2. DỮ LIỆU & THÔNG TIN CẦN THIẾT

### 2.1. Dữ liệu Đầu vào (Input) từ NestJS
NestJS sẽ gửi một REST HTTP POST request sang Agent 2 với body JSON như sau:
```json
{
  "session_id": "8a7f23c9-0b1d-4e92-a1f8-bc5a6d7e8f9c",
  "message": "Em thích vọc vạch sửa đồ điện trong nhà hơn là học mấy môn lý thuyết.",
  "target_field": "Vocational",
  "evaluation_framework": {
    "general_base_questions": [
      "Khi có thời gian rảnh rỗi, bạn thường ưu tiên làm những việc gì để thư giãn?"
    ],
    "field_specific_base_questions": [
      "Bạn thích những công việc thiên về vận động tay chân hay nghiêng về những công việc nhẹ nhàng, ít phải di chuyển hơn?"
    ],
    "traits_to_evaluate": {
      "practical_hands_on": "Thích thực hành tay chân, thao tác với công cụ.",
      "physical_stamina": "Chịu đựng áp lực thể chất, sức khỏe tốt."
    }
  },
  "conversation_history": [
    { "role": "assistant", "content": "Chào em, anh có thể hỗ trợ gì cho em hôm nay?" },
    { "role": "user", "content": "Chào anh, em đang học lớp 11 và thấy hoang mang không biết ra trường làm gì." },
    { "role": "assistant", "content": "Anh hiểu cảm giác đó. Ở tuổi này ai cũng có những băn khoăn như vậy. Bình thường lúc rảnh rỗi em thích làm gì nhất?" }
  ]
}
```

### 2.2. Dữ liệu Đầu ra (Output) trả về cho NestJS
Agent 2 xử lý xong và phản hồi với định dạng:
```json
{
  "reply": "Thích tự tay sửa đồ điện chứng tỏ bạn có khả năng thực hành kỹ thuật rất tốt đấy! Sửa chữa thường mất sức, vậy thể chất của bạn có tốt không, vì các ngành kỹ thuật hay phải vận động nhiều? Sẵn tiện cho mình hỏi, sau này ra trường bạn dự định làm ở quê cho gần nhà hay lên thành phố lớn?",
  "profile_update": {
    "context_inferred": "highschool",                         -- Mặc định cố định là học sinh cấp 3
    "trait_scores": {
      "practical_hands_on": 8,
      "physical_stamina": 0
    },
    "market_expectations": {                                  -- MỚI: Yếu tố thị trường & Địa lý
      "preferred_locations": [],
      "expected_salary_min": 0,
      "willing_to_relocate": false
    },
    "confidence_scores": {
      "practical_hands_on": 0.85,
      "physical_stamina": 0.1
    }
  },
  "is_ready": false
}
```

---

## 3. CƠ CHẾ LOGIC CỐT LÕI (AI LOGIC)

### Giai đoạn 1: Thiết lập kết nối & Base Questions Tầng 1 (General)
AI đóng vai một người bạn đồng trang lứa (xưng "mình - bạn" điềm đạm). Khởi đầu bằng các câu hỏi mỏ neo Tầng 1 (`general_base_questions`) để giúp user cởi mở chia sẻ về sở thích nền tảng, tạo sự thoải mái. Không tự chế câu hỏi dài dòng.

### Giai đoạn 2: Deep Profiling & Base Questions Tầng 2 (Specific)
Agent 2B đóng vai "Đạo diễn ngầm" giám sát tiến độ thu thập dữ liệu và điều hướng Agent 2A:
- **Chuyển Phase:** Khi thu thập đủ tính cách nền tảng, Agent 2B lệnh cho Agent 2A chuyển sang hỏi mỏ neo Tầng 2 (`field_specific_base_questions`) để đánh giá chuyên môn ngành nghề đã chọn.
- **Deep-dive chủ động:** Khi user vô tình nhắc đến một manh mối liên quan đến các tiêu chí động (`traits_to_evaluate`), Agent 2B lập tức ra lệnh "deep-dive". Agent 2A sẽ tự động chế biến câu hỏi đào sâu dựa trên bối cảnh user vừa nói để chấm điểm tiêu chí đó.
- **Thu thập Kỳ vọng Thị trường:** Agent 2A khéo léo lồng ghép hỏi về Nơi muốn sống (preferred_locations) và Mức lương kỳ vọng (expected_salary_min) để Agent 2B trích xuất.
- **Hard Turn Limit (Giới hạn lượt):** Tối đa 3-5 lượt trao đổi cho một chủ đề. Khi đạt giới hạn hoặc khi `confidence_score` của nhóm đó đạt trên `0.8`, Agent 2A phải thực hiện **Forced Transition** (chuyển sang chủ đề tiếp theo bằng câu nối khéo léo).
- **Chỉ số dừng (Stopping Criteria):** Khi trung bình cộng `confidence_scores` của các tiêu chí cốt lõi đạt trên `0.8` (hoặc sau tối đa 15 lượt chat toàn session), Agent 2B sẽ trả về `is_ready = true` để kích hoạt Roadmap.

---

## 4. KẾ HOẠCH CẤU TRÚC MICROSERVICE (MỤC MỤC FILES)

Tất cả các file của Agent 2 sẽ nằm tại thư mục `ai-services/counselor/`.

```
ai-services/counselor/
├── .env.example            # Bản mẫu cấu hình biến môi trường
├── requirements.txt        # Các thư viện phụ thuộc của Python
├── main.py                 # Khởi tạo FastAPI & Router
├── config.py               # Quản lý cài đặt & API Keys
├── schemas.py              # Định nghĩa Pydantic Models (Validation dữ liệu vào/ra)
├── prompts.py              # Nơi quản lý toàn bộ System Prompts cho các Agent
├── counselor_agent.py      # Logic xử lý của Agent 2A (Counselor)
└── evaluator_agent.py      # Logic xử lý của Agent 2B (Evaluator)
```

### Chi tiết vai trò từng file:

#### 1. `requirements.txt`
Khai báo các thư viện cần cài đặt để chạy microservice:
```text
fastapi>=0.100.0
uvicorn>=0.22.0
openai>=1.0.0
pydantic>=2.0.0
python-dotenv>=1.0.0
```

#### 2. `config.py`
Đọc biến môi trường, thiết lập API key và cấu hình model LLM mặc định (ví dụ `gpt-4o-mini` để tối ưu chi phí và tốc độ phản hồi cho chatbot).

#### 3. `schemas.py`
Định nghĩa cấu trúc dữ liệu gửi lên và phản hồi để FastAPI tự động kiểm tra lỗi (validate) và sinh tài liệu Swagger UI (`/docs`).

#### 4. `prompts.py`
Tách biệt toàn bộ System Prompts giúp dễ chỉnh sửa, tránh bias:
- `COUNSELOR_SYSTEM_PROMPT`: Định nghĩa tính cách, ngôn từ thấu cảm, quy tắc bẻ lái hội thoại và nhiệm vụ lồng ghép câu hỏi về Khu vực/Mức lương kỳ vọng.
- `EVALUATOR_SYSTEM_PROMPT`: Định nghĩa hướng dẫn chấm điểm động (dựa vào `evaluation_framework` truyền vào), trích xuất `market_expectations` và trả về định dạng JSON thuần chứa điểm số và cờ `is_ready`.

#### 5. `counselor_agent.py`
Gọi API OpenAI để sinh ra câu trả lời dựa trên cuộc hội thoại hiện tại. Áp dụng phong cách trò chuyện phù hợp trực tiếp với học sinh cấp 3 (thân mật, thấu cảm, cởi mở).

#### 6. `evaluator_agent.py`
Gọi API OpenAI bằng cấu hình `response_format={"type": "json_object"}` để nhận diện điểm số ngầm, tính toán độ tin cậy và kiểm tra điều kiện kết thúc.

#### 7. `main.py`
Gắn kết tất cả các module lại, cung cấp endpoint duy nhất `POST /chat` cho NestJS gọi tới.

---

## 5. KẾ HOẠCH PHÁT TRIỂN & TÍCH HỢP (TIME-BOX)

- **Bước 1 (Hour 0 - 3):** Setup thư mục, cài dependencies, viết file `main.py` khung và endpoints rỗng trả về mock data để Vinh (Backend) có thể gọi thử.
- **Bước 2 (Hour 3 - 8):** Thiết kế Prompts chi tiết trong `prompts.py` và hoàn thiện `counselor_agent.py`.
- **Bước 3 (Hour 8 - 14):** Viết logic chấm điểm ngầm trong `evaluator_agent.py` và tối ưu prompt JSON output.
- **Bước 4 (Hour 14 - 18):** Thử nghiệm chạy liên kết giữa hai agent để kiểm chứng cơ chế bẻ lái hội thoại (Forced Transition) và dừng đúng lúc khi đạt 3-5 lượt.
- **Bước 5 (Hour 24+):** Tích hợp kiểm thử hoàn toàn qua cổng API Gateway NestJS của Vinh.
