# CHI TIẾT KỸ THUẬT: AGENT 2 (COUNSELOR + EVALUATOR)
*Bản đặc tả triển khai mã nguồn cho Counselor Microservice (FastAPI)*

---

## 1. KIẾN TRÚC THƯ MỤC
```text
ai-services/counselor/
├── main.py                 # FastAPI endpoints (POST /chat)
├── prompts/
│   ├── counselor_prompt.py # System prompt cho 2A
│   └── evaluator_prompt.py # System prompt cho 2B
├── logic/
│   ├── conversation.py     # Gọi OpenAI ChatCompletion
│   └── state_manager.py    # Tính toán confidence score và routing
└── schemas/
    └── api_models.py       # Pydantic validation
```

## 2. API CONTRACT (Giao tiếp với NestJS)

**Endpoint:** `POST /chat`

### Response (Agent 2 trả về NestJS)
*(Mẫu này đồng bộ với `mock_data_agent2.json`)*
```json
{
  "replies": [
    "Thích tự tay sửa đồ điện chứng tỏ em có đôi bàn tay vàng đấy!",
    "Nhưng sửa chữa thường mất sức, vậy thể chất của em có tốt không?",
    "Sẵn tiện cho mình hỏi, sau này ra trường em dự định làm ở quê hay lên thành phố lớn?"
  ],
  "profile_update": { ... },
  "is_ready": false
}
```

## 3. PROMPT DESIGN (KỸ THUẬT ĐIỀU HƯỚNG LLM)

### Prompt cho Agent 2A (Counselor - Lấy thông tin ngầm)
```python
COUNSELOR_SYSTEM_PROMPT = """
Bạn là một cố vấn hướng nghiệp thân thiện cho học sinh cấp 3. Xưng hô "mình - bạn".
Nhiệm vụ của bạn:
1. Đặt 1-2 câu hỏi mở để khai thác sở thích, tính cách dựa trên {conversation_history}.
2. KHÔNG BAO GIỜ hỏi dạng trắc nghiệm (như "Bạn chấm điểm logic của mình bao nhiêu"). Hãy hỏi về hành vi thực tế (VD: "Khi đồ trong nhà hỏng, bạn có hay tự lấy tua vít ra sửa không?").
3. BẮT BUỘC: Trong 3 lượt chat đầu tiên, phải lồng ghép khéo léo để hỏi được 2 thông tin thị trường:
   - "Sau này bạn muốn làm việc ở thành phố nào?" (Khu vực)
   - "Mức lương khởi điểm bạn kỳ vọng là bao nhiêu?" (Lương)
"""
```

### Prompt cho Agent 2B (Evaluator - Trích xuất JSON)
```python
EVALUATOR_SYSTEM_PROMPT = """
Bạn là AI phân tích tâm lý. Đọc lịch sử chat và xuất ra JSON.
{
  "core_scores": { "analytical_thinking": float, ... }, // Cập nhật dựa trên bằng chứng mới nhất. Điểm từ 1-10.
  "domain_scores": { "kỹ_năng_chuyên_môn": float }, // Nếu user nhắc đến code, vẽ, sửa xe...
  "market_expectations": { "preferred_locations": list, "expected_salary_min": int },
  "evidence": "Câu nói nào của user chứng minh điểm số trên?",
  "is_off_topic": boolean // Trả về true nếu người dùng đang nói linh tinh, trêu đùa, không liên quan đến nghề nghiệp/sở thích.
}
"""
```

## 3. THUẬT TOÁN CONFIDENCE SCORE & FORCED TRANSITION

Hệ thống không thể hỏi mãi mãi. Cần có công thức cộng dồn độ tin cậy để chốt sổ (`is_ready = True`).

### Logic Cộng dồn Độ tin cậy (Mã giả `state_manager.py`)
```python
def update_profile_state(current_state, evaluator_output):
    # Duyệt qua các điểm core_scores mà Evaluator vừa phân tích
    for trait, new_score in evaluator_output["core_scores"].items():
        if trait in current_state["core_scores"]:
            # Cập nhật điểm theo trung bình trọng số (Ema - Exponential Moving Average)
            current_state["core_scores"][trait] = (current_state["core_scores"][trait] * 0.7) + (new_score * 0.3)
            # Tăng độ tin cậy thêm 0.25 mỗi lần có nhắc đến
            current_state["confidence_scores"][trait] = min(1.0, current_state["confidence_scores"].get(trait, 0.0) + 0.25)
        else:
            current_state["core_scores"][trait] = new_score
            current_state["confidence_scores"][trait] = 0.4
            
    # Tính độ tin cậy trung bình của toàn bộ 10 Core Competencies
    avg_confidence = sum(current_state["confidence_scores"].values()) / 10
    
    # Kiểm tra điều kiện Dừng (Stopping Criteria)
    turn_count = len(conversation_history) // 2
    if avg_confidence > 0.75 or turn_count >= 10:
        current_state["is_ready"] = True
        
    return current_state
```

### Điều hướng hội thoại (Routing Logic)
Trong endpoint `POST /chat`:
```python
@app.post("/chat")
async def chat_endpoint(req: ChatRequest):
    # 1. Chạy Evaluator (Agent 2B) ngầm
    eval_result = run_evaluator_llm(req.conversation_history, req.message)
    
    # 2. Cập nhật State
    new_state = update_profile_state(req.current_state, eval_result)
    
    # 3. Forced Transition Logic & Graceful Closing
    if new_state["is_ready"]:
        # Khi đã đủ điểm, CẤM Counselor hỏi thêm. Yêu cầu nói lời chào kết thúc.
        counselor_instruction = "LƯU Ý HỆ THỐNG: Đã thu thập đủ thông tin. KHÔNG hỏi thêm câu nào nữa. Hãy đưa ra lời cảm ơn, nhận xét tích cực và thông báo rằng hệ thống đang tiến hành phân tích để trả về lộ trình nghề nghiệp."
    elif eval_result.get("is_off_topic"):
        # Soft-Bridging: Xử lý khi người dùng nói lạc đề (chit-chat/troll)
        counselor_instruction = "LƯU Ý HỆ THỐNG: Người dùng đang nói lạc đề. Hãy hùa theo họ 1 câu ngắn gọn vui vẻ, sau đó DÙNG TỪ NỐI (VD: À mà, Nhắc mới nhớ, Sẵn tiện) để bẻ lái mượt mà quay lại câu hỏi đánh giá đang bị dang dở."
    elif eval_result.get("market_expectations").get("expected_salary_min") == 0 and turn_count > 3:
        # Ép Counselor phải hỏi về lương nếu sau 3 lượt chưa có
        counselor_instruction = "LƯU Ý HỆ THỐNG: Ngay lập tức hỏi khéo về mức lương kỳ vọng trong câu trả lời này."
    else:
        counselor_instruction = "Tiếp tục trò chuyện sâu hơn về sở thích."
        
    # 4. Chạy Counselor (Agent 2A)
    # LLM sẽ được prompt để trả về mảng các câu ngắn thay vì 1 đoạn văn dài
    replies_list = run_counselor_llm(req.conversation_history, req.message, counselor_instruction)
    
    return Response(replies=replies_list, profile_update=new_state, is_ready=new_state["is_ready"])
```
