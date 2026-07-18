import os
import json
from typing import Dict, List
import math
from config import DATA_AGENT1_PATH

def load_market_data() -> List[dict]:
    """
    Đọc dữ liệu ngành học từ file mock_data_agent1.json.
    """
    path = DATA_AGENT1_PATH
    if not os.path.isabs(path):
        base_dir = os.path.dirname(os.path.abspath(__file__))
        path = os.path.join(base_dir, path)
        
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)

def calculate_cosine_similarity(vec_a: Dict[str, float], vec_b: Dict[str, float]) -> float:
    """
    Tính độ tương đồng Cosine giữa hai vector 10 chiều điểm số.
    """
    intersection_keys = set(vec_a.keys()) & set(vec_b.keys())
    if not intersection_keys:
        return 0.0
        
    dot_product = sum(vec_a[k] * vec_b[k] for k in intersection_keys)
    mag_a = math.sqrt(sum(vec_a[k] ** 2 for k in intersection_keys))
    mag_b = math.sqrt(sum(vec_b[k] ** 2 for k in intersection_keys))
    
    if mag_a == 0 or mag_b == 0:
        return 0.0
        
    return dot_product / (mag_a * mag_b)

def calculate_gap_penalty(user_level: float, required_level: float) -> float:
    """
    Tính điểm thỏa mãn kỹ năng dựa trên hiệu số (User_Level - Required_Level) và Hàm phạt bất đối xứng.
    - Δ < 0: Bị áp phạt nặng (hệ số 1.5)
    - Δ >= 0: Được thưởng nhẹ (hệ số 0.2)
    """
    diff = user_level - required_level
    if diff >= 0:
        fit_score = 1.0 + (diff * 0.2) / required_level
    else:
        fit_score = 1.0 + (diff * 1.5) / required_level
        
    # Cập nhật giới hạn điểm thỏa mãn tối thiểu là 0.0 và tối đa là 1.5
    return max(0.0, min(1.5, fit_score))

def generate_market_warnings(career: dict, expectations: dict) -> str:
    """
    Đối chiếu kỳ vọng của học sinh với dữ liệu thị trường thực tế để sinh ra cảnh báo (market_warning).
    """
    warnings = []
    preferred_locs = expectations.get("preferred_locations", [])
    expected_salary = expectations.get("expected_salary_min", 0)
    willing_relocate = expectations.get("willing_to_relocate", False)
    
    province = career["location_data"]["province"]
    salary_min, salary_max = career["location_data"]["salary_range"]
    risk = career["location_data"]["risk_of_unemployment"]
    
    # 1. Kiểm tra Lương
    if expected_salary > 0:
        if expected_salary > salary_max:
            warnings.append(
                f"Mức lương khởi điểm tối đa của ngành này tại {province} khoảng {salary_max:,} VND, "
                f"chưa đạt kỳ vọng tối thiểu {expected_salary:,} VND của bạn."
            )
        elif expected_salary > salary_min:
            warnings.append(
                f"Mức lương khởi điểm trung bình tại {province} dao động từ {salary_min:,} VND, "
                f"bạn có thể cần tích lũy kinh nghiệm để đạt mức {expected_salary:,} VND mong muốn."
            )
            
    # 2. Kiểm tra Địa điểm
    if preferred_locs and (province not in preferred_locs):
        if willing_relocate:
            warnings.append(
                f"Ngành này tuyển dụng mạnh nhất tại {province}. "
                f"Vì bạn sẵn sàng di chuyển nơi làm việc, đây vẫn là một cơ hội tốt."
            )
        else:
            warnings.append(
                f"Ngành này chủ yếu tập trung tại {province}, "
                f"không trùng khớp với khu vực mong muốn của bạn và bạn không muốn chuyển đi."
            )
            
    # 3. Kiểm tra rủi ro thất nghiệp
    if risk.strip().lower() == "high":
        warnings.append(
            f"Cảnh báo: Ngành này đang có mức độ cạnh tranh và nguy cơ thất nghiệp cao tại {province}."
        )
        
    return " / ".join(warnings) if warnings else ""

