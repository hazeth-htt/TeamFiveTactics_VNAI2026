# Career Pilot (SkillCompass)

Career Pilot (also known as SkillCompass) is an end-to-end, AI-powered career counseling and adaptive roadmap planning system. It bridges the gap between students' true capacities (derived through thấu cảm / implicit psychological profiling) and real-time labor market hiring demand. Designed as a Hybrid Monolith Web + AI Microservices architecture, it integrates Next.js, NestJS, Neon PostgreSQL (SQL DB), Pinecone (Vector DB), and Redis (Session Cache) to deliver highly personalized, data-driven, and bias-guarded career paths.

---

# Table of Contents
- [1. Background](#1-background)
- [2. Problem Statement](#2-problem-statement)
- [3. Proposed Solution](#3-proposed-solution)
- [4. Solution Overview](#4-solution-overview)
- [5. System Architecture](#5-system-architecture)
- [6. AI Architecture](#6-ai-architecture)
- [7. Technical Architecture](#7-technical-architecture)
- [8. Data Flow](#8-data-flow)
- [9. Core Features](#9-core-features)
- [10. AI Workflow](#10-ai-workflow)
- [11. Project Structure](#11-project-structure)
- [12. Technology Stack](#12-technology-stack)
- [13. Prerequisites](#13-prerequisites)
- [14. Installation](#14-installation)
- [15. Configuration](#15-configuration)
- [16. Running the Project](#16-running-the-project)
- [17. API Documentation](#17-api-documentation)
- [18. Deployment](#18-deployment)
- [19. Security Considerations](#19-security-considerations)
- [20. Scalability](#20-scalability)
- [21. Performance Optimization](#21-performance-optimization)
- [22. Limitations](#22-limitations)
- [23. Future Improvements](#23-future-improvements)
- [24. References](#24-references)

---

# 1. Background

In developing economies like Vietnam, high school students frequently make career and educational choices based on intuition, peer trends, or parental expectations. This subjective approach causes a severe misalignment between academic pipelines and actual workforce demands:
* **Workforce Mismatch:** A surplus of graduates in saturated sectors alongside critical shortages in vocational and specialized technical fields.
* **Inadequate Tooling:** Legacy guidance methods depend on generic, self-reported psychometric tests (e.g., MBTI, Holland Codes). These surveys suffer from social desirability bias (students picking idealized profiles rather than representing true habits) and generate output entirely divorced from market statistics.
* **Static Guidance:** Standard counseling ignores current economic signals, such as regional salary trends, local talent shortages, or changing hiring demands. Consequently, recommending "Engineering" has little value if the student's geographic area lacks manufacturing/IT infrastructure but desperately needs automation technician skills.

Solving this problem is crucial to reducing post-graduation underemployment, stabilizing local economies, and optimizing educational paths.

---

# 2. Problem Statement

The core challenges Career Pilot addresses include:
* **The Self-Reporting Biases:** Standard multi-choice surveys allow students to consciously adjust answers to fit social expectations.
* **Disconnection from Market Reality:** Career recommendations must account for regional hire availability, salary distributions, and local skill gaps.
* **Boxed-In Career Recommendations:** Recommending a career path without offering alternative vocational routes, micro-credentials, or clear, actionable learning checkpoints.
* **Ethical Prejudices:** Pre-existing algorithmic biases (such as gender and regional discrimination) that push female students away from STEM or suggest lower-paying fields based on geography.

### Stakeholders and Success Criteria
* **Students:** Receive interactive, empathetic AI counseling and actionable, real-time localized roadmaps.
* **Counselors & Educators:** Gain structural student profiles showing validated traits, expectations, and market-linked recommendations.
* **Success Criteria:** Zero hardcoded bias in recommendations, higher student satisfaction compared to standard MBTI testing, real-time matching accuracy validated by database metrics, and clear separation of academic and vocational options.

---

# 3. Proposed Solution

Career Pilot presents a hybrid system where **market realities** directly control **personalized guidance**.

```
[Real-Time Job Postings / Market Data]
               ↓
     [AI Market Pipeline] (Agent 1)
               ↓
    [Contextual Labor Market Graph] (Pinecone/Postgres)
               ↑ (Matched via Cosine Similarity + WFS)
[Empathetic Implicit Profiling] (Agent 2) ← [Student Conversation]
               ↓
   [Actionable Career Roadmap] (Agent 3)
```

### Design Philosophy & Core Innovations
1. **Empathetic, Dialog-Driven Profiling:** Eliminates questionnaires. AI acts as a counselor, inferring capabilities implicitly through dynamic conversational probes.
2. **Two-Stage RAG Matching Algorithm:**
   * **Stage 1 (Fast Recall):** Vector space similarity over a 10-dimensional Universal Core Competency schema.
   * **Stage 2 (Precision Re-ranking):** A Weighted Fit Score (WFS) utilizing an **Asymmetric Gap Penalty** to compare student scores against specific professional requirements.
3. **Dual Academic/Vocational Paths:** Rejects the "university-only" bias by presenting distinct, localized alternatives (vocational schools, apprenticeships) with practical, near-term feedback loops.

---

# 4. Solution Overview

Career Pilot operates in a cyclic, multi-agent pipeline spanning data collection, profiling, matching, and refinement:

```mermaid
flowchart TD
    %% Market Pipeline (Agent 1)
    subgraph Market_Pipeline_Agent_1 [Agent 1: Market Pipeline - Offline]
        A[Raw Job Postings + Local Salaries] --> B[LLM Extraction & Semantic Scoring]
        B --> C[Ghi Vector / Metadata Pinecone]
        B --> D[Ghi Structured Data PostgreSQL]
    end

    %% User Interaction (Agent 2)
    subgraph Conversation_Profiling_Agent_2 [Agent 2: Counselor + Evaluator - Online]
        E[User Message] --> F[NestJS API Gateway]
        F --> G[Redis Session History Fetch]
        G --> H[Agent 2A: Counselor Agent]
        G --> I[Agent 2B: Evaluator Agent]
        I -->|Implicit Profiling| J[Update UserProfile in Postgres]
        H -->|Empathetic Questioning| K[Next Chat Reply to User]
        I -->|is_ready Stopping Criteria| L{Is Ready?}
    end

    %% Roadmap Generation (Agent 3)
    subgraph Roadmap_Matching_Agent_3 [Agent 3: Roadmap Agent - RAG]
        L -->|Yes| M[NestJS calls Agent 3]
        M --> N[Query Top 50 via Pinecone Cosine Search]
        N --> O[Hard Filtering: Location & Salary PostgreSQL]
        O --> P[Weighted Fit Score WFS Reranking]
        P --> Q[Select Top 3 Paths: Academic + Vocational]
        Q --> R[LLM Generates Actionable Roadmap & Warns Trends]
        R --> S[Save to roadmaps Postgres]
        S --> T[Frontend Multi-Path UI]
    end

    %% Feedback Loop
    T -->|User Feedback / Refinement| U[Set is_ready = False]
    U --> F
```

---

# 5. System Architecture

The project utilizes a **Hybrid Monolith Web + AI Microservices** architecture pattern:
* **The Monolith Web Layer (Next.js & NestJS):** Handles UI rendering, identity/authentication, database management, and Redis session state cache. This architecture provides fast response times, simple transactions, and centralized coordination.
* **AI Microservices Layer (FastAPI):** Splitting AI workloads into isolated Python services allows for independent scaling, avoids Node.js CPU-blocking issues during heavy LLM/RAG computations, and accommodates distinct dependency footprints.

### Architectural Decisions & Tradeoffs
* **CQRS in AI Data Partitioning:** Pinecone acts as the read-heavy Vector database (storing semantic metrics and job profile metadata). PostgreSQL stores structured entities, relational links, and finalized roadmaps. This prevents slow SQL queries on massive text descriptions.
* **Redis Session Caching:** Conversation logs are cached in Redis to maintain fast retrieval, migrating to PostgreSQL for cold archiving once `is_ready` triggers.
* **Free-Tier Cold Starts:** Since resources are deployed on Render's free runtime, services spin down after 15 minutes of inactivity. High-level try/catch shielding prevents frontend errors, serving a dynamic fallback while AI agents initialize.

---

# 6. AI Architecture

Career Pilot features a three-agent system designed for data gathering, profiling, and RAG execution:

```
                  +----------------------------------+
                  |  Agent 1: Market Data Pipeline   |
                  +----------------------------------+
                                   | (Saves Standard Profiles)
                                   v
+------------------+      +------------------+      +------------------+
|  User Message    | ---> |     Agent 2      | ---> |     Agent 3      |
|  (Implicit Input)|      | Counselor / Eval |      |   Roadmap RAG    |
+------------------+      +------------------+      +------------------+
                                   | (UserProfile)           | (Top 3 Paths)
                                   v                         v
                           [PostgreSQL DB]           [Frontend UI]
```

### Multi-Agent Specifications

#### 1. Agent 1: Market Data Pipeline (Offline / Cron)
* **Purpose:** Processes raw job listings into structured profile targets.
* **Input:** Raw job postings text, geographic attributes, salary brackets.
* **Output:** JSON mapping 10 core competencies (1-10 scale), location metrics, required credentials, and trend vectors.
* **Interaction:** Writes vectors directly to Pinecone and structured data to PostgreSQL.
* **Failure Handling:** Invalid records are isolated and logged; execution continues with next batch.

#### 2. Agent 2: Counselor & Evaluator Microservice (FastAPI - Port 8002)
* **Purpose:** Conducts natural conversations while extracting user capacity levels.
* **Sub-agents:**
  * **Agent 2A (Counselor):** Employs soft-bridging and contextual prompts to ask open-ended questions. Avoids direct self-rating inquiries.
  * **Agent 2B (Evaluator):** Extract scores for the 10 core traits from history, identifying off-topic chats or target-related clues.
* **Memory & Stopping Criteria:** Uses Exponential Moving Average (EMA) to merge new evaluator findings with existing profiles:
  $$\text{Score}_{t} = (0.7 \times \text{Score}_{t-1}) + (0.3 \times \text{NewScore})$$
  Increments confidence levels by $0.25$ per trait mention. The process halts (`is_ready = True`) when overall confidence reaches $\ge 0.75$ or conversation turn count $\ge 10$.
* **Failure Handling:** Backend routes to dynamic fallback questions if the Python service fails to respond in 60 seconds.

#### 3. Agent 3: Roadmap Agent (FastAPI - Port 8003)
* **Purpose:** Generates a structured multi-path career roadmap.
* **Input:** User profile `trait_scores` and `market_expectations`.
* **Output:** 2-3 matched careers containing role progressions, skill trees, and location warnings.
* **Asymmetric Gap Penalty Algorithm:** Implements Weighted Fit Score (WFS) over specialized skills:
  * Over-qualification is rewarded minimally, while skill deficiencies result in a high penalty to maintain realistic targets:
  $$\Delta = \text{UserScore} - \text{RequiredLevel}$$
  $$\text{Penalty} = \begin{cases} 
      \Delta \times 0.2 & \text{if } \Delta \ge 0 \\
      \Delta \times 1.5 & \text{if } \Delta < 0 
  \end{cases}$$
* **Bias Guard:** Restricts the LLM system prompt from using gendered words or region-locked biases. Recommends at least one vocational track along with academic options.

---

# 7. Technical Architecture

The technology stack is divided into distinct responsibilities:

* **Frontend (Next.js 16 & React 19):** Single Page Application structure with tailwind styles, dynamic progress meters, and responsive layouts.
* **Backend (NestJS 10):** Built as an Express application serving JSON APIs. Integrates Prisma ORM to communicate with Neon PostgreSQL.
* **Database (Neon Cloud PostgreSQL):** Standard transactional storage. Houses the user records, career paths, and session statistics.
* **Vector DB (Pinecone):** Serves 10-dimensional dense vectors to support cosine similarity lookups.
* **Cache (Redis):** Handles session tokens, conversation history arrays, and active state indicators.
* **External APIs:** Integrates OpenAI API and Gemini API for prompt evaluation and roadmap writing.

---

# 8. Data Flow

The following sequence diagram details the end-to-end request lifecycle:

```mermaid
sequenceDiagram
    autonumber
    actor User as Học sinh
    participant FE as Next.js Frontend
    participant BE as NestJS Backend
    participant DB as Neon PostgreSQL
    participant A2 as Agent 2 (Counselor/FastAPI)
    participant A3 as Agent 3 (Roadmap/FastAPI)

    User->>FE: Gửi tin nhắn đầu tiên ("Tôi thích sáng tạo")
    FE->>BE: POST /api/chat/message { session_id, message }
    BE->>DB: Kiểm tra / Khởi tạo Session & UserProfile
    BE->>DB: Lưu tin nhắn của User vào conversation_messages
    BE->>DB: Lấy lịch sử hội thoại trước đó
    BE->>A2: POST /chat { session_id, message, current_state, history }
    Note over A2: Agent 2B (Evaluator) chấm điểm<br/>Agent 2A (Counselor) chọn câu hỏi tiếp theo
    A2-->>BE: Trả về { replies, profile_update, is_ready }
    BE->>DB: Cập nhật UserProfile (trait_scores, confidence_scores)
    BE->>DB: Lưu tin nhắn của Assistant vào conversation_messages
    BE-->>FE: Trả về { reply: string, is_ready: boolean }
    FE-->>User: Hiển thị phản hồi từ AI Counselor

    Note over User, FE: Trò chuyện diễn ra đến khi is_ready = true

    User->>FE: Click "Xem Lộ trình chi tiết"
    FE->>BE: POST /api/career/roadmap { session_id }
    BE->>DB: Lấy UserProfile & Lịch sử hội thoại
    BE->>A3: POST /generate-roadmap { user_profile, history }
    Note over A3: Query Pinecone (Top 50 Cosine)<br/>Lọc theo Lương/Địa điểm (Postgres)<br/>Tính điểm WFS & Gọi LLM chống Bias
    A3-->>BE: Trả về JSON { user_profile_summary, paths, disclaimer }
    BE->>DB: Lưu/Upsert thông tin vào bảng roadmaps
    BE-->>FE: Trả về kết quả lộ trình và trait_scores
    FE-->>User: Render biểu đồ 10 năng lực + 3 Lộ trình chi tiết
```

---

# 9. Core Features

### 1. Market Data Pipeline & Extraction
* **Purpose:** Populates the system with real-world target profiles.
* **Implementation:** Combines Python scraping scripts with LLM extraction rules to format unstructured job listings into structured profile scores.

### 2. Conversational Profiling (Implicit Profiling)
* **Purpose:** Builds student capability maps through natural dialog.
* **Implementation:** Employs a dual-tier query system. Initiates conversation with baseline questions, shifting to specialized topics when candidate preference signals appear.

### 3. Multi-Path Roadmap Matching
* **Purpose:** Recommends concrete career tracks.
* **Implementation:** Matches student profiles to career targets via Cosine similarity. Uses asymmetric weighting logic to filter matching roles based on minimum salaries and location preferences.

### 4. Interactive Feedback & Refinement Loop
* **Purpose:** Enables path adjustments without resetting progress.
* **Implementation:** If a student rejects a recommendation, the system lowers the corresponding industry matching weight, recalculating the next best routes.

---

# 10. AI Workflow

```
[User Message Received]
          ↓
[Load Session & Context]
          ↓
[Agent 2B: Evaluate Traits & Expectations]
          ↓
[Apply EMA Update to Profile State]
          ↓
[Evaluate Stop Criteria (Confidence >= 0.75 or Turn >= 10)]
          ↓
   ┌──────┴──────┐
   ▼ (No)        ▼ (Yes: is_ready = True)
[Select Next    [Trigger Counselor Closure Msg]
 Trait Target]   [Expose "View Roadmap" Button on FE]
   │             │
   └──────┬──────┘
          ▼
[Execute Agent 2A LLM Response Generator]
          ↓
[Deliver Empathetic Chat Reply to User]
```

---

# 11. Project Structure

```text
TeamFiveTactics_DEMO/
├── Documents/                        # Hệ thống tài liệu kiến trúc, hướng dẫn triển khai
│   ├── Deploy.md                     # Hướng dẫn chi tiết thiết lập Render, Neon, Pinecone
│   ├── solution.md                   # Mô tả ý tưởng sản phẩm, thuật toán WFS
│   └── đề-bài.md                     # Yêu cầu dự án, tiêu chí đánh giá Hackathon
├── skillcompass/
│   ├── ai-services/                  # Dịch vụ Python AI Microservices
│   │   ├── counselor/                # Agent 2: Counselor + Evaluator (FastAPI)
│   │   │   ├── main.py               # API endpoints (Port 8002)
│   │   │   ├── logic/                # Xử lý hội thoại & tính confidence
│   │   │   └── prompts/              # System Prompts của Counselor & Evaluator
│   │   ├── roadmap/                  # Agent 3: RAG & Sinh lộ trình sự nghiệp (FastAPI)
│   │   │   ├── main.py               # API endpoints (Port 8003)
│   │   │   ├── rag_service.py        # Cosine Similarity Pinecone & Postgres query
│   │   │   └── roadmap_generator.py  # LLM sinh roadmap, tích hợp Bias Guard
│   │   └── market-pipeline/          # Agent 1: Cào & xử lý dữ liệu thô (Offline script)
│   │       ├── agent1.py             # Script chạy offline chính
│   │       └── load_mock_data.py     # Script nạp nhanh dữ liệu mẫu lên DB
│   └── web/                          # Web Application Layer
│       ├── backend/                  # NestJS Application (Port 4000)
│       │   ├── src/
│       │   │   ├── chat/             # Chat Controller, Service, Module
│       │   │   ├── roadmap/          # Roadmap Controller, Service, Module
│       │   │   └── user/             # Authentication & User Management (JWT)
│       │   └── prisma/               # Schema định nghĩa DB PostgreSQL & Migrations
│       └── frontend/                 # Next.js Application (Port 3000/3002)
│           ├── src/
│           │   ├── app/              # Next.js App Router (layout, page)
│           │   ├── views/            # Các view chính: ChatView, ResultsView
│           │   └── types/            # Định nghĩa Interface TypeScript
│           └── package.json          # Next.js dependencies
└── Readme.md                         # Báo cáo kỹ thuật chi tiết của dự án
```

---

# 12. Technology Stack

| Technology | Purpose | Reason Chosen | Alternative Considered |
|:---|:---|:---|:---|
| **Next.js 16 (React 19)** | Client UI Portal | Fast Server-side rendering (SSR), simple App router routing. | Vite React SPA (Lacks native SSR optimizations) |
| **NestJS 10** | API Gateway & Main Backend | Modular architecture, TypeScript support, simple integration with Prisma. | Express.js (Lacks modular structure out of box) |
| **FastAPI** | AI Services Web Wrapper | Lightweight execution, high-performance concurrency, simple Pydantic integration. | Flask (Slower asynchronous processing) |
| **Prisma ORM** | Database Layer Access | Automatic TS generation matching DB Schema, fast migration executions. | TypeORM (Verbose syntax, slower migration workflows) |
| **PostgreSQL (Neon Cloud)** | Relational Data Storage | Serverless design, auto-scaling capabilities, reliable transaction management. | MySQL (Lacks built-in JSONB indexing optimization) |
| **Pinecone** | Vector Matching Engine | Fully managed vector matching, supports quick cosine similarity lookups. | Qdrant / pgvector (Requires self-hosting configuration) |
| **Redis** | Active Session Caching | High-speed memory storage for conversation states. | PostgreSQL only (Causes write bottlenecks on long sessions) |

---

# 13. Prerequisites

* **Node.js:** Version 18.x or newer (v20+ recommended).
* **Python:** Version 3.10.x up to 3.13.x.
* **PostgreSQL:** Neon Cloud account or a local instance (v15+).
* **Pinecone Account:** Free starter tier index.
* **Docker:** Optional (Required if running databases locally).

---

# 14. Installation

Clone the repository and install the dependencies:

```bash
git clone https://github.com/truntain/TeamFiveTactics_VNAI2026.git
cd TeamFiveTactics_VNAI2026
```

### 1. Web Backend (NestJS)
```bash
cd skillcompass/web/backend
npm install
npx prisma generate
```

### 2. Web Frontend (Next.js)
```bash
cd ../frontend
npm install
```

### 3. AI Services (Python)
Ensure you set up a virtual environment:
```bash
cd ../../..
python -m venv .venv
# On Windows
.venv\Scripts\activate
# On Linux/macOS
source .venv/bin/activate

pip install -r skillcompass/ai-services/counselor/requirements.txt
pip install -r skillcompass/ai-services/roadmap/requirements.txt
```

---

# 15. Configuration

### 1. Web Backend (`skillcompass/web/backend/.env`)
```env
DATABASE_URL="postgresql://neondb_owner:YOUR_NEON_PASSWORD@ep-young-dew-azq536tb-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"
COUNSELOR_SERVICE_URL="http://localhost:8002"
ROADMAP_SERVICE_URL="http://localhost:8003"
JWT_SECRET="HACKAI"
```

### 2. Frontend (`skillcompass/web/frontend/.env.local`)
```env
NEXT_PUBLIC_BACKEND_URL="http://localhost:4000"
```

### 3. Counselor Service (`skillcompass/ai-services/counselor/.env`)
```env
LLM_API_KEY="your-gemini-or-openai-api-key"
LLM_BASE_URL="https://api.openai.com/v1" # Or official Gemini API endpoint
LLM_MODEL="gpt-4o-mini"
```

### 4. Roadmap Service (`skillcompass/ai-services/roadmap/.env`)
```env
LLM_API_KEY="your-gemini-or-openai-api-key"
LLM_BASE_URL="https://api.openai.com/v1"
LLM_MODEL="gpt-4o-mini"
DATABASE_URL="postgresql://neondb_owner:YOUR_NEON_PASSWORD@ep-young-dew-azq536tb-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"
PINECONE_API_KEY="your-pinecone-api-key"
PINECONE_INDEX_NAME="skillcompass-careers"
```

---

# 16. Running the Project

Follow these steps to run the complete system locally:

### 1. Run PostgreSQL & Setup Schema
Push schema models to Neon PostgreSQL database:
```bash
cd skillcompass/web/backend
npx prisma db push
```

### 2. Run Python Counselor Service (Agent 2)
```bash
# In virtual environment (.venv)
cd skillcompass/ai-services/counselor
python main.py
```
*Expected console output:*
```text
INFO:     Uvicorn running on http://127.0.0.1:8002 (Press CTRL+C to quit)
```

### 3. Run Python Roadmap Service (Agent 3)
```bash
# In virtual environment (.venv)
cd skillcompass/ai-services/roadmap
python main.py
```
*Expected console output:*
```text
INFO:     Uvicorn running on http://127.0.0.1:8003 (Press CTRL+C to quit)
```

### 4. Start NestJS Backend
```bash
cd skillcompass/web/backend
npm run start:dev
```
*Expected console output:*
```text
[Nest] 15284  - 07/18/2026, 9:41:28 PM     LOG [NestApplication] Nest application successfully started
```

### 5. Start Next.js Frontend
```bash
cd skillcompass/web/frontend
npm run dev
```
Open **`http://localhost:3000`** (or `http://localhost:3002` if configured) on your browser.

---

# 17. API Documentation

### NestJS Backend HTTP Endpoints

#### 1. Authentication

* **POST** `/api/auth/register`
  * Description: Creates a new student user.
  * Payload:
    ```json
    { "email": "demo@gmail.com", "password": "abc@123", "username": "demo" }
    ```
  * Response (201):
    ```json
    { "message": "Đăng ký thành công" }
    ```

* **POST** `/api/auth/login`
  * Description: Validates credentials and returns JWT session token.
  * Payload:
    ```json
    { "email": "demo@gmail.com", "password": "abc@123" }
    ```
  * Response (200):
    ```json
    { "token": "eyJhbGciOiJIUzI1NiIsIn...", "user": { "email": "demo@gmail.com", "username": "demo" } }
    ```

#### 2. AI Chat Interaction

* **POST** `/api/chat/message`
  * Description: Sends student answer to the evaluator and retrieves counselor reply.
  * Payload:
    ```json
    { "session_id": "c7c642b3-96b0-466a-93e8-5b1239c09440", "message": "Tôi thích học lập trình web" }
    ```
  * Response (200):
    ```json
    {
      "reply": "Tuyệt vời! Lập trình web mở ra rất nhiều cơ hội. Bạn có thích tự tay thiết kế giao diện không?",
      "is_ready": false
    }
    ```

* **GET** `/api/chat/history/:session_id`
  * Description: Restores active messages from database during session loads.
  * Response (200):
    ```json
    {
      "messages": [
        { "role": "user", "content": "Tôi thích học lập trình web" },
        { "role": "assistant", "content": "Tuyệt vời! Lập trình web..." }
      ],
      "is_ready": false
    }
    ```

#### 3. Career Roadmap Generation

* **POST** `/api/career/roadmap`
  * Description: Returns dynamic academic and vocational roadmaps for a completed session.
  * Payload:
    ```json
    { "session_id": "c7c642b3-96b0-466a-93e8-5b1239c09440" }
    ```
  * Response (200):
    ```json
    {
      "user_profile_summary": "Học sinh đam mê công nghệ phần mềm thực hành...",
      "trait_scores": {
        "analytical_thinking": 8.5,
        "problem_solving": 7.0,
        "effective_communication": 5.0
      },
      "paths": [
        {
          "path_id": 1,
          "track_type": "academic",
          "career_track": "Kỹ sư phần mềm",
          "match_score": 85,
          "why_it_fits": "Phù hợp với tư duy logic tốt...",
          "role_progression": [
            { "level": "Junior", "title": "Junior Developer", "description": "Lập trình chức năng" }
          ],
          "skill_tree": {
            "fundamentals": ["Cấu trúc dữ liệu", "Giải thuật"],
            "core_technologies": ["TypeScript", "NestJS"],
            "advanced_skills": ["Cloud Architecture"]
          }
        }
      ],
      "disclaimer": "Lộ trình hướng nghiệp này được tổng hợp dựa trên dữ liệu..."
    }
    ```

---

# 18. Deployment

### Web Deployment Flow
* **Next.js Frontend:** Triển khai trên **Vercel**
  * Import repository, configure Root Directory = `skillcompass/web/frontend`.
  * Set `NEXT_PUBLIC_BACKEND_URL` environment variable pointing to the Render backend URL.
* **NestJS Backend:** Triển khai trên **Render** (Node Runtime)
  * Root Directory = `skillcompass/web/backend`.
  * Build Command: `npm install && npm run build`.
  * Environment variables: `DATABASE_URL`, `COUNSELOR_SERVICE_URL`, `ROADMAP_SERVICE_URL`, `JWT_SECRET`.
* **AI Microservices:** Triển khai trên **Render** (Python Runtime)
  * Set Root Directory to `skillcompass/ai-services/counselor` and `skillcompass/ai-services/roadmap` respectively.
  * Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`.

### Cold Start Mitigation
Render's free tier spins down services after 15 minutes of inactivity. To prevent errors:
* Axios requests from the backend feature a **60-second timeout** instead of defaulting to 10 seconds.
* A fallback question system handles chat flows gracefully if the AI services are starting up, updating user metrics on-the-fly.

---

# 19. Security Considerations

* **Authentication Protocol:** Secure JWT validation with HS256 algorithm. The system hashes user passwords using HMAC-SHA256 with secret key `HACKAI` to guarantee data safety.
* **Neon Cloud SSL Constraints:** Node-Postgres pool connections enforce SSL security with `rejectUnauthorized: false` to allow safe AWS pool connections.
* **Bias Protection (Bias Guard):** The system prompt uses explicit formatting templates that omit demographic variables (such as gender, location, or socioeconomic status) during LLM inference. Recommends diverse academic and vocational routes.
* **Prompt Injection Mitigation:** System instructions and client messages are parsed as isolated data blocks inside structured JSON payloads, preventing instructions override.

---

# 20. Scalability

* **Dense 10-Dimensional Vector Space Search:** Storing core traits in a 10-dimensional index rather than embedding large documents prevents query latency growth, maintaining stable lookup speeds ($O(1)$) as candidate databases scale.
* **Asymmetric WFS Reranking:** Decoupled matching isolates heavy calculations (like WFS comparison and local filter constraints) to the Python microservice, allowing NestJS to maintain high availability.
* **Database Partitioning (CQRS):** Separating operational reads (PostgreSQL) from dimensional comparisons (Pinecone) eliminates write block issues.

---

# 21. Performance Optimization

* **Exponential Moving Average (EMA):** Confidence scoring is recalculated in memory during active chat sessions, reducing PostgreSQL read/write frequency.
* **Cors Optimization:** Custom NestJS CORS filters allow fast client-side cross-origin access without request block delays.
* **Local Python Dependencies:** Optimized dependency compilation in virtual environments reduces Python memory consumption.

---

# 22. Limitations

* **Cold-Start Latency:** Free-tier container sleep policies can cause 30-50s delays during initial sessions.
* **Finite Domain Frameworks:** The system currently relies on 5 base frameworks (IT, Business, Art, Applied Vocational, and General Core), which limits precision in other fields.
* **LLM Dependence:** Output details and matching quality are subject to external API availability.

---

# 23. Future Improvements

### Short-Term
* Add active polling scripts to automatically ping Render services and prevent idle sleep.
* Expand the specialized framework library to support Agriculture and Medicine.

### Medium-Term
* Transition from OpenAI/Gemini APIs to self-hosted Qwen 2.5 or Llama 3 models using vLLM to lower API costs.
* Store regional employment metrics in the vector database to support geo-matching queries.

### Long-Term
* Establish API integrations with local vocational colleges to offer direct application portals inside the roadmap view.
* Introduce multi-lingual support to accommodate students in ethnic minority regions.

---

# 24. References

1. **NestJS Documentation:** [https://docs.nestjs.com](https://docs.nestjs.com)
2. **Next.js Reference:** [https://nextjs.org/docs](https://nextjs.org/docs)
3. **Prisma Schema Guide:** [https://www.prisma.io/docs](https://www.prisma.io/docs)
4. **Pinecone Vector Search:** [https://docs.pinecone.io](https://docs.pinecone.io)
5. **FastAPI Web Framework:** [https://fastapi.tiangolo.com](https://fastapi.tiangolo.com)
