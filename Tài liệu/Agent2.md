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
  "reply": "À, thích tự tay sửa đồ điện chứng tỏ em có khả năng thực hành kỹ thuật rất tốt đấy! Khi sửa được một món đồ chạy lại bình thường, em cảm thấy thế nào? Và bố mẹ có ủng hộ sở thích này của em không?",
  "profile_update": {
    "context_inferred": "highschool",                         -- Mặc định cố định là học sinh cấp 3
    "trait_scores": {
      "practical_skill": 8,
      "academic_interest": 2,
      "social_interaction": 4,
      "analytical_thinking": 6
    },
    "confidence_scores": {
      "practical_skill": 0.75,
      "academic_interest": 0.8,
      "social_interaction": 0.3,
      "analytical_thinking": 0.5
    }
  },
  "is_ready": false
}
```

---

## 3. CƠ CHẾ LOGIC CỐT LÕI (AI LOGIC)

### Giai đoạn 1: Thiết lập kết nối & Khơi gợi thấu cảm (2-3 lượt đầu)
AI bắt đầu hội thoại bằng câu hỏi mở, thân mật và gần gũi như một người anh/người chị khóa trước. Mục tiêu là giúp học sinh cấp 3 giải tỏa áp lực (từ gia đình, bạn bè, kỳ thi) và cởi mở chia sẻ về sở thích, hoạt động thường ngày hoặc các môn học mà họ cảm thấy thoải mái nhất.

### Giai đoạn 2: Deep Profiling & Guided State Machine (Phần chính)
Agent 2B giám sát tiến độ thu thập dữ liệu dựa trên **Base Questionnaire Framework** dành riêng cho học sinh cấp 3:
- **Nhóm tiêu chí cần đánh giá:**
  1. *Động lực cốt lõi* (Học vì đam mê, kỳ vọng gia đình, hay mục tiêu tài chính sớm)
  2. *Thiên hướng tư duy* (Thích hành động thực tế - sửa chữa/lắp ráp, hay thích lý thuyết/tính toán, hay sáng tạo nghệ thuật)
  3. *Phong cách tương tác* (Thích làm việc độc lập một mình hay thích hoạt động đội nhóm/giao tiếp nhiều)
  4. *Khả năng đối diện áp lực học tập và học kỹ năng mới*
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
- `COUNSELOR_SYSTEM_PROMPT`: Định nghĩa tính cách, ngôn từ thấu cảm và quy tắc bẻ lái hội thoại.
- `EVALUATOR_SYSTEM_PROMPT`: Định nghĩa hướng dẫn chấm điểm, trả về định dạng JSON thuần chứa điểm số và cờ `is_ready`.

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
