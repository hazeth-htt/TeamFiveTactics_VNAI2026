import json
import os
import sys
import argparse
from rag_service import retrieve_matched_careers
from roadmap_generator import generate_career_roadmap

def load_test_cases() -> list:
    """
    Trả về danh sách hồ sơ học sinh mẫu sử dụng 10 năng lực cốt lõi chuẩn UCEF.
    """
    return [
        {
            "note": "Hồ sơ Học sinh 1: Rất giỏi logic, lập trình (IT/Backend)",
            "is_ready": True,
            "profile_update": {
                "core_scores": {
                    "adaptability_resilience": 7.0,
                    "analytical_thinking": 8.5,
                    "continuous_learning": 9.0,
                    "creativity_innovation": 5.0,
                    "critical_thinking": 8.0,
                    "effective_communication": 3.0,
                    "problem_solving": 8.0,
                    "responsibility_autonomy": 8.0,
                    "team_collaboration": 4.0,
                    "work_ethics_integrity": 8.0
                },
                "market_expectations": {
                    "preferred_locations": ["Hà Nội", "Hồ Chí Minh"],
                    "expected_salary_min": 15000000,
                    "willing_to_relocate": True
                }
            },
            "conversation_history": [
                { "role": "user", "content": "Chào bạn, mình đang muốn tìm hiểu xem mình hợp làm nghề gì." },
                { "role": "assistant", "content": "Chào bạn! Mình rất vui được đồng hành cùng bạn. Bạn có thể chia sẻ một chút về những việc bạn thích làm hoặc môn học bạn học tốt nhất không?" },
                { "role": "user", "content": "Mình cực kỳ thích các môn tự nhiên như Toán và Lập trình. Mình thích ngồi giải các bài toán khó và lập trình một mình cả ngày, không thích giao tiếp nhiều. Mình có tự học Python và SQL." },
                { "role": "assistant", "content": "Đam mê lập trình và khả năng tự học của bạn rất tốt! Bạn muốn làm việc ở khu vực nào và mong muốn mức lương khởi điểm bao nhiêu?" },
                { "role": "user", "content": "Mình muốn làm ở Hà Nội hoặc HCM. Lương khởi điểm tối thiểu 15 triệu/tháng. Mình sẵn sàng di chuyển." }
            ]
        },
        {
            "note": "Hồ sơ Học sinh 2: Năng nổ, giao tiếp thuyết phục (Sales B2B/Marketing)",
            "is_ready": True,
            "profile_update": {
                "core_scores": {
                    "adaptability_resilience": 8.0,
                    "analytical_thinking": 5.0,
                    "continuous_learning": 6.0,
                    "creativity_innovation": 6.0,
                    "critical_thinking": 6.0,
                    "effective_communication": 9.0,
                    "problem_solving": 7.0,
                    "responsibility_autonomy": 8.0,
                    "team_collaboration": 8.0,
                    "work_ethics_integrity": 8.0
                },
                "market_expectations": {
                    "preferred_locations": ["Hồ Chí Minh"],
                    "expected_salary_min": 10000000,
                    "willing_to_relocate": False
                }
            },
            "conversation_history": [
                { "role": "user", "content": "Tư vấn hướng nghiệp giúp mình với." },
                { "role": "assistant", "content": "Chào bạn! Hãy kể cho mình nghe về sở thích hoặc hoạt động ngoại khóa nào bạn thấy hào hứng nhất nhé." },
                { "role": "user", "content": "Mình thích giao tiếp thuyết phục người khác, làm việc nhóm năng nổ. Mình làm lớp trưởng và hay làm thuyết trình nhóm." },
                { "role": "assistant", "content": "Kỹ năng thuyết phục và giao tiếp của bạn rất thích hợp với các mảng Sales/Marketing! Bạn kỳ vọng làm ở đâu và mức thu nhập khởi điểm bao nhiêu?" },
                { "role": "user", "content": "Mình muốn làm việc ở Hồ Chí Minh, không di chuyển đi tỉnh khác. Lương khởi điểm mong muốn là 10 triệu cộng hoa hồng." }
            ]
        }
    ]

