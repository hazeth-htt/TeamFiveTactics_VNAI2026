# HƯỚNG DẪN TRIỂN KHAI TOÀN DIỆN HỆ THỐNG SKILLCOMPASS

Tài liệu này hướng dẫn chi tiết cách cài đặt, cấu hình và khởi chạy hoàn chỉnh hệ thống **SkillCompass** (bao gồm NestJS Backend, Agent 1 Market Data Pipeline, Agent 2 Counselor, và Agent 3 Roadmap Service).

**Công nghệ sử dụng:**
- **DB**: PostgreSQL (Neon Cloud / Local) & Pinecone (Vector Database)
- **BE**: NestJS (Render / Docker / Local) & Python FastAPI (Render / VPS)

---

## BƯỚC 1: KHỞI TẠO VÀ CẤU HÌNH DATABASE (POSTGRESQL & PINECONE)

### 1. Hành động cụ thể & Chi tiết nhỏ nhất
- **PostgreSQL**: 
  - Tạo cơ sở dữ liệu tên là `SKILLCOMPASS` trong PostgreSQL local hoặc Neon Cloud.
  - Lưu lại chuỗi kết nối (Connection String) có dạng: `postgresql://postgres:123456@localhost:5432/SKILLCOMPASS?schema=public`
- **Pinecone**:
  - Đăng nhập vào Pinecone Console, khởi tạo một index tên là `skillcompass-careers`.
  - **Chi tiết bắt buộc**: Cấu hình số chiều của vector (Dimension) là **`10`** và độ đo khoảng cách (Metric) là **`cosine`** (vì hệ thống dùng vector 10 chiều tương ứng 10 năng lực chuẩn UCEF).
  - Copy **API Key** và tên index lưu vào file `.env` của `market-pipeline` và `roadmap`.

### 2. Điểm phân vân / Lựa chọn
- **Khi tạo bảng bằng Prisma**:
  - *Phân vân*: Nên tạo các cột dữ liệu năng lực rời rạc hay lưu dưới dạng `Json`?
  - *Quyết định chuẩn*: Lưu dưới dạng `Json` (như cột `trait_scores` trong bảng `user_profiles`) để tăng tính cơ động, cho phép mở rộng hoặc thu hẹp số lượng tiêu chí đánh giá trong tương lai mà không cần thực hiện `prisma migrate` để sửa schema DB.

