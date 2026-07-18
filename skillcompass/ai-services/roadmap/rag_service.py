import os
import json
from typing import Dict, List
import math
import numpy as np
from config import get_pinecone_index, get_pg_connection, CORE_COMPETENCY_KEYS

# Map friendly career track names to field names for metadata
FIELD_MAPPING = {
    "Backend Developer": "IT",
    "Frontend Developer": "IT",
    "Data Analyst": "IT",
    "Digital Marketing Specialist": "Business",
    "Sales B2B Executive": "Business",
    "UX/UI Designer": "Art",
    "Kỹ Thuật Viên Sửa Chữa Ô Tô": "Vocational",
    "Kỹ thuật viên Phay CNC": "Vocational",
    "Kỹ Sư Cơ Khí": "Vocational",
    "Nhân viên Nghiên cứu Sản phẩm (R&D)": "Business"
}

def determine_track_type(career_track: str, db_track_type: str) -> str:
    """
    Phân loại career track thành 'academic' (Đại học) hoặc 'vocational' (Trường nghề).
    """
    db_track_lower = (db_track_type or "").lower()
    if "academic" in db_track_lower:
        return "academic"
    if "vocational" in db_track_lower:
        return "vocational"
        
    vocational_keywords = [
        "kỹ thuật viên", "thợ", "vận hành", "sửa chữa", "lắp ráp", "bảo trì", 
        "bếp", "pha chế", "chăm sóc khách hàng", "spa", "tài xế", "nhân viên kho",
        "thu ngân", "nhân viên bán hàng"
    ]
    track_lower = career_track.lower()
    for kw in vocational_keywords:
        if kw in track_lower:
            return "vocational"
            
    return "academic"

def extract_location_data(career_db: dict, expectations: dict) -> dict:
    """
    Trích xuất thông tin địa phương, dải lương và cảnh báo thị trường dựa trên
    kỳ vọng của học sinh và dữ liệu thực tế trong DB.
    """
    preferred_locs = expectations.get("preferred_locations", [])
    
    PROVINCE_TO_CODE = {
        "Hà Nội": "HN",
        "Hồ Chí Minh": "HCM",
        "TP. Hồ Chí Minh": "HCM",
        "TP.HCM": "HCM",
        "Đà Nẵng": "DN",
        "Bình Dương": "BD",
        "Đồng Nai": "DNa",
    }
    
    CODE_TO_PROVINCE = {
        "HN": "Hà Nội",
        "HCM": "Hồ Chí Minh",
        "DN": "Đà Nẵng",
        "BD": "Bình Dương",
        "DNa": "Đồng Nai",
    }
    
    # 1. Tìm địa phương phù hợp nhất
    target_code = None
    target_province = None
    
    region_demand = career_db.get("region_demand") or {}
    for loc in preferred_locs:
        code = PROVINCE_TO_CODE.get(loc)
        if code and code in region_demand:
            target_code = code
            target_province = loc
            break
            
    if not target_code and region_demand:
        demand_rank = {"high": 3, "medium": 2, "low": 1}
        sorted_keys = sorted(region_demand.keys(), key=lambda k: demand_rank.get(region_demand[k], 0), reverse=True)
        if sorted_keys:
            target_code = sorted_keys[0]
            target_province = CODE_TO_PROVINCE.get(target_code, target_code)
            
    if not target_code:
        target_code = "HN"
        target_province = "Hà Nội"
        
    # 2. Xác định điểm xu hướng & nguy cơ thất nghiệp
    timeline = career_db.get("timeline_trends") or {}
    risk = "Low"
    trend = 0.8
    
    for key, val in timeline.items():
        if key in ["2025", "2026", "2027"]:
            if val == "rising":
                trend = max(trend, 0.9)
                risk = "Low"
            elif val == "stable":
                trend = max(trend, 0.7)
            elif val == "falling":
                trend = min(trend, 0.4)
                risk = "High"
                
    # 3. Dải lương
    sal_min = career_db.get("avg_salary_min") or 8000000
    sal_max = career_db.get("avg_salary_max") or 20000000
    if sal_min == 0:
        sal_min = 8000000
    if sal_max == 0:
        sal_max = 20000000
        
    # 4. Tóm tắt thị trường
    local_signals = career_db.get("local_demand_signals") or {}
    target_signals = local_signals.get(target_code) or {}
    hot_skills = target_signals.get("hot_skills", [])
    
    if hot_skills:
        market_insight = f"Nhu cầu tuyển dụng tốt tại {target_province}. Kỹ năng khát nhân lực: {', '.join(hot_skills)}."
    else:
        market_insight = f"Nhu cầu tuyển dụng ổn định tại {target_province}."
        
    return {
        "province": target_province,
        "salary_range": [sal_min, sal_max],
        "trend_score": trend,
        "risk_of_unemployment": risk,
        "market_insight": market_insight
    }

