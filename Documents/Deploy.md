# HƯỚNG DẪN TRIỂN KHAI TOÀN DIỆN DỰ ÁN SKILLCOMPASS LÊN CLOUD

Tài liệu này hướng dẫn chi tiết cách cài đặt, cấu hình và khởi chạy hoàn chỉnh hệ thống **SkillCompass** (bao gồm NestJS Backend, Agent 1 Market Data Pipeline, Agent 2 Counselor, và Agent 3 Roadmap Service).

**Công nghệ sử dụng:**
- **Cơ sở dữ liệu**: Neon Cloud (PostgreSQL) & Pinecone (Vector Database)
- **Web Backend (NestJS)**: Deploy lên **Render** (Node Runtime)
- **AI Services (Python FastAPI)**: Deploy lên **Render** (Python Runtime)

---

## BƯỚC 1: KHỞI TẠO VÀ CẤU HÌNH DATABASE TRÊN NEON CLOUD & PINECONE

### 1. Hành động cụ thể & Chi tiết nhỏ nhất
- **Neon Cloud (PostgreSQL)**:
  - Truy cập Neon Console, khởi tạo dự án PostgreSQL. Copy chuỗi Connection String dạng:
    `postgresql://neondb_owner:npg_xxx@ep-xxx.ap-southeast-1.aws.neon.tech/neondb?sslmode=require`
  - Nhập dữ liệu thô ban đầu: Vào SQL Editor của Neon, chạy tập lệnh SQL để tạo các bảng `career_tracks`, `role_progressions`, `skill_trees` và nạp dữ liệu. (Hoặc chạy `npx prisma db push` từ máy local trỏ đến database của Neon).
  - **Lưu ý sống còn**: Chạy reset sequence ID cho các bảng có SERIAL PRIMARY KEY để tránh trùng lặp khóa chính khi tạo mới:
    ```sql
    SELECT pg_catalog.setval('public.career_tracks_id_seq', (SELECT MAX(id) FROM public.career_tracks), true);
    SELECT pg_catalog.setval('public.role_progressions_id_seq', (SELECT MAX(id) FROM public.role_progressions), true);
    SELECT pg_catalog.setval('public.skill_trees_id_seq', (SELECT MAX(id) FROM public.skill_trees), true);
    ```
- **Pinecone**:
  - Khởi tạo index `skillcompass-careers` trên Pinecone với dimension **10** (10 năng lực UCEF) và metric **cosine**.
  - Lưu lại `PINECONE_API_KEY` và `PINECONE_INDEX_NAME`.

### 2. Điểm phân vân / Lựa chọn
- *Phân vân*: Có nên dùng tính năng `synchronize: true` trong NestJS để tự đồng bộ bảng lên Neon?
- *Quyết định chuẩn*: **Không dùng synchronize: true**. Chúng ta dùng `npx prisma db push` để tạo cấu trúc bảng từ schema.prisma chuẩn, tránh việc ghi đè cấu trúc làm mất sạch dữ liệu thực tế trên Cloud.