### 3. Lỗi gặp phải tại bước này
- **Lỗi**: Khi chạy truy vấn lấy chi tiết ngành nghề từ PostgreSQL, hệ thống báo lỗi không tìm thấy bảng `career_tracks` hoặc bị lỗi phân tách khóa ngoại.
  - *Nguyên nhân*: Chưa đồng bộ schema của Prisma hoặc chưa nạp dữ liệu thô ban đầu vào cơ sở dữ liệu PostgreSQL.
  - *Cách sửa chi tiết*: Chạy lệnh `npx prisma db push` trong thư mục `web/backend` để tạo cấu trúc bảng, sau đó chạy lệnh `python load_mock_data.py` trong thư mục `market-pipeline` để nạp dữ liệu thô ban đầu.

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
    git remote set-url origin https://github.com/hazeth-htt/TeamFiveTactics_VNAI2026
    ```
    Kiểm tra lại bằng `git remote -v` để đảm bảo an toàn.

---

## BƯỚC 3: CẤU HÌNH BACKEND (NESTJS) & PRISMA

### 1. Hành động cụ thể & Chi tiết nhỏ nhất
- **Hành động**: Đẩy code backend lên GitHub, tạo một dự án NestJS trên máy chủ ảo (ví dụ: Render hoặc VPS).
- **Cấu hình**: 
  - Khai báo biến môi trường `DATABASE_URL` trong file `.env` (hoặc cấu hình Environment Variables trên Render) bằng chuỗi kết nối PostgreSQL ở Bước 1.
  - Chạy lệnh cài đặt và tạo Prisma client:
    ```bash
    npm install
    npx prisma generate
    ```

### 2. Lưu ý cấu hình & Vận hành Backend
- **Mở khóa CORS**: Trong file `backend/src/main.ts`, bắt buộc phải bật CORS bằng câu lệnh:
  ```typescript
  app.enableCors();
  ```
  trước khi gọi `app.listen()`. Nếu thiếu dòng này, trình duyệt của học sinh sẽ chặn toàn bộ các cuộc gọi API từ frontend.
- **Tắt đồng bộ cấu trúc tự động khi chạy Production**: Đảm bảo sử dụng Prisma migrations hoặc `prisma db push` thủ công thay vì để ứng dụng tự động kiểm tra và ghi đè schema lúc khởi chạy để tránh mất dữ liệu.

---

## BƯỚC 4: TRIỂN KHAI CÁC PYTHON AI SERVICES

Hệ thống có 3 cấu phần dịch vụ Python cần được thiết lập và khởi chạy.

### 4.1. Nạp và Embed dữ liệu tuyển dụng (Agent 1)
- **Hành động**: Di chuyển vào thư mục `ai-services/market-pipeline/`, thiết lập môi trường ảo và cài đặt thư viện:
  ```bash
  python -m venv venv
  venv\Scripts\activate  # Windows
  pip install -r requirements.txt
  ```
- **Chạy Script**:
  - Nạp dữ liệu thô vào PostgreSQL: `python load_mock_data.py`
  - Chạy pipeline trích xuất năng lực bằng LLM và tải vector lên Pinecone: `python agent1.py`

### 4.2. Khởi chạy Counselor Service (Agent 2 - Cổng 8002)
- **Hành động**: Di chuyển vào `ai-services/counselor/`, cài đặt thư viện và khởi chạy FastAPI server:
  ```bash
  python main.py
  ```
  *Dịch vụ sẽ khởi động trên cổng 8002.*

### 4.3. Khởi chạy Roadmap Service (Agent 3 - Cổng 8003)
- **Hành động**: Di chuyển vào `ai-services/roadmap/`, cấu hình đầy đủ các biến môi trường PostgreSQL và Pinecone giống hệt Agent 1, sau đó khởi chạy FastAPI server:
  ```bash
  python main.py
  ```
  *Dịch vụ sẽ khởi động trên cổng 8003.*

---

## BƯỚC 5: KHẮC PHỤC LỖI HARDCODE ENDPOINTS (LOCAL PORTS)

### 1. Hiện tượng lỗi
Mặc dù bạn đã deploy thành công NestJS Backend và các Python service lên đám mây, nhưng khi nhấn Bắt đầu chat hoặc Sinh lộ trình, trình duyệt báo lỗi đỏ lòm:
```
Failed to load resource: net::ERR_CONNECTION_REFUSED localhost:8002/chat
```

### 2. Nguyên nhân & Cách tìm lỗi nhanh
- **Nguyên nhân**: Trong mã nguồn, các địa chỉ gọi dịch vụ AI đang bị viết chết (hardcode) dạng `http://localhost:8002` hoặc `http://localhost:8003`. Khi đưa lên deploy, hệ thống không thể tìm thấy các cổng này trên máy client của người dùng.
- **Cách tìm thông minh**:
  - Nhấn `Ctrl + Shift + F` trong VS Code để tìm kiếm chuỗi `localhost:8002` hoặc `localhost:8003`.
  - Mở phần **Files to exclude** và nhập `**/node_modules, **/dist, **/.venv` để tránh quét vào các thư mục thư viện làm đơ máy.

### 3. Sửa code chi tiết
- Đưa các đường dẫn API của dịch vụ AI vào biến môi trường `.env` hoặc file cấu hình chung của NestJS:
  ```ini
  # NestJS .env
  COUNSELOR_SERVICE_URL=https://your-counselor-service.onrender.com
  ROADMAP_SERVICE_URL=https://your-roadmap-service.onrender.com
  ```
- Thay thế đoạn code gọi axios trong service bằng biến môi trường:
  ```typescript
  // Thay thế http://localhost:8002/chat bằng:
  const url = process.env.COUNSELOR_SERVICE_URL || 'http://localhost:8002/chat';
  ```

---

## BƯỚC 6: KIỂM TRA VÀ NGHIỆM THU CUỐI CÙNG

### 1. Hành động nghiệm thu
- Khởi động NestJS Backend (cổng 3000), Counselor (cổng 8002), và Roadmap (cổng 8003).
- Thực hiện giả lập gửi tin nhắn của học sinh qua cổng 3000. Chat 5-10 lượt để Counselor đánh giá đầy đủ hồ sơ.
- Kiểm tra cờ `is_ready` trả về từ API `/chat` của NestJS.
- Gửi yêu cầu sinh lộ trình qua `/roadmap/generate` và kiểm tra cấu trúc JSON trả về chứa đầy đủ:
  - `user_profile_summary` (Tóm tắt tính cách).
  - Danh sách `paths` (chứa ít nhất 1 lộ trình `academic` và 1 lộ trình `vocational`).
  - Các chi tiết `role_progression`, `skill_tree` và `market_warning` (cảnh báo mức lương/địa phương tuyển dụng).

### 2. Lưu ý về Hiện tượng ngủ đông (Cold Start)
- Nếu deploy các Python microservices lên các gói dịch vụ đám mây miễn phí (như Render Free), nếu không có lượt truy cập sau 15 phút, server sẽ tự động chuyển sang chế độ "ngủ đông".
- Lượt gọi API đầu tiên từ NestJS sang Python service sẽ phản hồi rất chậm (mất khoảng 30 - 50 giây) để chờ máy chủ ảo khởi động lại. Đây là hiện tượng bình thường, không phải lỗi hệ thống.
