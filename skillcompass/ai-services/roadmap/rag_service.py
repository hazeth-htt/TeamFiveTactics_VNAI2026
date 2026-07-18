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

def calculate_cosine_similarity(vec_a: Dict[str, int], vec_b: Dict[str, int]) -> float:
    """
    Tính độ tương đồng Cosine giữa hai vector điểm số.
    Chỉ so khớp dựa trên các đặc trưng giao nhau (intersection keys).
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

def get_track_type(field: str) -> str:
    """
    Ánh xạ lĩnh vực (field) sang loại lộ trình (track_type):
    - Lĩnh vực 'Vocational' -> 'vocational' (học nghề)
    - Các lĩnh vực khác -> 'academic' (học thuật / đại học)
    """
    if field.strip().lower() == "vocational":
        return "vocational"
    return "academic"

def generate_market_warnings(career: dict, expectations: dict) -> str:
    """
    Đối chiếu kỳ vọng của học sinh với dữ liệu thị trường thực tế để sinh ra cảnh báo (market_warning).
    """
    warnings = []
    preferred_locs = expectations.get("preferred_locations", [])
    expected_salary = expectations.get("expected_salary_min", 0)
    willing_relocate = expectations.get("willing_to_relocate", False)
    
    career_track = career["career_track"]
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
                f"không trùng khớp với khu vực mong muốn của bạn ({', '.join(preferred_locs)}) và bạn không muốn chuyển đi."
            )
            
    # 3. Kiểm tra rủi ro thất nghiệp
    if risk.strip().lower() == "high":
        warnings.append(
            f"Cảnh báo: Ngành này đang có mức độ cạnh tranh và nguy cơ thất nghiệp cao tại {province}."
        )
        
    return " / ".join(warnings) if warnings else ""

def retrieve_matched_careers(student_profile: dict) -> List[dict]:
    """
    Luồng xử lý RAG cục bộ bằng Python:
    1. So khớp điểm (Cosine Similarity) của học sinh với tất cả các ngành nghề.
    2. Ánh xạ loại lộ trình (academic / vocational).
    3. Lọc và sinh cảnh báo dựa trên kỳ vọng lương, địa điểm.
    4. Trả về đúng 3 ngành phù hợp nhất (ít nhất 1 học thuật, 1 học nghề).
    """
    student_traits = student_profile.get("trait_scores", {})
    expectations = student_profile.get("market_expectations", {})
    
    market_data = load_market_data()
    scored_careers = []
    
    # Tính điểm và sinh cảnh báo cho toàn bộ ngành nghề
    for career in market_data:
        # Clone để tránh chỉnh sửa trực tiếp dữ liệu gốc
        career_copy = json.loads(json.dumps(career))
        
        # Tính toán cosine similarity và quy đổi về thang điểm 100
        sim = calculate_cosine_similarity(student_traits, career_copy["required_traits"])
        match_score = int(round(sim * 100))
        
        career_copy["match_score"] = match_score
        career_copy["track_type"] = get_track_type(career_copy["field"])
        career_copy["market_warning"] = generate_market_warnings(career_copy, expectations)
        
        scored_careers.append(career_copy)
        
    # Phân chia thành 2 danh sách Học thuật và Học nghề
    academic_paths = [c for c in scored_careers if c["track_type"] == "academic"]
    vocational_paths = [c for c in scored_careers if c["track_type"] == "vocational"]
    
    # Sắp xếp theo điểm tương thích giảm dần
    academic_paths.sort(key=lambda x: x["match_score"], reverse=True)
    vocational_paths.sort(key=lambda x: x["match_score"], reverse=True)
    
    selected_paths = []
    
    # Ràng buộc: Chọn ít nhất 1 Học thuật và 1 Học nghề
    if academic_paths:
        selected_paths.append(academic_paths.pop(0))
    if vocational_paths:
        selected_paths.append(vocational_paths.pop(0))
        
    # Chọn thêm ngành thứ 3 có điểm cao nhất còn lại từ cả 2 nhóm
    remaining_paths = academic_paths + vocational_paths
    remaining_paths.sort(key=lambda x: x["match_score"], reverse=True)
    
    if remaining_paths:
        selected_paths.append(remaining_paths.pop(0))
        
    # Đánh số ID lộ trình cho frontend hiển thị (path_id: 1, 2, 3)
    for idx, path in enumerate(selected_paths, start=1):
        path["path_id"] = idx
        
    # Sắp xếp danh sách trả về theo điểm số phù hợp giảm dần
    selected_paths.sort(key=lambda x: x["match_score"], reverse=True)
    
    return selected_paths
