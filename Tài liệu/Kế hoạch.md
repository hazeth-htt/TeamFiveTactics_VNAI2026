# KẾ HOẠCH KIẾN TRÚC HỆ THỐNG: SKILLCOMPASS
*Quyết định thiết kế: Hybrid Monolith Web + AI Microservices*

---

## 1. SƠ ĐỒ KIẾN TRÚC TỔNG THỂ

```
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
    Trả về:                           RAG query│ Đọc vectors
    - reply (hiện cho user)                    ↓
    - profile_update          ┌────────────────────────┐
    - is_ready flag           │    Pinecone / Qdrant   │
         │                    │      (Vector DB)        │
         │ NestJS lưu          └────────────▲───────────┘
         ↓                                  │ Ghi vectors
   ┌─────────────────┐         ┌────────────┴──────────────────┐
   │   PostgreSQL    │◀────────│  Agent 1: Market Pipeline     │ ← OFFLINE SCRIPT
   │  (Main DB)      │ Ghi     │  (python agent1.py)           │   chạy 1 lần rồi thoát
   │  NestJS đọc/ghi │ structured│ Crawl → Embed → Index       │
   └─────────────────┘ data    └───────────────────────────────┘
   ┌─────────────────┐
   │      Redis      │◀──── NestJS lưu conversation history
   │ (Session Cache) │
   └─────────────────┘
```

> **Ghi chú luồng Agent 2 → Agent 3:**
> Agent 2 không gọi thẳng Agent 3. NestJS đóng vai **orchestrator**:
> khi Agent 2 trả `is_ready = true`, NestJS lấy profile từ PostgreSQL rồi tự gọi Agent 3.
> Agent 3 nhận toàn bộ profile (bao gồm context đã infer từ Agent 2) trong request body.


---

## 2. PHÂN CHIA TRÁCH NHIỆM RÕ RÀNG

### Ai đọc/ghi vào đâu?

| Component | Pinecone | PostgreSQL | Redis | Ghi chú |
|---|:---:|:---:|:---:|---|
| **Agent 1** (pipeline) | ✅ Ghi | ✅ Ghi | ❌ | Chạy offline, chạy xong thoát |
| **Agent 2** (counselor) | ❌ | ❌ | ❌ | Pure processing — nhận JSON, trả JSON |
| **Agent 3** (roadmap) | ✅ Đọc | ❌ | ❌ | Chỉ RAG query vectors |
| **NestJS** | ❌ | ✅ Đọc/Ghi | ✅ Đọc/Ghi | Toàn quyền quản lý data |
| **Next.js** | ❌ | ❌ | ❌ | Chỉ gọi NestJS API |

> **Nguyên tắc:** NestJS là **người duy nhất** chịu trách nhiệm tầng DB (PostgreSQL + Redis). Các AI Service chỉ nhận dữ liệu qua request body và trả kết quả — không tự kết nối DB.

---

## 3. CHI TIẾT TỪNG THÀNH PHẦN

### 3.1. Next.js Frontend (Port 3000)
- **Framework:** Next.js 14 (App Router) + Tailwind CSS
- **Nhiệm vụ:** Render UI, gửi request đến NestJS
- **Không gọi** thẳng vào AI Services
- **Màn hình chính:**
  - Chat UI (1 ô nhập, không có nút chọn loại học sinh)
  - Multi-Path Roadmap UI (card/tab cho từng lộ trình)

---

### 3.2. NestJS Backend / API Gateway (Port 4000)
- **Framework:** NestJS (TypeScript) + Prisma ORM
- **Vai trò:** Nhận request từ Next.js → điều phối AI Services → trả kết quả

**Trách nhiệm DB:**
- **PostgreSQL:** Lưu user profile, trait scores, roadmap đã generate
- **Redis:** Lưu conversation history (key: `session:{id}`)

**API Endpoints:**

| Endpoint | Làm gì |
|---|---|
| `POST /api/chat/message` | Lấy history từ Redis → gọi Agent 2 → lưu kết quả → trả reply |
| `POST /api/career/roadmap` | Lấy profile từ PostgreSQL → gọi Agent 3 → lưu roadmap → trả paths |

