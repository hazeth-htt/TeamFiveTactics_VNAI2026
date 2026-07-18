import json
import os
import sys
import argparse
from rag_service import retrieve_matched_careers
from roadmap_generator import generate_career_roadmap

def load_test_cases() -> list:
    """
    Đọc dữ liệu hồ sơ học sinh mẫu từ mock_data_agent2.json.
    """
    path = "mock_data_agent2.json"
    if not os.path.exists(path):
        base_dir = os.path.dirname(os.path.abspath(__file__))
        path = os.path.join(base_dir, path)
        
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)

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
