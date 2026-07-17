import uvicorn
import asyncio
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from config import PORT
from schemas import ChatRequest, ChatResponse, ProfileUpdate, MarketExpectations
import counselor_agent
import evaluator_agent

# Initialize FastAPI app
app = FastAPI(
    title="SkillCompass - Counselor Microservice",
    description="Microservice cho Agent 2 (Counselor + Evaluator) - Port 8002",
    version="1.2.0"
)

# Configure CORS so NestJS and Next.js can connect easily
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "counselor-microservice"}

@app.post("/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    try:
        # Convert Pydantic models from history list to raw list of dicts
        history = [{"role": msg.role, "content": msg.content} for msg in request.conversation_history]
        
        # Convert evaluation framework to raw dict
        framework_dict = request.evaluation_framework.model_dump()

        # 1. Gọi Evaluator Agent để đánh giá điểm số và trích xuất kỳ vọng trước
        evaluation = await asyncio.to_thread(
            evaluator_agent.evaluate_profile,
            history, 
            request.message, 
            framework_dict
        )
        
        # 2. Tạo chỉ thị định hướng hội thoại (steering directives) nếu thiếu thông tin vùng miền/mức lương
        steering_directives = []
        raw_expectations = evaluation.get("market_expectations", {})
        preferred_locations = raw_expectations.get("preferred_locations", [])
        expected_salary_min = raw_expectations.get("expected_salary_min", 0)
        
        # Chỉ hỏi lồng ghép từ lượt chat thứ 2 trở đi để lượt đầu luôn mở đầu thân thiện trước
        if len(history) >= 2:
            if not preferred_locations:
                steering_directives.append(
                    "Bạn học sinh chưa chia sẻ về địa điểm làm việc mong muốn. Hãy lồng ghép đặt 1 câu hỏi ngắn khéo léo xem bạn ấy sau này muốn làm việc ở gần nhà hay lên các thành phố lớn (Hà Nội, TP.HCM...)."
                )
            elif expected_salary_min == 0:
                loc_name = preferred_locations[0] if preferred_locations else "địa phương"
                steering_directives.append(
                    f"Bạn học sinh đã chọn khu vực {loc_name}. Thay vì hỏi trực tiếp mức lương kỳ vọng (vì học sinh chưa có kinh nghiệm), hãy đặt 1 câu hỏi dẫn dắt giới thiệu ngắn gọn về xu hướng nghề nghiệp đang phát triển mạnh hoặc các kỹ năng thực tế đang thiếu hụt tại {loc_name} (ví dụ: các mảng công nghệ/kỹ thuật thực hành...), và tìm hiểu xem bạn ấy có hứng thú học hỏi hoặc rèn luyện các kỹ năng thực tế đó không."
                )
        
        # 3. Gọi Counselor Agent sinh câu trả lời dựa trên lịch sử và chỉ thị
        reply = await asyncio.to_thread(
            counselor_agent.generate_reply,
            history, 
            request.message, 
            request.target_field,
            framework_dict,
            steering_directives
        )
        
        # Extract market expectations safely
        raw_expectations = evaluation.get("market_expectations", {})
        market_expectations = MarketExpectations(
            preferred_locations=raw_expectations.get("preferred_locations", []),
            expected_salary_min=raw_expectations.get("expected_salary_min", 0),
            willing_to_relocate=raw_expectations.get("willing_to_relocate", False)
        )
        
        # Build ProfileUpdate response object
        profile_update = ProfileUpdate(
            context_inferred=evaluation.get("context_inferred", "highschool"),
            trait_scores=evaluation.get("trait_scores", {}),
            confidence_scores=evaluation.get("confidence_scores", {}),
            market_expectations=market_expectations
        )
        
        # Check if evaluation indicates the profile is ready for roadmap generation
        is_ready = evaluation.get("is_ready", False)
        
        return ChatResponse(
            reply=reply,
            profile_update=profile_update,
            is_ready=is_ready
        )
    except Exception as e:
        print(f"Error occurred in /chat endpoint: {e}")
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")

if __name__ == "__main__":
    # Start uvicorn server
    uvicorn.run("main:app", host="0.0.0.0", port=PORT, reload=True)