**Luồng xử lý `/api/chat/message`:**
```
1. Nhận { session_id, message } từ Next.js
2. Lấy conversation_history từ Redis (key: session:{id})
3. POST → Agent 2: { session_id, message, conversation_history }
4. Agent 2 trả về: { reply, profile_update, is_ready }
5. Lưu profile_update vào PostgreSQL
6. Append message + reply vào Redis (conversation history)
7. Nếu is_ready = true → tự động gọi Agent 3 (xem mục 3.4)
8. Trả { reply } về Next.js
```

---

### 3.3. Agent 2 — Counselor + Evaluator (Port 8002)
**Bản chất:** Pure AI processing — không kết nối DB, không giữ state.

**API:**
```
POST /chat
Body: {
  session_id: str,
  message: str,
  conversation_history: list   ← NestJS gửi kèm, Agent 2 không cần tự lấy
}

Response: {
  reply: str,             ← câu trả lời hiển thị cho user
  profile_update: {       ← trait scores cập nhật (NestJS sẽ lưu)
    trait_scores: {...},
    confidence_scores: {...},
    context_inferred: str ← "highschool" / "vocational" / "college"
  },
  is_ready: bool          ← true khi đủ tiêu chí để generate roadmap
}
```

**Bên trong Agent 2 (2 LLM calls):**
```python
# Call 1: Counselor → tạo reply cho user
reply = openai.chat([
    SystemMessage("Bạn là cố vấn hướng nghiệp thấu cảm..."),
    *conversation_history,
    HumanMessage(message)
])

# Call 2: Evaluator → chạy ngầm, cập nhật profile (user không thấy)
evaluation = openai.chat([
    SystemMessage("Phân tích đoạn chat, trả về JSON: {trait_scores, confidence, is_ready}"),
    HumanMessage(f"Lịch sử: {conversation_history}\nTin mới: {message}")
])

return { reply, profile_update: evaluation, is_ready: evaluation.is_ready }
```

---

### 3.4. Agent 3 — Roadmap Agent (Port 8003)
**Bản chất:** RAG + LLM generation. Chỉ đọc Pinecone, không đọc PostgreSQL.

**API:**
```
POST /generate-roadmap
Body: {
  user_profile: {          ← NestJS lấy từ PostgreSQL rồi gửi vào
    trait_scores: {...},
    context: "highschool"
  }
}

Response: {
  user_profile_summary: str,
  paths: [                 ← đa lộ trình, bắt buộc có vocational
    {
      path_id: 1,
      track_type: "academic",
      career_track: str,
      match_score: int,
      why_it_fits: str,
      role_progression: [...],
      skill_tree: {...}
    },
    {
      path_id: 2,
      track_type: "vocational",
      ...
    }
  ],
  disclaimer: str
}
```

**Bên trong Agent 3:**
```python
# Bước 1: RAG query — tìm career tracks phù hợp với profile
query_vector = embed(user_profile)
relevant_tracks = pinecone.query(query_vector, top_k=5)

# Bước 2: LLM generate roadmap với Bias Guard
roadmap = openai.chat([
    SystemMessage("""
    Tạo đa lộ trình nghề nghiệp.
    NGHIÊM CẤM: gợi ý dựa trên giới tính hoặc vùng miền.
    BẮT BUỘC: ít nhất 1 vocational path + 1 academic path.
    BẮT BUỘC: mỗi path có why_it_fits dựa trên profile cụ thể.
    """),
    HumanMessage(f"Profile: {user_profile}\nDữ liệu thị trường: {relevant_tracks}")
])
```

---

### 3.5. Agent 1 — Market Data Pipeline (Offline Script)
**Bản chất:** Script Python chạy 1 lần trước demo, không phải server.

