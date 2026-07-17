# CHI TIẾT THIẾT KẾ & KẾ HOẠCH TRIỂN KHAI: AI AGENT 3
*Bản đặc tả chi tiết cho Roadmap Agent Microservice (Python FastAPI - Port 8003)*

---

## 1. TỔNG QUAN VAI TRÒ & HOẠT ĐỘNG CỦA AGENT 3

AI Agent 3 chịu trách nhiệm **Sinh đa lộ trình sự nghiệp (Multi-Path Career Roadmap)** dựa trên kết quả phỏng vấn của Agent 2 và dữ liệu tuyển dụng thực tế. 

Agent 3 áp dụng kỹ thuật **RAG (Retrieval-Augmented Generation)**:
1. **Lấy thông tin (Retrieval):** Dùng điểm số và địa phương của học sinh để tìm các ngành nghề phù hợp nhất trong Vector DB (Pinecone) và PostgreSQL.
2. **Sinh lộ trình (Generation):** Gọi LLM (khuyên dùng Qwen 2.5 hoặc Gemini 1.5 Flash) để kết hợp dữ liệu tuyển dụng với hồ sơ học sinh, viết ra lý do thuyết phục (`why_it_fits`) và các chỉ số thị trường cục bộ (`market_signals`).

---

## 2. DỮ LIỆU ĐẦU VÀO & ĐẦU RA (API CONTRACT)

### 2.1. JSON Đầu vào (Request từ NestJS)
NestJS lấy profile của học sinh từ PostgreSQL (đã lưu sau khi kết thúc chat ở Agent 2) và gửi sang:
```json
{
  "user_profile": {
    "trait_scores": {
      "practical_skill": 9,
      "academic_interest": 2,
      "social_interaction": 4,
      "analytical_thinking": 6
    },
    "location": "Binh_Duong"
  }
}
```

### 2.2. JSON Đầu ra (Response trả về cho NestJS)
Trả về danh sách 2-3 lộ trình song song (bắt buộc chứa ít nhất 1 hướng đại học và 1 hướng học nghề):
```json
{
  "user_profile_summary": "Bạn thể hiện sự vượt trội trong các hoạt động kỹ thuật thực tế và thao tác máy móc trực quan, thích nghi tốt với môi trường làm việc độc lập tại khu vực Bình Dương.",
  "paths": [
    {
      "path_id": 1,
      "track_type": "vocational",
      "career_track": "Kỹ thuật Tự động hóa / PLC",
      "education_route": "Cao đẳng nghề Điện - Tự động hóa Bình Dương (1.5 - 2 năm)",
      "match_score": 92,
      "why_it_fits": "Bạn có thế mạnh thực hành rất cao (9/10). Ngành này đang lên ngôi tại Bình Dương. Các nhà máy đang thiếu hụt kỹ năng lập trình PLC Siemens, việc học nghề 2 năm sẽ giúp bạn nhanh chóng có việc làm ổn định gần nhà.",
      "market_signals": {
        "local_trend": "rising",
        "local_demand_status": "Ngành đang lên ngôi tại địa phương",
        "locally_scarce_skills": ["Lập trình PLC Siemens", "Đọc bản vẽ mạch điện"]
      },
      "role_progression": [
        { "level": "Entry", "title": "Kỹ thuật viên vận hành máy", "description": "Bảo trì và vận hành dây chuyền sản xuất tự động." },
        { "level": "Mid", "title": "Kỹ thuật viên PLC Senior", "description": "Lập trình điều khiển hệ thống máy móc tự động." },
        { "level": "Advanced", "title": "Trưởng phòng Kỹ thuật dây chuyền", "description": "Thiết kế và tối ưu hóa hệ thống tự động toàn nhà máy." }
      ],
      "skill_tree": {
        "fundamentals": ["Điện cơ bản", "An toàn lao động", "Đọc bản vẽ kỹ thuật"],
        "core_technologies": ["PLC Siemens", "SCADA", "Cơ điện tử"],
        "advanced_skills": ["Lập trình cánh tay Robot", "IoT công nghiệp"]
      }
    },
    {
      "path_id": 2,
      "track_type": "academic",
      "career_track": "Kỹ thuật Cơ điện tử (Hệ Đại học)",
      "education_route": "Đại học Bách Khoa hoặc Đại học Sư phạm Kỹ thuật",
      "match_score": 78,
      "why_it_fits": "Dành cho định hướng học thuật lâu dài. Mặc dù bạn thích thực hành hơn, việc học Đại học sẽ cung cấp nền tảng toán học và thiết kế sâu, phù hợp với định hướng thiết kế hệ thống robot.",
      "market_signals": {
        "local_trend": "stable",
        "local_demand_status": "Nhu cầu ổn định",
        "locally_scarce_skills": ["Thiết kế hệ thống CAD/CAM"]
      },
      "role_progression": [
        { "level": "Entry", "title": "Kỹ sư R&D tập sự", "description": "Hỗ trợ thiết kế bản vẽ cơ khí và mạch điện." },
        { "level": "Mid", "title": "Kỹ sư Cơ điện tử", "description": "Chủ trì thiết kế các cụm máy tự động." },
        { "level": "Advanced", "title": "Kiến trúc sư hệ thống tự động", "description": "Quy hoạch và phát triển sản phẩm robot mới." }
      ],
      "skill_tree": {
        "fundamentals": ["Toán kỹ thuật", "Vật lý đại cương"],
        "core_technologies": ["Cơ học máy", "Lập trình C++ cho vi điều khiển"],
        "advanced_skills": ["Thiết kế Robot", "Xử lý ảnh công nghiệp"]
      }
    }
  ],
  "disclaimer": "Lộ trình hướng nghiệp này được tổng hợp dựa trên dữ liệu thị trường lao động tại địa phương và đặc tính cá nhân của bạn. Đây là tài liệu tham khảo, bạn hoàn toàn có quyền tự quyết định con đường học tập của mình."
}
```

