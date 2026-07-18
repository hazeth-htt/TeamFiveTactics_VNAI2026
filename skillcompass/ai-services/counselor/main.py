import uvicorn
import asyncio
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from config import PORT
from schemas.api_models import ChatRequest, ChatResponse, ProfileState, MarketExpectations
from logic import conversation, state_manager
from logic.logger_helper import save_json_log

# Initialize FastAPI app
app = FastAPI(
    title="SkillCompass - Counselor Microservice",
    description="Microservice cho Agent 2 (Counselor + Evaluator) - Port 8002",
    version="2.0.0"
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
        
        # Convert evaluation framework and current state to raw dicts
        framework_dict = request.evaluation_framework.model_dump()
        
        # Initialize or parse current state
        if request.current_state:
            current_state_dict = request.current_state.model_dump()
        else:
            # First turn defaults
            current_state_dict = {
                "context_inferred": "highschool",
                "core_scores": {},
                "domain_scores": {},
                "market_expectations": {
                    "preferred_locations": [],
                    "expected_salary_min": 0,
                    "willing_to_relocate": False
                },
                "confidence_scores": {},
                "is_ready": False
            }

        # Check if first turn
        is_first_turn = len(history) == 0
        
        eval_result = {}
        counselor_instruction = "Tiếp tục trò chuyện sâu hơn về sở thích."

        if is_first_turn:
            # Lượt 1: Bỏ qua Evaluator để tối ưu tốc độ phản hồi (giảm 50% latency)
            # Khởi tạo điểm mặc định trong state
            traits = framework_dict.get("traits_to_evaluate", {})
            current_state_dict["core_scores"] = {k: 5.0 for k in traits.keys()}
            current_state_dict["confidence_scores"] = {k: 0.1 for k in traits.keys()}
            current_state_dict["is_ready"] = False
            
            # Xác định tiêu chí đầu tiên và lấy câu hỏi tình huống từ kho câu hỏi
            next_trait = state_manager.get_next_incomplete_trait(current_state_dict, traits)
            sq = state_manager.get_situational_question_for_trait(next_trait)
            counselor_instruction = (
                f"LƯU Ý HỆ THỐNG:\n"
                f"- Hãy gửi lời chào thân thiện, ngắn gọn và ấm áp để mở đầu cuộc trò chuyện hướng nghiệp.\n"
                f"- Tiêu chí cần đánh giá hiện tại là: '{next_trait}'.\n"
                f"- Câu hỏi mỏ neo bạn CÓ THỂ dùng để dẫn dắt: '{sq['anchor_question']}'.\n"
                f"- Hoặc dùng câu hỏi tình huống thực tế này (tự nhiên hơn): '{sq['situational_question']}'.\n"
                f"- Hãy chọn 1 trong 2 câu trên, diễn đạt lại tự nhiên và hỏi học sinh."
            )
        else:
            # Lượt 2 trở đi: Chạy Evaluator Agent ngầm tuần tự
            eval_result = await asyncio.to_thread(
                conversation.run_evaluator_llm,
                history,
                request.message,
                framework_dict,
                request.session_id
            )
            
            # Cập nhật State theo thuật toán EMA & Stopping Criteria
            current_state_dict = state_manager.update_profile_state(
                current_state_dict,
                eval_result,
                framework_dict.get("traits_to_evaluate", {}),
                history
            )
            
            # Routing Logic & Graceful Closing
            turn_count = len(history) // 2
            traits = framework_dict.get("traits_to_evaluate", {})
            avg_confidence = sum(current_state_dict.get("confidence_scores", {}).values()) / len(traits) if traits else 0
            is_traits_done = (avg_confidence > 0.75 or turn_count >= 10)
            
            if current_state_dict.get("is_ready"):
                # Khi đã đủ điểm, CẤM Counselor hỏi thêm. Yêu cầu nói lời chào kết thúc.
                counselor_instruction = "LƯU Ý HỆ THỐNG: Đã thu thập đủ thông tin. KHÔNG hỏi thêm câu nào nữa. Hãy đưa ra lời cảm ơn, nhận xét tích cực và thông báo rằng hệ thống đang tiến hành phân tích để trả về lộ trình nghề nghiệp."
            elif eval_result.get("is_off_topic"):
                # Soft-Bridging: Xử lý khi người dùng nói lạc đề (chit-chat/troll)
                counselor_instruction = "LƯU Ý HỆ THỐNG: Người dùng đang nói lạc đề. Hãy hùa theo họ 1 câu ngắn gọn vui vẻ, sau đó DÙNG TỪ NỐI (VD: À mà, Nhắc mới nhớ, Sẵn tiện) để bẻ lái mượt mà quay lại câu hỏi đánh giá đang bị dang dở."
            elif is_traits_done and not current_state_dict.get("market_expectations", {}).get("asked_family"):
                # Hỏi câu về gia đình
                current_state_dict["market_expectations"]["asked_family"] = True
                counselor_instruction = "LƯU Ý HỆ THỐNG: Đã thu thập đủ thông tin năng lực. Hãy hỏi: 'Gia đình bạn có định hướng gì cho bạn không, hay bạn được tự do lựa chọn hoàn toàn?' một cách thân thiện."
            elif is_traits_done and not current_state_dict.get("market_expectations", {}).get("asked_health"):
                # Hỏi câu về sức khỏe
                current_state_dict["market_expectations"]["asked_health"] = True
                counselor_instruction = "LƯU Ý HỆ THỐNG: Ghi nhận định hướng gia đình của học sinh, sau đó hãy đặt câu hỏi: 'Về sức khỏe, có điều gì đặc biệt bạn cần cân nhắc khi chọn ngành không?' một cách tế nhị."
            elif eval_result.get("warning_signal"):
                # Phát hiện tín hiệu chọn sai nghề (theo trend, áp lực gia đình, v.v.)
                counselor_instruction = (
                    "LƯU Ý HỆ THỐNG: Học sinh có thể đang thể hiện dấu hiệu chọn ngành không xuất phát từ bản thân "
                    "(ví dụ: theo xu hướng, theo gia đình, hoặc chưa thực sự tìm hiểu). "
                    "Hãy nhẹ nhàng và tế nhị đặt một câu hỏi giúp học sinh tự kiểm tra lại: "
                    "liệu sự lựa chọn này có thực sự đến từ đam mê và năng lực của bản thân không, "
                    "hay có yếu tố bên ngoài nào đang ảnh hưởng?"
                )
            elif current_state_dict.get("market_expectations", {}).get("expected_salary_min", 0) == 0 and turn_count > 3:
                # Ép Counselor phải hỏi về lương/thị trường nếu sau 3 lượt chưa có
                counselor_instruction = "LƯU Ý HỆ THỐNG: Ngay lập tức hỏi khéo về mức lương kỳ vọng và khu vực làm việc mong muốn của bạn học sinh."
            else:
                # Xác định tiêu chí chưa hoàn thành tiếp theo và kết hợp câu hỏi tình huống
                traits = framework_dict.get("traits_to_evaluate", {})
                next_trait = state_manager.get_next_incomplete_trait(current_state_dict, traits)
                if next_trait:
                    market_snippet = state_manager.get_market_insight_for_trait(next_trait)
                    sq = state_manager.get_situational_question_for_trait(next_trait)
                    counselor_instruction = (
                        f"LƯU Ý HỆ THỐNG:\n"
                        f"- Tiêu chí cần đánh giá hiện tại là: '{next_trait}'.\n"
                        f"- Ngữ cảnh thị trường: Ngành '{market_snippet['career_track']}' ({market_snippet['field']}) "
                        f"có nhu cầu: '{market_snippet['market_insight']}'.\n"
                        f"- Câu hỏi tình huống gợi ý để khảo sát tiêu chí này: '{sq['situational_question']}'.\n"
                        f"- Dấu hiệu điểm cao cần chú ý: {sq['high_score_signals']}.\n"
                        f"- Hãy viết một câu cầu nối thấu cảm với câu trả lời vừa rồi của học sinh, "
                        f"sau đó dẫn dắt tự nhiên vào câu hỏi tình huống ở trên (có thể diễn đạt lại linh hoạt)."
                    )
                else:
                    counselor_instruction = "Tiếp tục trò chuyện tự nhiên và đào sâu hơn về sở thích."


        # Chạy Counselor Agent (Agent 2A)
        replies_list = await asyncio.to_thread(
            conversation.run_counselor_llm,
            history,
            request.message,
            request.target_field,
            framework_dict,
            counselor_instruction,
            request.session_id
        )
        
        # Build ProfileState object to return
        raw_me = current_state_dict.get("market_expectations", {})
        market_expectations_obj = MarketExpectations(
            preferred_locations=raw_me.get("preferred_locations", []),
            expected_salary_min=raw_me.get("expected_salary_min", 0),
            willing_to_relocate=raw_me.get("willing_to_relocate", False),
            family_support=raw_me.get("family_support"),
            health_issues=raw_me.get("health_issues"),
            asked_family=raw_me.get("asked_family", False),
            asked_health=raw_me.get("asked_health", False)
        )
        
        profile_state_obj = ProfileState(
            context_inferred=current_state_dict.get("context_inferred", "highschool"),
            core_scores=current_state_dict.get("core_scores", {}),
            domain_scores=current_state_dict.get("domain_scores", {}),
            market_expectations=market_expectations_obj,
            confidence_scores=current_state_dict.get("confidence_scores", {}),
            is_ready=current_state_dict.get("is_ready", False)
        )
        
        chat_response_obj = ChatResponse(
            replies=replies_list,
            profile_update=profile_state_obj,
            is_ready=profile_state_obj.is_ready
        )
        
        # Save request/response exchange log
        save_json_log("api", request.session_id, {
            "request": request.model_dump(),
            "response": chat_response_obj.model_dump()
        })
        
        return chat_response_obj
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"Error occurred in /chat endpoint: {e}")
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")

if __name__ == "__main__":
    # Start uvicorn server
    uvicorn.run("main:app", host="0.0.0.0", port=PORT, reload=True)