def retrieve_matched_careers(student_profile: dict, conversation_history: List[dict]) -> List[dict]:
    """
    Thuật toán lai phân tầng Two-Stage RAG:
    Giai đoạn 1: So khớp Cosine Similarity điểm UCEF tìm ra Top 10.
    Giai đoạn 2: Trích xuất tiêu chí chuyên môn, gọi LLM đánh giá và tính WFS Phạt bất đối xứng chọn Top 3.
    """
    # Import muộn để tránh vòng lặp phụ thuộc (circular dependency)
    import roadmap_generator
    
    user_core = student_profile.get("core_scores", {})
    expectations = student_profile.get("market_expectations", {})
    
    market_data = load_market_data()
    scored_careers = []
    
    # === GIAI ĐOẠN 1: MÀNG LỌC CORE COSIM ===
    for career in market_data:
        career_copy = json.loads(json.dumps(career))
        
        sim = calculate_cosine_similarity(user_core, career_copy["core_competencies"])
        core_score = sim * 100
        
        career_copy["core_similarity_score"] = core_score
        scored_careers.append(career_copy)
        
    # Sắp xếp để lấy ra Top 10 ngành phù hợp Core nhất
    scored_careers.sort(key=lambda x: x["core_similarity_score"], reverse=True)
    top_10_careers = scored_careers[:10]  # Lấy tối đa 10 ngành (với dữ liệu test hiện tại là 7)
    
    # === GIAI ĐOẠN 2: THU THẬP TIÊU CHÍ VÀ CHẤM ĐIỂM ZERO-SHOT ===
    # 1. Gom toàn bộ danh mục kỹ năng chuyên môn cần thiết của 10 ngành nghề này
    required_skills = set()
    for career in top_10_careers:
        for skill_id in career["domain_competencies"].keys():
            required_skills.add(skill_id)
            
    # 2. Gọi DeepSeek đánh giá điểm kỹ năng chuyên môn dựa trên lịch sử chat
    print(f"\n[RAG Logic] Calling LLM for Zero-shot domain scoring on {len(required_skills)} skills...")
    user_domain_scores = roadmap_generator.evaluate_domain_skills(
        conversation_history=conversation_history,
        required_skills=list(required_skills)
    )
    print(f"[RAG Logic] Domain scores evaluated by LLM: {user_domain_scores}")
    
    # 3. Tính điểm WFS chuyên môn và điểm tổng hợp cho từng ngành trong Top 10
    final_ranked_careers = []
    for career in top_10_careers:
        domain_reqs = career["domain_competencies"]
        
        wfs_score = 0.0
        total_weight = 0.0
        
        for skill_id, req in domain_reqs.items():
            weight = req["weight_omega"]
            req_level = req["required_level"]
            
            # Lấy điểm user từ LLM đánh giá (mặc định = 1.0 nếu chưa được nhắc)
            user_level = user_domain_scores.get(skill_id, 1.0)
            
            # Áp dụng hàm phạt/thưởng bất đối xứng
            penalty_multiplier = calculate_gap_penalty(user_level, req_level)
            
            wfs_score += penalty_multiplier * weight
            total_weight += weight
            
        # Chuẩn hóa về thang điểm 100
        domain_score = (wfs_score / total_weight) * 100 if total_weight > 0 else 0.0
        domain_score = min(100.0, domain_score)  # Giới hạn trần điểm
        
        # Điểm tổng hợp cuối cùng: Core chiếm 60%, Domain chiếm 40%
        final_score = career["core_similarity_score"] * 0.6 + domain_score * 0.4
        career["match_score"] = int(round(final_score))
        career["domain_score"] = domain_score
        
        # Tạo cảnh báo thị trường
        career["market_warning"] = generate_market_warnings(career, expectations)
        
        final_ranked_careers.append(career)
        
    # === LỌC CỨNG THEO ĐỊA ĐIỂM (Nếu không sẵn sàng chuyển đi) ===
    preferred_locs = expectations.get("preferred_locations", [])
    willing_to_relocate = expectations.get("willing_to_relocate", False)
    
    if preferred_locs and not willing_to_relocate:
        # Giữ lại các ngành nằm trong vùng ưa thích
        filtered_careers = [
            c for c in final_ranked_careers 
            if c["location_data"]["province"] in preferred_locs
        ]
        # Nếu lọc cứng làm mất sạch ngành nghề, ta giữ nguyên danh sách cũ để tránh rỗng đầu ra
        if filtered_careers:
            final_ranked_careers = filtered_careers

    # Sắp xếp giảm dần theo điểm tích hợp cuối cùng
    final_ranked_careers.sort(key=lambda x: x["match_score"], reverse=True)
    
    # Chọn lấy Top 3 ngành nghề tối ưu nhất
    top_3_selected = final_ranked_careers[:3]
    
    # Gán path_id hiển thị
    for idx, path in enumerate(top_3_selected, start=1):
        path["path_id"] = idx
        
    return top_3_selected
