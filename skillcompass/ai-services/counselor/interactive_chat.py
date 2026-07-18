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
    session_id = str(uuid.uuid4())
    conversation_history = []
    current_state = None

    print("=" * 60)
    print("  SKILLCOMPASS — Demo Khai Vấn Hướng Nghiệp (Agent 2)")
    print("=" * 60)
    print(f"Session: {session_id}")
    print("Nhấn Enter trống hoặc gõ 'exit' để thoát.\n")

    # Lượt 1: Không có tin nhắn — Lấy câu chào mở đầu từ server
    payload = {
        "session_id": session_id,
        "message": "",
        "target_field": "Vocational",
        "evaluation_framework": TEST_FRAMEWORK,
        "conversation_history": [],
        "current_state": None
    }

    try:
        response = requests.post(API_URL, json=payload, timeout=60)
        response.raise_for_status()
        data = response.json()
        for line in data.get("replies", []):
            print(f"🤖 {line}")
        print()
        conversation_history.append({"role": "assistant", "content": "\n".join(data.get("replies", []))})
        current_state = data.get("profile_update")
    except Exception as e:
        print(f"❌ Lỗi kết nối server: {e}\n")
        return

    while True:
        user_input = input("👤 Bạn: ").strip()
        if not user_input or user_input.lower() in ("exit", "quit", "thoát"):
            print("\nĐã thoát demo.")
            break

        payload = {
            "session_id": session_id,
            "message": user_input,
            "target_field": "Vocational",
            "evaluation_framework": TEST_FRAMEWORK,
            "conversation_history": conversation_history,
            "current_state": current_state
        }

        try:
            response = requests.post(API_URL, json=payload, timeout=60)
            response.raise_for_status()
            data = response.json()

            replies = data.get("replies", ["(Không có phản hồi)"])
            print()
            for line in replies:
                print(f"🤖 {line}")
            print()

            # Cập nhật lịch sử
            conversation_history.append({"role": "user", "content": user_input})
            conversation_history.append({"role": "assistant", "content": "\n".join(replies)})

            # Cập nhật state
            current_state = data.get("profile_update")

            # Hiển thị hồ sơ đánh giá hiện tại
            if current_state:
                print("--- [Hồ sơ Đánh giá Hiện tại] ---")
                print(f"  + Sẵn sàng sinh lộ trình (is_ready): {data.get('is_ready', False)}")
                print(f"  + Điểm Core (core_scores): {json.dumps(current_state.get('core_scores', {}), ensure_ascii=False)}")
                print(f"  + Độ tin cậy (confidence_scores): {json.dumps(current_state.get('confidence_scores', {}), ensure_ascii=False)}")
                me = current_state.get("market_expectations", {})
                print(f"  + Địa điểm: {me.get('preferred_locations', [])}")
                print("-----------------------------------\n")

            # Nếu đã đủ thông tin, dừng
            if data.get("is_ready"):
                print("✅ Đã thu thập đủ thông tin! Hệ thống sẽ sinh lộ trình nghề nghiệp...")
                break

        except requests.exceptions.ConnectionError:
            print("❌ Không thể kết nối đến server. Hãy đảm bảo FastAPI đang chạy trên port 8002.\n")
        except requests.exceptions.Timeout:
            print("⏱️ Server mất quá nhiều thời gian để phản hồi. Thử lại sau.\n")
        except Exception as e:
            print(f"❌ Lỗi: {e}\n")

if __name__ == "__main__":
    interactive_chat()
