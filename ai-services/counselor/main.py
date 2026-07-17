import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from config import PORT
from schemas import ChatRequest, ChatResponse, ProfileUpdate
import counselor_agent
import evaluator_agent

# Initialize FastAPI app
app = FastAPI(
    title="SkillCompass - Counselor Microservice",
    description="Microservice cho Agent 2 (Counselor + Evaluator) - Port 8002",
    version="1.0.0"
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
        
        # 1. Gọi Counselor Agent sinh câu trả lời chat cho học sinh
        reply = counselor_agent.generate_reply(history, request.message)
        
        # 2. Gọi Evaluator Agent chạy ngầm phân tích và cập nhật điểm số
        evaluation = evaluator_agent.evaluate_profile(history, request.message)
        
        # Build ProfileUpdate sub-response
        profile_update = ProfileUpdate(
            trait_scores=evaluation.get("trait_scores", {}),
            confidence_scores=evaluation.get("confidence_scores", {})
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
