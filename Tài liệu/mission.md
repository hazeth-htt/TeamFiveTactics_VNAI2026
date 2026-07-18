# 📋 BẢNG THEO DÕI TIẾN ĐỘ NHIỆM VỤ - VINH (BACKEND ENGINEER)

Tài liệu này tổng hợp toàn bộ các đầu việc và tiến độ thực hiện của Vinh cho dự án **SkillCompass**. Bạn có thể đánh dấu `[x]` vào các ô dưới đây để tự theo dõi tiến trình làm việc của mình.

---

## 📅 TIMELINE CHI TIẾT & TIẾN ĐỘ

### 🚀 Giai đoạn 1: Thiết lập nền tảng (Hour 0 - Hour 6)
*Mục tiêu: Hoàn thành thiết lập dự án, DB schema và thống nhất contract.*

- [x] **1.1. Khởi tạo dự án NestJS**
  - [x] Khởi tạo NestJS app trong thư mục `web/backend`
  - [x] Chia module theo cấu trúc: `UserModule`, `ChatModule`, `RoadmapModule`
  - [x] Cài đặt các thư viện cần thiết (`@prisma/client`, `prisma`, `ioredis`, `axios`/`@nestjs/axios`, v.v.)
- [ ] **1.2. Thiết lập PostgreSQL + Prisma ORM**
  - [ ] Khởi tạo Prisma client và cấu hình kết nối database PostgreSQL
  - [ ] Thiết kế `schema.prisma` với các Model:
    - [ ] `User`: `id`, `email`/`username`, `createdAt`, v.v.
    - [ ] `Session`: `id`, `userId`, `createdAt`
    - [ ] `Profile`: `id`, `userId`, `trait_scores` (JSON), `confidence_scores` (JSON), `context_inferred` (String), `updatedAt`
    - [ ] `Roadmap`: `id`, `userId`, `user_profile_summary` (Text), `paths` (JSON), `disclaimer` (Text), `createdAt`
  - [ ] Chạy Prisma migration (`npx prisma migrate dev`) để sinh database tables
- [ ] **1.3. Thiết lập Redis**
  - [ ] Cài đặt cấu hình kết nối tới Redis Server
  - [ ] Viết module/service để đọc/ghi lịch sử chat vào Redis theo key `session:{session_id}`
- [ ] **1.4. Đồng bộ hóa API Contract với Tuân (AI)** ⚠️ *Hạn chót: Hour 6*
  - [ ] Chốt cấu trúc JSON Request/Response của Endpoint Chat
  - [ ] Chốt cấu trúc JSON Request/Response của Endpoint Roadmap

---

### 💬 Giai đoạn 2: Hiện thực hóa Chat Module (Hour 7 - Hour 16)
*Mục tiêu: Hoàn thành API nhắn tin tích hợp với Agent 2.*

- [ ] **2.1. Phát triển Endpoint `POST /api/chat/message`**
  - [ ] Nhận dữ liệu đầu vào: `{ session_id, message }` từ client
  - [ ] Đọc lịch sử hội thoại `conversation_history` từ Redis
  - [ ] Gọi API `POST http://localhost:8002/chat` (Agent 2) bằng HTTP Service
  - [ ] Nhận và kiểm tra dữ liệu trả về từ Agent 2: `{ reply, profile_update, is_ready }`
- [ ] **2.2. Xử lý lưu trữ dữ liệu sau chat**
  - [ ] Lưu/Cập nhật thông tin profile mới (`profile_update`) vào PostgreSQL
  - [ ] Lưu tin nhắn mới của User và câu trả lời của AI vào Redis (`conversation_history`)
  - [ ] Trả về `{ reply }` cho Client (Next.js)
- [ ] **2.3. Tự động chuyển tiếp khi `is_ready = true`**
  - [ ] Kiểm tra flag `is_ready` từ Agent 2
  - [ ] Nếu `true`, tự động kích hoạt tiến trình tạo Roadmap (gọi nội bộ hoặc gửi tín hiệu)

---

### 🗺️ Giai đoạn 3: Hiện thực hóa Roadmap Module (Hour 17 - Hour 28)
*Mục tiêu: Hoàn thành API tạo lộ trình đa tuyến tích hợp với Agent 3.*

- [ ] **3.1. Phát triển Endpoint `POST /api/career/roadmap`**
  - [ ] Lấy thông tin `user_profile` (trait_scores, context) mới nhất từ PostgreSQL
  - [ ] Gọi API `POST http://localhost:8003/generate-roadmap` (Agent 3) bằng HTTP Service
  - [ ] Nhận và kiểm tra dữ liệu trả về từ Agent 3: `{ user_profile_summary, paths[], disclaimer }`
- [ ] **3.2. Lưu trữ và phản hồi Roadmap**
  - [ ] Lưu thông tin Roadmap đã tạo vào PostgreSQL
  - [ ] Trả dữ liệu `{ paths[], disclaimer }` về cho Next.js (hoặc qua cơ chế WebSocket push nếu có yêu cầu nâng cao)

---

### 🧪 Giai đoạn 4: Tích hợp & QA (Hour 29 - Hour 48)
*Mục tiêu: Đảm bảo toàn bộ luồng hoạt động mượt mà và không có lỗi.*

- [ ] **4.1. Integration Test toàn luồng**
  - [ ] Phối hợp với Thành (Frontend) và Tuân (AI) test tích hợp từ giao diện chat đến khi hiển thị Roadmap
  - [ ] Xử lý lỗi khi AI Service bị lỗi hoặc phản hồi chậm (Timeout Handler)
- [ ] **4.2. Khắc phục Bug & Tối ưu hóa**
  - [ ] Fix các lỗi phát sinh trong quá trình QA của Thắng
  - [ ] Đảm bảo Server Backend chạy ổn định chuẩn bị cho Demo

---

## 📜 KÝ HỢP ĐỒNG API (API CONTRACT CHECKS)

### 1. NestJS ➡️ Agent 2 (Counselor)
* **Request (NestJS gửi đi):**
  ```json
  {
    "session_id": "string",
    "message": "string",
    "conversation_history": [
      { "role": "user", "content": "..." },
      { "role": "assistant", "content": "..." }
    ]
  }
  ```
* **Response (NestJS nhận về):**
  ```json
  {
    "reply": "string",
    "profile_update": {
      "trait_scores": {},
      "confidence_scores": {},
      "context_inferred": "string"
    },
    "is_ready": false
  }
  ```

### 2. NestJS ➡️ Agent 3 (Roadmap)
* **Request (NestJS gửi đi):**
  ```json
  {
    "user_profile": {
      "trait_scores": {},
      "context": "string"
    }
  }
  ```
* **Response (NestJS nhận về):**
  ```json
  {
    "user_profile_summary": "string",
    "paths": [
      {
        "path_id": 1,
        "track_type": "vocational", // "vocational" hoặc "academic"
        "career_track": "string",
        "match_score": 85,
        "why_it_fits": "string",
        "role_progression": ["...", "..."],
        "skill_tree": {}
      }
    ],
    "disclaimer": "string"
  }
  ```