def calculate_gap_penalty(user_level: float, required_level: float) -> float:
    """
    Tính điểm thỏa mãn kỹ năng dựa trên hiệu số (User_Level - Required_Level) và Hàm phạt bất đối xứng.
    """
    diff = user_level - required_level
    if diff >= 0:
        fit_score = 1.0 + (diff * 0.2) / required_level
    else:
        fit_score = 1.0 + (diff * 1.5) / required_level
        
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

def build_user_vector(core_scores: dict) -> list:
    """
    Chuyển đổi điểm số 10 Core Competencies chuẩn của học sinh thành vector chuẩn hóa L2.
    """
    raw_vector = [float(core_scores.get(key, 5.0)) for key in CORE_COMPETENCY_KEYS]
    np_vector = np.array(raw_vector, dtype=np.float32)
    norm = np.linalg.norm(np_vector)
    if norm == 0:
        return [0.1] * 10
    return (np_vector / norm).tolist()

def retrieve_matched_careers(student_profile: dict, conversation_history: List[dict]) -> List[dict]:
    """
    Thuật toán lai phân tầng Two-Stage RAG:
    Giai đoạn 1: So khớp Cosine Similarity điểm UCEF tìm ra Top 10 dùng Pinecone & PostgreSQL.
    Giai đoạn 2: Trích xuất tiêu chí chuyên môn, gọi LLM đánh giá và tính WFS Phạt bất đối xứng chọn Top 3.
    """
    import roadmap_generator
    
    user_core = student_profile.get("core_scores", {})
    expectations = student_profile.get("market_expectations", {})
    
    # 1. Tạo vector UCEF cho học sinh
    user_vector = build_user_vector(user_core)
    
    # 2. Gọi Pinecone tìm kiếm top 10 vector tương đồng nhất
    print(f"\n[RAG Engine] Querying Pinecone index for top 10 matches...")
    index = get_pinecone_index()
    query_res = index.query(
        vector=user_vector,
        top_k=10,
        include_metadata=True
    )
    
    if not query_res.matches:
        print("⚠️ Không tìm thấy vector tương hợp nào trên Pinecone index.")
        return []
        
    # 3. Lấy thông tin chi tiết từ PostgreSQL
    vector_ids = [match.id for match in query_res.matches]
    print(f"[RAG Engine] Fetching career details from PostgreSQL for IDs: {vector_ids}")
    
    conn = get_pg_connection()
    db_careers = {}
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT id, career_track, track_type, description, 
                       avg_salary_min, avg_salary_max, education_route, 
                       typical_employers, region_demand, local_demand_signals, 
                       timeline_trends, vector_id 
                FROM public.career_tracks 
                WHERE vector_id IN %s
                """,
                (tuple(vector_ids),)
            )
            rows = cur.fetchall()
            for r in rows:
                db_careers[r[11]] = {
                    "id": r[0],
                    "career_track": r[1],
                    "track_type": r[2],
                    "description": r[3],
                    "avg_salary_min": r[4],
                    "avg_salary_max": r[5],
                    "education_route": r[6],
                    "typical_employers": r[7],
                    "region_demand": r[8],
                    "local_demand_signals": r[9],
                    "timeline_trends": r[10],
                    "vector_id": r[11]
                }
    finally:
        conn.close()
        
    # 4. GIAI ĐOẠN 1: Tổng hợp danh sách Top 10
    top_10_careers = []
    for match in query_res.matches:
        vector_id = match.id
        if vector_id not in db_careers:
            continue
            
        career_db = db_careers[vector_id]
        domain_json = match.metadata.get("domain_competencies_json") or "{}"
        domain_competencies = json.loads(domain_json)
        
        # Build structured career object matching the format expected by prompts
        career_obj = {
            "career_track": career_db["career_track"],
            "track_type": determine_track_type(career_db["career_track"], career_db["track_type"]),
            "field": FIELD_MAPPING.get(career_db["career_track"], career_db["track_type"]),
            "description": career_db["description"],
            "education_route": career_db["education_route"],
            "typical_employers": career_db["typical_employers"],
            "domain_competencies": domain_competencies,
            "core_similarity_score": match.score * 100,  # Score from Pinecone
            "vector_id": vector_id
        }
        # Populate location_data dynamically
        career_obj["location_data"] = extract_location_data(career_db, expectations)
        
        top_10_careers.append(career_obj)
        
    if not top_10_careers:
        print("⚠️ Không tìm thấy thông tin chi tiết trong PostgreSQL cho các vector tương ứng.")
        return []
        
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