def run_local_test(case_idx: int):
    """
    Chạy thử nghiệm gọi trực tiếp module Python (RAG + DeepSeek).
    """
    cases = load_test_cases()
    
    # Lọc ra các case sẵn sàng (is_ready = True)
    ready_cases = [c for c in cases if c.get("is_ready", False)]
    
    if case_idx < 1 or case_idx > len(ready_cases):
        print(f"Lỗi: Chỉ có {len(ready_cases)} kịch bản mẫu sẵn sàng (từ 1 đến {len(ready_cases)}).")
        return
        
    case = ready_cases[case_idx - 1]
    print(f"\n==================================================")
    print(f" CHẠY THỬ NGHIỆM KỊCH BẢN HƯỚNG NGHIỆP CỦA HỌC SINH {case_idx}")
    print(f" Mô tả: {case['note']}")
    print(f"==================================================")
    
    profile = case["profile_update"]
    history = case["conversation_history"]
    print("--- Dữ liệu đầu vào (Input từ Agent 2) ---")
    print(f"10 điểm UCEF Core: {profile['core_scores']}")
    print(f"Kỳ vọng thị trường: {profile['market_expectations']}")
    print(f"Số lượng tin nhắn hội thoại: {len(history)}")
    
    # 1. Chạy bước RAG (So khớp & Lọc địa lý/lương bằng Python + LLM Zero-shot)
    print("\n[RAG Engine] Đang chạy Two-Stage Recall & Reranking...")
    matched = retrieve_matched_careers(profile, history)
    
    print(f"\n-> Top 3 ngành phù hợp cuối cùng sau Reranking:")
    for m in matched:
        print(f"  * {m['career_track']} ({m['track_type']}) - Điểm so khớp cuối: {m['match_score']}/100")
        print(f"    (Cosine Core: {m['core_similarity_score']:.1f}, WFS Domain: {m['domain_score']:.1f})")
        if m['market_warning']:
            print(f"    ⚠️ Cảnh báo: {m['market_warning']}")
            
    # 2. Gọi DeepSeek API để sinh lộ trình chi tiết
    print("\n[Generator] Đang gửi dữ liệu và gọi DeepSeek API để sinh Roadmap...")
    try:
        roadmap = generate_career_roadmap(profile, matched)
        
        print("\n=== KẾT QUẢ BÁO CÁO LỘ TRÌNH SỰ NGHIỆP SINH RA TỪ AGENT 3 ===")
        print(json.dumps(roadmap, indent=2, ensure_ascii=False))
        print("================================================================")
        
        # Save output to a temp file for review
        output_file = f"output_case_{case_idx}.json"
        with open(output_file, "w", encoding="utf-8") as out:
            json.dump(roadmap, out, indent=2, ensure_ascii=False)
        print(f"Đã lưu kết quả JSON ra file: {output_file}")
        
    except Exception as e:
        print(f"\n❌ Thất bại khi sinh lộ trình bằng DeepSeek API: {e}")

def run_http_test(case_idx: int):
    """
    Chạy thử nghiệm bằng cách gọi API Endpoint HTTP (Yêu cầu Uvicorn Server đang chạy).
    """
    import requests
    cases = load_test_cases()
    ready_cases = [c for c in cases if c.get("is_ready", False)]
    
    if case_idx < 1 or case_idx > len(ready_cases):
        print(f"Lỗi: Chỉ có {len(ready_cases)} kịch bản mẫu sẵn sàng (từ 1 đến {len(ready_cases)}).")
        return
        
    case = ready_cases[case_idx - 1]
    url = "http://localhost:8003/generate-roadmap"
    
    # Request body khớp schemas mới
    payload = {
        "user_profile": case["profile_update"],
        "conversation_history": case["conversation_history"]
    }
    
    print(f"\n[HTTP Request] Gửi yêu cầu tới {url} cho Học sinh {case_idx}...")
    try:
        response = requests.post(url, json=payload, timeout=45)
        if response.status_code == 200:
            print("=== [HTTP 200] PHẢN HỒI THÀNH CÔNG TỪ FASTAPI SERVER ===")
            print(json.dumps(response.json(), indent=2, ensure_ascii=False))
        else:
            print(f"❌ HTTP Error {response.status_code}: {response.text}")
    except requests.exceptions.ConnectionError:
        print("❌ Lỗi kết nối: Không thể kết nối tới server. Vui lòng đảm bảo uvicorn đang chạy (lệnh: uvicorn main:app --port 8003)")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Chạy thử nghiệm Agent 3 (Roadmap Service)")
    parser.add_argument("--case", type=int, default=1, help="Chỉ định kịch bản học sinh để test (1 đến 4)")
    parser.add_argument("--http", action="store_true", help="Gửi request qua HTTP endpoint (Yêu cầu server uvicorn đang chạy)")
    
    args = parser.parse_args()
    
    # Bật chế độ UTF-8 output cho console trên Windows
    if sys.platform.startswith("win"):
        import io
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")
        
    if args.http:
        run_http_test(args.case)
    else:
        run_local_test(args.case)