**Quy trình:**
```
python agent1_pipeline.py
    ↓
    Bước 1: Load data (crawl hoặc mock JSON)
    Bước 2: Dùng OpenAI embed từng career track → vector
    Bước 3: Ghi vector vào Pinecone
    Bước 4: Ghi structured data vào PostgreSQL
    ↓
    Thoát. Công việc hoàn thành.
```

**Chạy với Mock Data (khuyến nghị cho 48h):**
```bash
cd ai-services/market-pipeline
python load_mock_data.py
# Khoảng 5-10 phút → xong → Agent 2/3 đã có data
```

**Người phụ trách:** Tuân (script) + Thắng (mock data JSON)

---

## 4. LUỒNG DỮ LIỆU ĐẦY ĐỦ

### Luồng Chat (mỗi tin nhắn):
```
User gõ → Next.js
  → POST /api/chat/message (NestJS)
  → Lấy conversation_history từ Redis
  → POST /chat (Agent 2) kèm history
  ← { reply, profile_update, is_ready }
  → Lưu profile_update → PostgreSQL
  → Append history → Redis
  → Trả reply về Next.js → Hiển thị
```

### Luồng Generate Roadmap (khi is_ready = true):
```
NestJS nhận is_ready = true
  → Lấy user_profile từ PostgreSQL
  → POST /generate-roadmap (Agent 3) kèm profile
  ← { paths[], disclaimer }
  → Lưu roadmap → PostgreSQL
  → Push roadmap về Next.js qua WebSocket (hoặc polling)
  → Next.js render Multi-Path Roadmap UI
```

---

## 5. CẤU TRÚC THƯ MỤC

```
skillcompass/
├── web/
│   ├── frontend/          ← Next.js (Thành)
│   │   └── app/
│   │       ├── page.tsx   ← Chat UI
│   │       └── roadmap/   ← Roadmap UI
│   └── backend/           ← NestJS (Vinh)
│       └── src/
│           ├── chat/      ← gọi Agent 2, quản lý Redis
│           ├── roadmap/   ← gọi Agent 3, quản lý PostgreSQL
│           └── user/
│
├── ai-services/           ← Python (Tuân)
│   ├── counselor/         ← Agent 2 (FastAPI, port 8002)
│   │   ├── main.py
│   │   └── requirements.txt
│   ├── roadmap/           ← Agent 3 (FastAPI, port 8003)
│   │   ├── main.py
│   │   └── requirements.txt
│   └── market-pipeline/   ← Agent 1 (script, chạy 1 lần)
│       ├── agent1.py 
│       ├── load_mock_data.py
│       └── requirements.txt
│
└── data/                  ← Mock Data (Thắng)
    ├── academic_tracks.json
    └── vocational_tracks.json
```

---

## 6. THỨ TỰ KHỞI ĐỘNG

```a
Bước 0: python load_mock_data.py      ← nạp data vào Pinecone + PostgreSQL (1 lần)

Bước 1: uvicorn counselor.main:app --port 8002   ← Agent 2 sẵn sàng
Bước 2: uvicorn roadmap.main:app --port 8003     ← Agent 3 sẵn sàng
Bước 3: npm run start:dev  (trong web/backend)   ← NestJS sẵn sàng
Bước 4: npm run dev        (trong web/frontend)  ← Next.js sẵn sàng
```

---

## 7. API CONTRACT (Vinh & Tuân phải thống nhất trước Hour 6)

> Đây là "hợp đồng" giữa NestJS và AI Services. Hai bên làm độc lập nhưng phải khớp format này.

### Contract: NestJS → Agent 2
```typescript
// Request
{ session_id: string, message: string, conversation_history: Message[] }

// Response
{
  reply: string,
  profile_update: { trait_scores: object, confidence_scores: object, context_inferred: string },
  is_ready: boolean
}
```

### Contract: NestJS → Agent 3
```typescript
// Request
{ user_profile: { trait_scores: object, context: string } }

// Response
{
  user_profile_summary: string,
  paths: Path[],   // Path = { path_id, track_type, career_track, match_score, why_it_fits, role_progression, skill_tree }
  disclaimer: string
}
```
