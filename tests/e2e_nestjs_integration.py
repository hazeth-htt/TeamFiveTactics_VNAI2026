import requests
import json
import uuid

def run_nestjs_e2e_flow():
    session_id = str(uuid.uuid4())
    print("=" * 60)
    print("🚀 BẮT ĐẦU CHẠY KIỂM THỬ LIÊN KẾT TOÀN DIỆN (E2E NESTJS - 12 LƯỢT)")
    print(f"   Session ID: {session_id}")
    print("=" * 60)

    chat_url = "http://localhost:4000/api/chat/message"
    roadmap_url = "http://localhost:4000/api/career/roadmap"

    # Chuỗi hội thoại 12 lượt giả lập hành vi thực tế của học sinh để kích hoạt đầy đủ luồng
    messages = [
        # Lượt 1-10: Đánh giá 10 năng lực cốt lõi và lấy thông tin kỳ vọng thị trường
        "Chào bạn, tôi muốn tìm hiểu xem mình hợp với ngành gì.",
        "Tôi thích chơi game khi rảnh rỗi.",
        "Ở trường tôi thích nhất môn Toán và Tin học.",
        "Khi làm việc nhóm tôi thích làm lập trình viên chính, thiết kế cấu trúc hệ thống.",
        "Tôi hay tự ngồi mày mò cả buổi tối để sửa lỗi code hoặc lỗi máy tính.",
        "Tôi thích tự nghiên cứu học thêm công nghệ mới như AI trên mạng.",
        "Khi kế hoạch thay đổi, tôi thường nhanh chóng điều chỉnh và tìm phương án dự phòng.",
        "Tôi thường thuyết phục các bạn cùng nhóm bằng các lý lẽ và dẫn chứng cụ thể.",
        "Tôi luôn trung thực nhận trách nhiệm và tìm cách khắc phục khi làm sai bài tập nhóm.",
        "Tôi mong muốn làm việc tại Hà Nội với mức lương khởi điểm từ 15 triệu VND.",
        
        # Lượt 11: Trả lời câu hỏi về định hướng Gia đình (khi stopping criteria năng lực đã đạt)
        "Gia đình tôi rất tôn trọng và cho tôi tự do hoàn toàn để lựa chọn ngành học yêu thích.",
        
        # Lượt 12: Trả lời câu hỏi về Sức khỏe
        "Sức khỏe của tôi hoàn toàn bình thường, không có bất kỳ hạn chế nào."
    ]

    is_ready = False
    for i, msg in enumerate(messages, start=1):
        print(f"\n💬 Lượt {i} — Gửi: '{msg}'")
        try:
            res = requests.post(chat_url, json={"session_id": session_id, "message": msg}, timeout=30)
            res.raise_for_status()
            data = res.json()
            print(f"🤖 Phản hồi của AI:\n{data['reply']}")
            is_ready = data.get("is_ready", False)
            print(f"   👉 Trạng thái sẵn sàng sinh lộ trình (is_ready): {is_ready}")
        except Exception as e:
            print(f"❌ Lỗi ở lượt {i}: {e}")
            return

    # Nếu sau chuỗi hội thoại mà hệ thống sẵn sàng sinh lộ trình
    if is_ready:
        print("\n" + "=" * 60)
        print("🗺️  GỌI API SINH LỘ TRÌNH (AGENT 3)")
        print("=" * 60)
        try:
            res = requests.post(roadmap_url, json={"session_id": session_id}, timeout=60)
            res.raise_for_status()
            data = res.json()
            print("✅ Kết quả lộ trình sự nghiệp sinh ra thành công:")
            print(f"\n🌟 Tóm tắt hồ sơ: {data.get('user_profile_summary')}\n")
            print(f"🌟 Số lượng lộ trình đề xuất: {len(data.get('paths', []))}")
            for path in data.get('paths', []):
                print(f"\n👉 Ngành: {path['career_track']} (Độ phù hợp: {path['match_score']}/100)")
                print(f"   * Lý do phù hợp: {path['why_it_fits']}")
                if path.get('market_warning'):
                    print(f"   ⚠️ Cảnh báo thị trường: {path['market_warning']}")
                print(f"   * Lộ trình thăng tiến:")
                for step in path.get('role_progression', []):
                    print(f"     - [{step['level']}] {step['title']}: {step['description']}")
                print(f"   * Cây kỹ năng cần học: {list(path.get('skill_tree', {}).values())}")
        except Exception as e:
            print(f"❌ Lỗi khi sinh lộ trình: {e}")
    else:
        print("\n⚠️ Chatbot chưa sẵn sàng sinh lộ trình sau chuỗi chat giả lập. Kiểm tra lại Stopping Criteria.")

if __name__ == "__main__":
    run_nestjs_e2e_flow()
