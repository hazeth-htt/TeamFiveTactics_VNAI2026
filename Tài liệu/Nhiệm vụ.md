# BẢNG PHÂN CHIA NHIỆM VỤ DỰ ÁN: SKILLCOMPASS
*Khớp 100% với kiến trúc trong [Kế hoạch.md](file:///d:/AI/Kế hoạch.md)*

---

## 📐 KIẾN TRÚC TÓM TẮT (Để Thống Nhất Nhóm)

```
[Next.js :3000] ←→ [NestJS :4000] → [Agent 2 :8002] → profile → [Agent 3 :8003]
                         ↕ DB                                           ↕ Pinecone
                   PostgreSQL + Redis                           [Agent 1: offline script]
```

- **Thành** → Next.js | **Vinh** → NestJS + DB | **Tuân** → Agent 2, 3, script Agent 1 | **Thắng** → Data + QA

---

## 📋 BẢNG PHÂN CHIA NHIỆM VỤ CHI TIẾT

| Thành viên | Vai trò | Nhiệm vụ cụ thể (Task list) | Đầu ra bắt buộc (Deliverables) |
| :--- | :--- | :--- | :--- |
| **Tuân** | **AI Engineer** | **Agent 2 — Counselor + Evaluator (FastAPI, port 8002):**<br>- Tạo FastAPI service với endpoint `POST /chat`<br>- **Nhận vào:** `{ session_id, message, conversation_history }` — NestJS gửi kèm, KHÔNG tự đọc DB<br>- **Bên trong:** Thực hiện 2 LLM call song song:<br>  + Call 1 (Counselor): Tạo câu reply cho user, phong cách tự động thích nghi theo context suy luận từ hội thoại (không hỏi lại học sinh)<br>  + Call 2 (Evaluator): Chạy ngầm, phân tích hội thoại → trả `{ trait_scores, confidence_scores, context_inferred, is_ready }`<br>- **Trả về:** `{ reply, profile_update, is_ready }` → NestJS sẽ tự lưu DB<br>- Implement Hard Turn Limit (3-5 lượt/chủ đề) + Forced Transition<br>- Đưa Bias Guard vào System Prompt Evaluator<br><br>**Agent 3 — Roadmap Agent (FastAPI, port 8003):**<br>- Tạo FastAPI service với endpoint `POST /generate-roadmap`<br>- **Nhận vào:** `{ user_profile: { trait_scores, context } }` — NestJS gửi kèm sau khi lấy từ PostgreSQL<br>- **Bên trong:** RAG query Pinecone → embed profile → tìm top-k career tracks phù hợp → LLM generate roadmap<br>- **Trả về:** `{ user_profile_summary, paths[], disclaimer }` — bắt buộc ≥1 vocational + ≥1 academic trong `paths[]`<br>- System Prompt Agent 3 phải có Bias Guard cứng: cấm gợi ý theo giới tính/vùng miền<br><br>**Agent 1 — Market Pipeline (Script offline, KHÔNG phải server):**<br>- Viết `load_mock_data.py`: đọc JSON của Thắng → embed bằng OpenAI → ghi vào Pinecone + PostgreSQL<br>- Chạy 1 lần trước demo, sau đó thoát | 📦 **3 deliverables AI:**<br>① `ai-services/counselor/main.py` (FastAPI port 8002) — nhận JSON, trả JSON, không đọc DB<br>② `ai-services/roadmap/main.py` (FastAPI port 8003) — RAG + LLM, đọc Pinecone<br>③ `ai-services/market-pipeline/load_mock_data.py` — script nạp data 1 lần<br><br>Output chuẩn của Agent 3:<br>`{ user_profile_summary, paths[{ path_id, track_type, career_track, match_score, why_it_fits, role_progression, skill_tree }], disclaimer }` |
| **Vinh** | **Backend Engineer** | **NestJS API Gateway (Port 4000) — Duy nhất quản lý DB:**<br>- Khởi tạo NestJS project, cấu trúc module: `ChatModule`, `RoadmapModule`, `UserModule`<br>- Setup kết nối **PostgreSQL** (Prisma ORM) — schema: `users`, `sessions`, `profiles`, `roadmaps`<br>- Setup kết nối **Redis** — lưu conversation history với key `session:{id}`<br>- Không cài Pinecone trong NestJS (chỉ Agent 3 dùng)<br><br>**Endpoint 1 — `POST /api/chat/message`:**<br>1. Nhận `{ session_id, message }` từ Next.js<br>2. Lấy `conversation_history` từ Redis<br>3. Gọi `POST http://localhost:8002/chat` với `{ session_id, message, conversation_history }`<br>4. Nhận `{ reply, profile_update, is_ready }` từ Agent 2<br>5. Lưu `profile_update` vào PostgreSQL<br>6. Append message mới vào Redis<br>7. Nếu `is_ready = true` → tự động trigger Endpoint 2<br>8. Trả `{ reply }` về Next.js<br><br>**Endpoint 2 — `POST /api/career/roadmap`:**<br>1. Lấy `user_profile` từ PostgreSQL (bao gồm context đã infer từ Agent 2)<br>2. Gọi `POST http://localhost:8003/generate-roadmap` với `{ user_profile }`<br>3. Nhận `{ paths[], disclaimer }` từ Agent 3<br>4. Lưu roadmap vào PostgreSQL<br>5. Trả `{ paths[], disclaimer }` về Next.js<br><br>**Thống nhất API Contract với Tuân trước Hour 6** (xem Mục 7 trong Kế hoạch.md) | 🖥️ **NestJS API Gateway hoàn chỉnh:**<br>- 2 endpoints hoạt động ổn định<br>- PostgreSQL schema đầy đủ (Prisma migration)<br>- Redis lưu/đọc conversation history đúng<br>- Gọi Agent 2 và Agent 3 đúng format contract<br>- Xử lý lỗi khi AI service timeout hoặc trả lỗi |
| **Thành** | **Frontend Engineer** | **Next.js Web App (Port 3000):**<br>- Khởi tạo Next.js 14 (App Router) + Tailwind CSS<br>- **KHÔNG** có màn hình chọn loại học sinh — giao diện đầu tiên chỉ là 1 ô chat trống<br><br>**Màn hình 1 — Chat UI (`/`):**<br>- Ô nhập tin nhắn + nút gửi<br>- Hiển thị hội thoại kiểu bubble chat (user bên phải, AI bên trái)<br>- Typing indicator (hiệu ứng "đang gõ") trong lúc chờ reply<br>- Gọi `POST /api/chat/message` (NestJS) sau mỗi lần gửi<br>- Tự động chuyển sang Roadmap UI khi nhận được `paths[]` trong response<br><br>**Màn hình 2 — Multi-Path Roadmap UI (`/roadmap`):**<br>- Hiển thị nhiều **card song song** cho từng lộ trình trong `paths[]`<br>- Mỗi card: tên nghề, `track_type` (badge "Học nghề" / "Đại học"), `match_score` (progress bar), `why_it_fits`<br>- Click vào card → mở rộng hiển thị `role_progression` + `skill_tree` (dùng React Flow vẽ cây kỹ năng)<br>- `disclaimer` luôn hiển thị nổi bật phía trên tất cả các card<br>- **Không được ưu tiên** hiển thị lộ trình academic trước vocational — sắp xếp theo `match_score` | 💻 **Giao diện Next.js hoàn chỉnh:**<br>- Chat UI mượt mà, có typing indicator<br>- Multi-Path Roadmap UI hiển thị đủ card với `match_score`, `why_it_fits`, `skill_tree`<br>- Không có nút chọn loại học sinh ở bất kỳ đâu<br>- `disclaimer` hiển thị đúng vị trí<br>- Xử lý lỗi thân thiện khi API không phản hồi |
| **Thắng** | **Team Lead / QA / Data** | **Mock Data (Ưu tiên #1 — phải xong trước Hour 10):**<br>- Tạo `data/academic_tracks.json` — ít nhất 4-5 tracks: Data Science, Software Engineering, Marketing Digital, UI/UX Design, Business Analyst<br>- Tạo `data/vocational_tracks.json` — ít nhất 3-4 tracks: Kỹ thuật Điện - Tự động hóa, Kỹ thuật Ô tô, F&B/Đầu bếp - Quản lý nhà hàng, Y tế - Điều dưỡng Trung cấp<br>- Mỗi track JSON cần đủ: `career_track`, `track_type`, `role_hierarchy[]`, `skill_tree{}`, `avg_salary`, `typical_employers[]`, `region_demand{}`<br>- Bàn giao file JSON cho Tuân để chạy `load_mock_data.py`<br><br>**Quản lý tiến độ:**<br>- Đảm bảo Vinh + Tuân thống nhất API Contract trước Hour 6<br>- Track blockers: nếu Agent 2 chưa xong → Vinh mock response để Thành test UI<br><br>**QA Testing (Hour 40-46):**<br>- Test case 1: Học sinh cấp 3 chưa biết muốn gì → hệ thống có hỏi tự nhiên không, có gợi ý cả nghề lẫn ĐH không<br>- Test case 2: Người đang học trường nghề → hệ thống có tự nhận biết context không (không hỏi lại)<br>- Test case 3: Xem `paths[]` — có bắt buộc xuất hiện ít nhất 1 vocational path không<br>- Test case 4: Bias check — thử nhập profile "nữ, thích máy tính" → hệ thống có gợi ý toàn IT không, hay vẫn đa dạng<br>- Test case 5: Toàn bộ luồng từ chat → is_ready → roadmap render được không<br><br>**Pitch Deck (10 slide):**<br>- Slide 1: Vấn đề thực trạng Việt Nam (thừa thầy thiếu thợ, lệch pha)<br>- Slide 2: Điểm nghẽn — chưa có AI kết nối năng lực thực tế với tín hiệu thị trường<br>- Slide 3: SkillCompass là gì — "Hệ thống đầu tiên gợi ý vocational route ngang hàng đại học"<br>- Slide 4: Demo flow (chat → roadmap)<br>- Slide 5: Kiến trúc kỹ thuật (sơ đồ từ Kế hoạch.md)<br>- Slide 6: Anti-bias design — Multi-Path, Bias Guard, Disclaimer<br>- Slide 7: Dữ liệu thị trường thực tế<br>- Slide 8: Tác động — học sinh được trao quyền tự quyết<br>- Slide 9: Mô hình kinh doanh (B2School, B2C)<br>- Slide 10: Roadmap phát triển | 📊 **Deliverables:**<br>- `data/academic_tracks.json` (≥4 tracks, đầy đủ schema)<br>- `data/vocational_tracks.json` (≥3 tracks, đầy đủ schema)<br>- Báo cáo QA: 5 test case có kết quả pass/fail<br>- Pitch Deck 10 slide hoàn chỉnh |

---

## ⏱️ TIMELINE 48H

| Khung giờ | Tuân (AI) | Vinh (Backend) | Thành (Frontend) | Thắng (Data/QA) |
|---|---|---|---|---|
| **Hour 0-6** | Setup FastAPI, viết Agent 2 cơ bản | Setup NestJS, Prisma schema, Redis | Setup Next.js, Chat UI cơ bản | Hoàn thiện mock data JSON |
| **Hour 6** | ⚠️ **Sync API Contract với Vinh** | ⚠️ **Sync API Contract với Tuân** | Test UI với mock response | Bàn giao JSON cho Tuân |
| **Hour 7-16** | Hoàn thiện Agent 2 (Evaluator + Confidence Score) | Implement /api/chat/message đầy đủ | Chat UI hoàn chỉnh + Roadmap UI skeleton | — |
| **Hour 17-28** | Viết Agent 3 (RAG + Roadmap gen) + chạy load_mock_data.py | Implement /api/career/roadmap + WebSocket push | Multi-Path Roadmap UI với React Flow | — |
| **Hour 29-40** | Test và tinh chỉnh System Prompt Bias Guard | Integration test toàn luồng | Polish UI + responsive | Bắt đầu QA test cases |
| **Hour 40-46** | Hỗ trợ QA, fix bugs AI | Fix bugs backend | Fix UI bugs | Hoàn thiện 5 test cases |
| **Hour 46-48** | Chuẩn bị demo | Đảm bảo server ổn định | Final UI check | Hoàn thiện Pitch Deck |

---

## 🔗 ĐIỂM TÍCH HỢP DUY NHẤT

> Tuân và Vinh chỉ cần khớp đúng **2 contract** này — sau đó làm độc lập hoàn toàn:

**Contract 1: NestJS → Agent 2**
```json
// Request từ NestJS gửi sang Agent 2
{ "session_id": "abc", "message": "Em thích máy tính", "conversation_history": [...] }

// Response Agent 2 trả về NestJS
{ "reply": "...", "profile_update": { "trait_scores": {}, "context_inferred": "highschool" }, "is_ready": false }
```

**Contract 2: NestJS → Agent 3**
```json
// Request từ NestJS gửi sang Agent 3 (kèm profile đã lấy từ PostgreSQL)
{ "user_profile": { "trait_scores": {}, "context": "highschool" } }

// Response Agent 3 trả về NestJS
{ "user_profile_summary": "...", "paths": [...], "disclaimer": "..." }
```
