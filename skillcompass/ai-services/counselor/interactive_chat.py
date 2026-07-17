import requests
import json

# API Endpoint of Agent 2
API_URL = "http://localhost:8002/chat"

# Setup a default framework (Vocational) for testing
TEST_FRAMEWORK = {
    "general_base_questions": [
        "Khi có thời gian rảnh rỗi, bạn thường ưu tiên làm những việc gì để thư giãn?",
        "Trong quá trình học trên lớp, bạn cảm thấy mình đặc biệt hứng thú với môn học nào nhất?",
        "Khi làm việc nhóm, bạn cảm thấy thoải mái nhất khi đảm nhận vai trò nào (như quản lý tiến độ, làm nội dung, hay thuyết trình)?"
    ],
    "field_specific_base_questions": [
        "Bạn thích những công việc thiên về vận động tay chân hay nghiêng về những công việc nhẹ nhàng, ít phải di chuyển hơn?",
        "Khi các vật dụng trong nhà bị hỏng hóc, bạn có thích tự lấy đồ nghề ra kiểm tra và cố gắng sửa chữa không?"
    ],
    "traits_to_evaluate": {
        "practical_hands_on": "Thích thực hành tay chân, thao tác với công cụ.",
        "physical_stamina": "Chịu đựng áp lực thể chất, sức khỏe tốt."
    }
}

def interactive_chat():
    print("==================================================")
    print("   SKILLCOMPASS INTERACTIVE CHAT CLIENT (AGENT 2)  ")
    print("==================================================")
    print("Dùng để test tự động lưu lịch sử hội thoại và điểm số.")
    print("Gõ 'exit' hoặc 'quit' để thoát.\n")
    
    session_id = "test-session-interactive"
    history = []
    
    # First assistant message starts the context
    first_reply = "Chào bạn! Mình có thể hỗ trợ gì cho bạn hôm nay?"
    print(f"AI: {first_reply}")
    history.append({"role": "assistant", "content": first_reply})

    while True:
        try:
            user_msg = input("\nBạn: ").strip()
            if not user_msg:
                continue
            if user_msg.lower() in ("exit", "quit"):
                print("Tạm biệt!")
                break
            
            # Prepare payload matching the NestJS contract
            payload = {
                "session_id": session_id,
                "message": user_msg,
                "target_field": "Vocational",
                "evaluation_framework": TEST_FRAMEWORK,
                "conversation_history": history
            }
            
            # Call FastAPI endpoint
            response = requests.post(API_URL, json=payload)
            if response.status_code != 200:
                print(f"\n[Lỗi API] Status code {response.status_code}: {response.text}")
                continue
                
            res_data = response.json()
            reply = res_data["reply"]
            profile = res_data["profile_update"]
            is_ready = res_data["is_ready"]
            
            # Print AI response
            print(f"\nAI: {reply}")
            
            # Print Current Scores
            print("\n--- [Hồ sơ Đánh giá Hiện tại] ---")
            print(f"  + Trạng thái sẵn sàng (is_ready): {is_ready}")
            print(f"  + Điểm tính cách (trait_scores): {json.dumps(profile['trait_scores'], ensure_ascii=False)}")
            print(f"  + Độ tin cậy (confidence_scores): {json.dumps(profile['confidence_scores'], ensure_ascii=False)}")
            print(f"  + Kỳ vọng thị trường: {json.dumps(profile['market_expectations'], ensure_ascii=False)}")
            print("---------------------------------")
            
            # Update history for next turn
            history.append({"role": "user", "content": user_msg})
            history.append({"role": "assistant", "content": reply})
            
            if is_ready:
                print("\n[HỆ THỐNG] Hồ sơ đã thu thập đủ thông tin (is_ready = True). Luồng chat kết thúc!")
                break
                
        except KeyboardInterrupt:
            print("\nThoát chương trình.")
            break
        except Exception as e:
            print(f"\n[Lỗi kết nối]: {e}")
            break

if __name__ == "__main__":
    interactive_chat()
