# TÀI LIỆU KIẾN TRÚC TỔNG THỂ (SYSTEM DESIGN DOCUMENT)
*Dự án: SkillCompass - Hybrid Monolith Web + AI Microservices*

---

## 1. SƠ ĐỒ KIẾN TRÚC TỔNG THỂ

```text
┌──────────────────────────────────────────────────────┐
│                  MONOLITHIC WEB LAYER                │
│                                                      │
│   [Next.js :3000]  ←──────────→  [NestJS :4000]     │
│    Frontend                       API Gateway        │
│                                   + DB Manager       │
└──────────────────────────┬───────────────────────────┘
                           │
              ┌────────────┴────────────────────────────┐
              │  (1) Mỗi tin nhắn     (2) Khi is_ready  │
              ↓                                ↓
   ┌──────────────────┐              ┌──────────────────┐
   │   AI Service 2   │──profile +──▶│   AI Service 3   │   ← RUNTIME (luôn sống)
   │ Counselor Agent  │  context     │  Roadmap Agent   │
   │  + Evaluator     │  (qua NestJS)│                  │
   │   Port: 8002     │              │   Port: 8003     │
   │  (FastAPI/Py)    │              │  (FastAPI/Py)    │
   └──────────────────┘              └────────┬─────────┘
    Trả về:                           RAG query│ Đọc vectors & metadata
    - reply (hiện cho user)                    ↓
    - profile_update          ┌────────────────────────┐
    - is_ready flag           │    Pinecone / Qdrant   │
         │                    │      (Vector DB)       │
         │ NestJS lưu         └────────────▲───────────┘
         ↓                                 │ Ghi vectors + Metadata
   ┌─────────────────┐        ┌────────────┴──────────────────┐
   │   PostgreSQL    │◀───────│  Agent 1: Market Pipeline     │ ← OFFLINE SCRIPT
   │  (Main DB)      │ Ghi    │  (python agent1_pipeline.py)  │   chạy 1 lần rồi thoát
   │  NestJS đọc/ghi │ struct-│ Crawl → Extract → Embed       │
   └─────────────────┘ ured   └───────────────────────────────┘
   ┌─────────────────┐ data
   │      Redis      │◀──── NestJS lưu conversation history
   │ (Session Cache) │
   └─────────────────┘
```

---

## 2. TRIẾT LÝ KIẾN TRÚC AI: TWO-STAGE RETRIEVAL & ĐỒ THỊ ĐỘNG

Để giải quyết bài toán "Vector thưa" (Curse of Dimensionality) khi hệ thống mở rộng lên hàng ngàn ngành nghề, hệ thống tách biệt năng lực thành 2 lớp:

1. **Lớp 1: Universal Core Competencies (10 Năng lực Cốt lõi)**
   - **Tính chất:** Bất biến, ai cũng cần, nghề nào cũng có.
   - **Lưu trữ:** Nhúng thành một **Dense Vector 10-chiều** lưu tại **Pinecone**.
   - **Mục đích:** Tìm kiếm ngữ nghĩa cực nhanh ($O(1)$) qua thuật toán Cosine Similarity để lấy ra Top 50 ngành nghề phù hợp nhất (Stage 1 Fast Recall).

2. **Lớp 2: Domain/Role Specific Competencies (Năng lực Chuyên môn)**
   - **Tính chất:** Biến động, đa hình (Ví dụ: IT cần Python, Y tế cần Khám bệnh).
   - **Lưu trữ:** Chuẩn hóa theo định dạng **JSON-LD (Knowledge Graph)**.
   - **Vị trí lưu:** Nhét vào trường **Metadata** của chính Vector ngành nghề đó trong Pinecone.
   - **Mục đích:** Hệ thống sử dụng thuật toán **WFS (Weighted Fit Score)** với hàm phạt (Gap Penalty) để tính điểm trên các node kỹ năng đặc thù, lọc từ Top 50 xuống Top 3 (Stage 2 Precision Re-ranking).

---

## 3. PHÂN CHIA TRÁCH NHIỆM DATABASE (CQRS TRONG AI)

| Database | Nhiệm vụ Lưu trữ | Phục vụ cho ai? |
| :--- | :--- | :--- |
| **Pinecone (Vector DB)** | Chỉ lưu Vector 10-chiều (`core_competencies`) và Metadata JSON (`domain_competencies`). | Agent 3 (RAG). NestJS không được chọc vào Pinecone. |
| **PostgreSQL (SQL DB)** | Lưu thông tin chi tiết ngành nghề, mức lương, khu vực, mô tả hiển thị. Lưu User Profile và Roadmap đã tạo. | NestJS dùng để Hard Filtering và hiển thị lên Frontend. |
| **Redis (Cache)** | Lưu phiên chat, lịch sử chat tạm thời. | NestJS quản lý context cho Agent 2. |

---

## 4. LUỒNG DỮ LIỆU HOÀN CHỈNH (DATA FLOW)

### 4.1. Luồng Offline (Khởi tạo hệ thống)
- **Agent 1** crawl dữ liệu từ thị trường $ightarrow$ LLM tổng hợp ra `core_competencies` và `domain_competencies` $ightarrow$ Đẩy Vector lên Pinecone, đẩy dữ liệu số liệu (lương, địa điểm) vào PostgreSQL.

### 4.2. Luồng Chat Khám phá (Implicit Profiling)
- User gửi tin nhắn từ Next.js $ightarrow$ NestJS lấy history từ Redis $ightarrow$ Gọi Agent 2 (Port 8002).
- Agent 2 trả về `reply` (cho user) và cập nhật `core_scores`, `domain_scores`, `market_expectations` vào biến `profile_update`.
- NestJS lưu profile này vào PostgreSQL. Nếu `is_ready` = `false`, vòng lặp chat tiếp tục.

### 4.3. Luồng Khuyên hướng (Roadmap Generation)
- Khi Agent 2 trả về `is_ready` = `true`.
- NestJS lấy toàn bộ profile của user từ PostgreSQL và gọi Agent 3 (Port 8003).
- Agent 3 nhúng `core_scores` thành vector $ightarrow$ Query Pinecone lấy Top 50 (Stage 1).
- Lọc theo `market_expectations` (Lương, Khu vực).
- Agent 3 lấy `domain_competencies` từ Metadata Pinecone, đối chiếu với `domain_scores` của user để tính WFS, lấy Top 3 (Stage 2).
- LLM sinh ra Roadmap cho Top 3 kèm cảnh báo thị trường $ightarrow$ NestJS lưu vào PostgreSQL $ightarrow$ Next.js hiển thị giao diện đa lộ trình.

### 4.4. Luồng Phản hồi (Feedback/Refinement Loop)
Xử lý Edge Case khi người dùng không hài lòng với Roadmap đã tạo:
- User nhấn "Tôi muốn thay đổi" và gửi feedback (VD: "Tôi không thích làm IT").
- NestJS lật cờ `is_ready` = `false` trong PostgreSQL.
- NestJS gọi lại Agent 2, nhét Roadmap cũ và lời phàn nàn vào `conversation_history`.
- Agent 2B (Evaluator) đọc hiểu context, tự động trừ điểm `domain_scores` của ngành bị chê và hạ `confidence_scores` xuống.
- Agent 2A (Counselor) đặt câu hỏi mới để bẻ lái sang ngành nghề khác.
- Vòng lặp chat tiếp tục cho đến khi `is_ready` = `true` trở lại, gọi Agent 3 để tạo Roadmap mới.
