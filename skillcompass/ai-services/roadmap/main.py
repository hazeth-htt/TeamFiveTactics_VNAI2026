from fastapi import FastAPI, HTTPException
from schemas import RoadmapRequest, RoadmapResponse
from rag_service import retrieve_matched_careers
from roadmap_generator import generate_career_roadmap

# Khởi tạo ứng dụng FastAPI với mô tả rõ ràng
app = FastAPI(
    title="SkillCompass - AI Agent 3 (Roadmap Service)",
    description="Microservice chịu trách nhiệm sinh Đa lộ trình sự nghiệp (Multi-Path Career Roadmap) kết hợp tính tương hợp và dữ liệu thị trường.",
    version="1.0.0"
)

def safe_print(message: str):
    """
    In tin nhắn an toàn ra console, tránh lỗi UnicodeEncodeError trên Windows.
    """
    try:
        print(message)
    except UnicodeEncodeError:
        try:
            # Fallback: Thay thế các ký tự không mã hóa được bằng dấu hỏi
            print(message.encode("ascii", errors="replace").decode("ascii"))
        except:
            pass

@app.post(
    "/generate-roadmap",
    response_model=RoadmapResponse,
    summary="Sinh lộ trình nghề nghiệp đa tuyến",
    description="Tiếp nhận hồ sơ tính cách của học sinh, tính toán độ tương thích ngành học cục bộ và gọi Gemini API để sinh báo cáo chi tiết."
)
def generate_roadmap(request: RoadmapRequest):
    try:
        # Chuyển đổi dữ liệu request sang Dictionary dạng Python
        user_profile_dict = request.user_profile.model_dump()
        
        safe_print(f"\n[Request] Received roadmap request. Preferred locations: {user_profile_dict['market_expectations']['preferred_locations']}")
        
        # Bước 1 - 5: Sử dụng logic Python để so khớp Cosine và lọc kỳ vọng thực tế
        matched_careers = retrieve_matched_careers(user_profile_dict, request.conversation_history)
        if not matched_careers:
            raise HTTPException(
                status_code=404, 
                detail="Không tìm thấy ngành nghề nào phù hợp với hồ sơ đặc trưng này trong cơ sở dữ liệu mẫu."
            )
            
        safe_print(f"[Matching] Found {len(matched_careers)} matched careers:")
        for mc in matched_careers:
            safe_print(f"  - {mc['career_track']} (Score: {mc['match_score']}, Warning: {bool(mc['market_warning'])})")
            
        # Bước 6: Gọi Gemini API để tổng hợp báo cáo và sinh cấu trúc JSON chi tiết
        safe_print("[LLM Generation] Calling Gemini API for detailed roadmap...")
        roadmap_data = generate_career_roadmap(user_profile_dict, matched_careers)
        safe_print("[LLM Generation] Roadmap generated successfully!")
        
        # Trả về kết quả khớp hoàn toàn với định dạng RoadmapResponse
        return roadmap_data
        
    except HTTPException as he:
        raise he
    except Exception as e:
        safe_print(f"[ERROR] System error in /generate-roadmap: {e}")
        raise HTTPException(
            status_code=500, 
            detail=f"Lỗi hệ thống trong quá trình sinh lộ trình sự nghiệp: {str(e)}"
        )

# Điểm neo khởi chạy nhanh khi debug trực tiếp file main
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8003, reload=True)