### 3. Lỗi gặp phải tại bước này
- *Lỗi*: Khi chạy import file backup SQL lên Neon SQL Editor bị lỗi `unsupported command: \restrict` hoặc lỗi `COPY ... FROM stdin`.
- *Nguyên nhân*: Các câu lệnh pgAdmin tự động tạo ra bằng cú pháp terminal không tương thích với Web SQL Editor của Neon.
- *Cách sửa chi tiết*: Loại bỏ các dòng lệnh hệ thống bắt đầu bằng dấu gạch chéo ngược (`\`) và chuyển đổi cú pháp `COPY` thô sang định dạng `INSERT INTO` tiêu chuẩn.

---

## BƯỚC 2: CẤU HÌNH GIT AN TOÀN ĐỂ THỬ NGHIỆM ĐỘC LẬP

### 1. Hành động cụ thể & Chi tiết nhỏ nhất
Vì đây là đồ án làm chung với nhóm, bạn không nên sửa đổi trực tiếp trên nhánh chính mà nên fork và đổi remote để thử nghiệm độc lập.
- **Hành động**: Lên giao diện GitHub, nhấn nút **Fork** dự án `TeamFiveTactics_VNAI2026` về tài khoản cá nhân của bạn.
- **Thao tác Terminal**: Mở Git Bash tại thư mục dự án trên máy local, chạy lệnh kiểm tra remote:
  ```bash
  git remote -v
  ```

### 2. Lỗi gặp phải tại bước này
- **Lỗi**: Remote `origin` vẫn trỏ về dự án chung của nhóm, khi push code sẽ ghi đè lên nhánh chính và làm hỏng code của nhóm.
  - *Cách sửa chi tiết*: Chạy lệnh đổi URL remote `origin` trỏ sang repo cá nhân đã fork:
    ```bash
    git remote set-url origin https://github.com/TênTàiKhoảnCủaBạn/TeamFiveTactics_VNAI2026
    ```
    Kiểm tra lại bằng `git remote -v` để đảm bảo an toàn.

---

## BƯỚC 3: CẤU HÌNH & TRIỂN KHAI BACKEND NESTJS LÊN RENDER

### 1. Hành động cụ thể & Chi tiết nhỏ nhất
- Lên Render, tạo một **Web Service** mới, liên kết với repo GitHub cá nhân của bạn.
- Cấu hình các mục quan trọng:
  - **Root Directory**: `skillcompass/web/backend`
  - **Runtime**: Chọn **Node** (để build nhanh hơn và nhẹ RAM hơn Docker trên gói Free).
  - **Build Command**: `npm install && npm run build`
  - **Start Command**: `npm run start:prod`
- Thêm biến môi trường (Environment Variables):
  - `DATABASE_URL`: URL connection string của Neon Cloud (đã lấy ở Bước 1).
  - `COUNSELOR_SERVICE_URL`: URL công khai của Counselor Python Service sau khi deploy (Ví dụ: `https://skillcompass-counselor.onrender.com`).
  - `ROADMAP_SERVICE_URL`: URL công khai của Roadmap Python Service sau khi deploy (Ví dụ: `https://skillcompass-roadmap.onrender.com`).

### 2. Lưu ý cấu hình & Vận hành Backend
- **Mở khóa CORS**: Trong file `web/backend/src/main.ts`, bắt buộc gọi `app.enableCors()` trước `app.listen()` để không bị chặn các cuộc gọi từ client ngoài.
- **Prisma Client**: Để chạy được trên Render, đảm bảo đã chạy `npx prisma generate` trong bước build.

---

## BƯỚC 4: TRIỂN KHAI CÁC DỊCH VỤ PYTHON AI SERVICES LÊN RENDER

Hệ thống có hai microservices chạy độc lập bằng Python FastAPI: **Counselor (Port 8002)** và **Roadmap (Port 8003)**.

### 4.1. Triển khai Counselor Service (Agent 2)
- Tạo một **Web Service** mới trên Render trỏ đến cùng repo GitHub.
- Cấu hình:
  - **Root Directory**: `skillcompass/ai-services/counselor`
  - **Runtime**: Chọn **Python**.
  - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT` (Render tự động cấp cổng ngẫu nhiên qua biến `$PORT`).
- Biến môi trường:
  - `LLM_API_KEY`: API Key của dịch vụ LLM (FPT Cloud / DeepSeek).
  - `LLM_BASE_URL`: URL của LLM API.
  - `LLM_MODEL`: Tên model LLM sử dụng (ví dụ: `DeepSeek-V4-Flash`).

### 4.2. Triển khai Roadmap Service (Agent 3)
- Tạo tiếp một **Web Service** khác trên Render.
- Cấu hình:
  - **Root Directory**: `skillcompass/ai-services/roadmap`
  - **Runtime**: Chọn **Python**.
  - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
- Biến môi trường (Ngoài LLM, cần cấu hình thêm thông tin DB PostgreSQL của Neon và Vector DB Pinecone):
  - `LLM_API_KEY`, `LLM_BASE_URL`, `LLM_MODEL` (giống Counselor).
  - `POSTGRES_HOST`, `POSTGRES_PORT`, `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD` (Lấy từ connection string của Neon).
  - `PINECONE_API_KEY`, `PINECONE_INDEX_NAME` (Lấy từ Pinecone đã cấu hình ở Bước 1).

---

## BƯỚC 5: KHẮC PHỤC LỖI HARDCODE ENDPOINTS

### 1. Hiện tượng lỗi
- Mặc dù Vercel/Render báo deploy thành công, nhưng khi chạy thực tế từ Frontend, ứng dụng bị đơ hoặc lỗi kết nối, Console báo lỗi đỏ:
  `Failed to load resource: net::ERR_CONNECTION_REFUSED localhost:8002/chat` hoặc `localhost:8003/generate-roadmap`.

### 2. Nguyên nhân & Quy trình sửa lỗi
- **Nguyên nhân**: Trong mã nguồn NestJS Backend, địa chỉ API gọi sang Counselor và Roadmap đang bị viết cứng dạng `http://localhost:8002/chat` và `http://localhost:8003/generate-roadmap`.
- **Cách sửa chi tiết**:
  - Trong `chat.service.ts`, thay đổi:
    ```typescript
    private readonly counselorUrl = process.env.COUNSELOR_SERVICE_URL || 'http://localhost:8002/chat';
    ```
  - Trong `roadmap.service.ts`, thay đổi:
    ```typescript
    private readonly roadmapUrl = process.env.ROADMAP_SERVICE_URL || 'http://localhost:8003/generate-roadmap';
    ```
  - Sau đó, commit và push code lên GitHub cá nhân để Render tự động Redeploy.

---

## BƯỚC 6: KIỂM TRA ĐỐI CHIẾU VÀ NGHIỆM THU CUỐI CÙNG

### 1. Nghiệm thu E2E
- Gọi API khởi tạo hội thoại qua endpoint `/chat` của NestJS Backend trên Render (VD: `https://skillcompass-backend.onrender.com/chat`).
- Thực hiện chu kỳ chat 5-10 câu để hệ thống Evaluator ngầm đánh giá và tích lũy điểm UCEF chuẩn.
- Gọi `/roadmap/generate` để sinh lộ trình đa chiều và đảm bảo phản hồi JSON chứa đầy đủ thông tin so khớp thực tế từ Neon và Pinecone.

### 2. Lưu ý về hiện tượng ngủ đông (Cold Start)
- Do chạy trên các gói máy chủ miễn phí của Render, nếu không có request trong 15 phút, các server NestJS, Counselor, và Roadmap sẽ tự ngủ đông.
- Khi người dùng đầu tiên truy cập lại, thời gian phản hồi lượt đầu sẽ rất chậm (mất 30-50 giây) để Render khởi động lại container. Đây là hiện tượng bình thường của gói Free.