---

## 3. CƠ CHẾ LOGIC CỐT LÕI (RAG & BIAS GUARD)

1.  **Bước 1: Tạo Vector tìm kiếm (Query Vector)**
    *   Lấy `trait_scores` của học sinh (ví dụ: `practical_skill: 9, analytical_thinking: 6`).
    *   Chuyển các đặc trưng này thành một chuỗi văn bản mô tả thế mạnh.
    *   Gọi API Embedding (ví dụ: `text-embedding-3-small` của OpenAI hoặc Gemini Embedding) để biến chuỗi mô tả thành vector.
2.  **Bước 2: Tìm kiếm ngành nghề tương ứng (RAG)**
    *   Query lên **Pinecone** bằng vector trên để lấy ra top-3 ngành nghề có độ tương đồng kỹ năng cao nhất (cả academic và vocational).
    *   Query lên **PostgreSQL** để lấy chi tiết: lộ trình công việc (`role_progressions`), cây kỹ năng cứng (`skill_trees`), và xu hướng địa phương (`local_demand_signals` của tỉnh/thành tương ứng).
3.  **Bước 3: Tổng hợp bằng LLM (Generation)**
    *   Gửi toàn bộ thông tin đã truy vấn được vào LLM.
    *   **Ràng buộc Bias Guard (Chống định kiến):** Ép LLM bằng System Prompt cấm tuyệt đối gợi ý dựa trên định kiến giới (ví dụ: nam làm kỹ thuật, nữ làm kế toán) hoặc phân biệt vùng miền. Bắt buộc hiển thị ít nhất một hướng nghề thực tế (vocational) song song với hướng đại học.

---

## 4. KẾ HOẠCH CẤU TRÚC FILES

Toàn bộ mã nguồn nằm tại thư mục `ai-services/roadmap/`:

```text
ai-services/roadmap/
├── requirements.txt         # Thư viện Python cần thiết
├── .env                     # Lưu trữ API Key & DB URL
├── main.py                  # Khởi chạy FastAPI
├── config.py                # Đọc env & thiết lập DB, OpenAI/Gemini SDK
├── schemas.py               # Validate cấu trúc dữ liệu Input/Output
├── prompts.py               # Quản lý System Prompt chống bias
├── rag_service.py           # Kết nối Pinecone & PostgreSQL để lấy data ngành
└── roadmap_generator.py     # Gọi LLM tổng hợp ra JSON đa lộ trình
```

### Chi tiết các file quan trọng:

#### 1. `requirements.txt`
```text
fastapi>=0.100.0
uvicorn>=0.22.0
openai>=1.0.0
pydantic>=2.0.0
python-dotenv>=1.0.0
pinecone-client>=3.0.0
psycopg2-binary>=2.9.0
```

#### 2. `rag_service.py`
Chịu trách nhiệm thực hiện truy vấn RAG:
*   Nhận `trait_scores` và `location`.
*   Kết nối Pinecone để tìm `vector_id` phù hợp nhất.
*   Dùng `psycopg2` query PostgreSQL để lấy các chi tiết kỹ năng, mức lương và thông số `"Binh_Duong"` trong trường `local_demand_signals`.

#### 3. `roadmap_generator.py`
*   Gọi mô hình (ví dụ: `qwen-2.5-32b-instruct` qua OpenRouter hoặc `gemini-1.5-flash`).
*   Truyền `system_instruction` chống định kiến giới/vùng miền cực kỳ nghiêm ngặt.
*   Nhận dữ liệu dạng JSON thô từ LLM, parse và đóng gói trả về cho NestJS.

---

## 5. KẾ HOẠCH PHÁT TRIỂN & TÍCH HỢP

*   **Hour 17 - 20:** Viết `rag_service.py` để test việc truy vấn cơ sở dữ liệu PostgreSQL cục bộ và Pinecone thành công.
*   **Hour 20 - 24:** Viết `roadmap_generator.py` thiết kế prompts chống bias và xuất ra định dạng JSON chuẩn.
*   **Hour 24 - 28:** Tích hợp đầu vào từ API Gateway NestJS của Vinh, kiểm tra toàn luồng sinh roadmap tự động từ dữ liệu thực tế.
