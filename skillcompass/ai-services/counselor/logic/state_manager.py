from typing import Dict, Any, List

def update_profile_state(
    current_state: Dict[str, Any], 
    evaluator_output: Dict[str, Any],
    traits_to_evaluate: Dict[str, str],
    conversation_history: List[Any]
) -> Dict[str, Any]:
    """
    Cập nhật ProfileState của học sinh bằng thuật toán Exponential Moving Average (EMA)
    và cộng dồn độ tin cậy (confidence score) theo đặc tả của Agent 2.
    """
    # Đảm bảo các cấu trúc dữ liệu cốt lõi đã tồn tại
    if "core_scores" not in current_state:
        current_state["core_scores"] = {}
    if "confidence_scores" not in current_state:
        current_state["confidence_scores"] = {}
    if "domain_scores" not in current_state:
        current_state["domain_scores"] = {}
    if "market_expectations" not in current_state:
        current_state["market_expectations"] = {
            "preferred_locations": [],
            "expected_salary_min": 0,
            "willing_to_relocate": False
        }

    # 1. Khởi tạo điểm cho các traits có trong framework nếu chưa có
    for trait in traits_to_evaluate.keys():
        if trait not in current_state["core_scores"]:
            # Mặc định là 5.0 đối với các traits trong framework chưa có điểm
            current_state["core_scores"][trait] = 5.0
        if trait not in current_state["confidence_scores"]:
            current_state["confidence_scores"][trait] = 0.1

    # 2. Cập nhật core_scores và confidence_scores từ kết quả Evaluator
    eval_core = evaluator_output.get("core_scores", {})
    for trait, new_score in eval_core.items():
        # Chỉ cập nhật nếu trait nằm trong framework cần đánh giá
        if trait in traits_to_evaluate:
            old_score = current_state["core_scores"].get(trait, 5.0)
            # Cập nhật điểm theo trung bình trọng số (EMA)
            current_state["core_scores"][trait] = float(old_score * 0.7 + new_score * 0.3)
            # Tăng độ tin cậy thêm 0.25 mỗi lần có nhắc đến, tối đa là 1.0
            old_conf = current_state["confidence_scores"].get(trait, 0.1)
            current_state["confidence_scores"][trait] = min(1.0, old_conf + 0.25)
        else:
            # Trait mới ngoài framework thì gán trực tiếp
            current_state["core_scores"][trait] = float(new_score)
            current_state["confidence_scores"][trait] = 0.4

    # 3. Cập nhật domain_scores
    eval_domain = evaluator_output.get("domain_scores", {})
    for trait, new_score in eval_domain.items():
        if trait in current_state["domain_scores"]:
            old_domain_score = current_state["domain_scores"][trait]
            current_state["domain_scores"][trait] = float(old_domain_score * 0.7 + new_score * 0.3)
        else:
            current_state["domain_scores"][trait] = float(new_score)

    # 4. Cập nhật market_expectations
    eval_me = evaluator_output.get("market_expectations", {})
    if eval_me:
        # Cập nhật địa điểm (tránh trùng lặp)
        pref_loc = eval_me.get("preferred_locations", [])
        current_locs = current_state["market_expectations"].get("preferred_locations", [])
        for loc in pref_loc:
            if loc not in current_locs:
                current_locs.append(loc)
        current_state["market_expectations"]["preferred_locations"] = current_locs

        # Cập nhật mức lương kỳ vọng nếu có con số cụ thể lớn hơn 0
        expected_salary = eval_me.get("expected_salary_min", 0)
        if expected_salary > 0:
            current_state["market_expectations"]["expected_salary_min"] = expected_salary

        # Cập nhật willing_to_relocate
        if "willing_to_relocate" in eval_me:
            current_state["market_expectations"]["willing_to_relocate"] = bool(eval_me["willing_to_relocate"])

        # Cập nhật family_support
        if "family_support" in eval_me and eval_me["family_support"]:
            current_state["market_expectations"]["family_support"] = eval_me["family_support"]

        # Cập nhật health_issues
        if "health_issues" in eval_me and eval_me["health_issues"]:
            current_state["market_expectations"]["health_issues"] = eval_me["health_issues"]

    # 5. Tính độ tin cậy trung bình của toàn bộ 10 Core Competencies (hoặc các core traits đang có)
    # Đặc tả yêu cầu chia cho 10 cố định
    avg_confidence = sum(current_state["confidence_scores"].values()) / 10

    # 6. Kiểm tra điều kiện Dừng (Stopping Criteria)
    # Lượt chat của user được tính bằng: chiều dài lịch sử chia đôi
    turn_count = len(conversation_history) // 2
    
    # Cập nhật is_ready dựa trên điều kiện và các câu hỏi phụ đã hoàn thành
    me = current_state.get("market_expectations", {})
    asked_family = me.get("asked_family", False)
    asked_health = me.get("asked_health", False)
    
    if (avg_confidence > 0.75 or turn_count >= 10) and asked_family and asked_health:
        current_state["is_ready"] = True
    else:
        current_state["is_ready"] = False


    return current_state


def get_next_incomplete_trait(current_state: Dict[str, Any], traits_to_evaluate: Dict[str, str]) -> str:
    """
    Tìm tiêu chí đầu tiên có độ tin cậy (confidence score) nhỏ hơn 0.7
    """
    conf_scores = current_state.get("confidence_scores", {})
    # Duyệt theo thứ tự định nghĩa trong traits_to_evaluate
    for trait in traits_to_evaluate.keys():
        conf = conf_scores.get(trait, 0.1)
        if conf < 0.7:
            return trait
    return None


def get_market_insight_for_trait(trait_key: str) -> Dict[str, Any]:
    """
    Truy vấn mẩu tin thị trường/tuyển dụng có điểm yêu cầu cao nhất cho tiêu chí tương ứng.
    Đọc trực tiếp từ dữ liệu của Agent 1 (mock_data_agent1.json).
    """
    import os
    import json

    # Ánh xạ từ khóa UCEF sang khóa trong mock_data_agent1.json
    mapping = {
        "analytical_thinking": "analytical_thinking_logic",
        "problem_solving": "complex_problem_solving",
        "effective_communication": "effective_communication",
        "team_collaboration": "teamwork_collaboration",
        "continuous_learning": "self_directed_learning",
        "creativity_innovation": "creativity_innovation",
        "adaptability_resilience": "adaptability_resilience",
        "critical_thinking": "critical_thinking",
        "responsibility_autonomy": "responsibility_autonomy",
        "work_ethics_integrity": "ethics_integrity"
    }

    agent1_key = mapping.get(trait_key, "analytical_thinking_logic")

    # Xác định đường dẫn file mock_data_agent1.json
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    paths_to_try = [
        os.path.join(base_dir, "..", "roadmap", "mock_data_agent1.json"),
        os.path.join(base_dir, "mock_data_agent1.json")
    ]

    mock_data = []
    for path in paths_to_try:
        if os.path.exists(path):
            try:
                with open(path, "r", encoding="utf-8") as f:
                    mock_data = json.load(f)
                break
            except Exception:
                pass

    if not mock_data:
        # Fallback mặc định nếu không đọc được file
        return {
            "career_track": "Chuyên viên Phân tích",
            "field": "IT",
            "market_insight": "Ngành này đang phát triển mạnh mẽ và yêu cầu khả năng tư duy giải quyết vấn đề linh hoạt."
        }

    # Tìm nghề có điểm yêu cầu cao nhất cho tiêu chí này
    best_career = None
    max_score = -1

    for career in mock_data:
        core_comps = career.get("core_competencies", {})
        score = core_comps.get(agent1_key, 0)
        if score > max_score:
            max_score = score
            best_career = career

    if not best_career:
        best_career = mock_data[0]

    return {
        "career_track": best_career.get("career_track", "Nghề nghiệp"),
        "field": best_career.get("field", "Chung"),
        "market_insight": best_career.get("location_data", {}).get("market_insight", "Đang có nhu cầu tuyển dụng tốt.")
    }


def get_situational_question_for_trait(trait_key: str, used_questions: List[str] = None) -> Dict[str, Any]:
    """
    Lấy câu hỏi mỏ neo (anchor) và câu hỏi tình huống thực tế chưa được hỏi
    cho một tiêu chí UCEF cụ thể từ file situational_questions.json.
    
    Trả về dict gồm:
      - anchor_question: câu hỏi mỏ neo chính
      - situational_question: một câu hỏi tình huống cụ thể chưa dùng
      - high_score_signals: dấu hiệu điểm cao để Evaluator tham khảo
      - low_score_signals: dấu hiệu điểm thấp để Evaluator tham khảo
    """
    import os
    import json
    import random

    if used_questions is None:
        used_questions = []

    # Xác định đường dẫn file situational_questions.json
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    sq_path = os.path.join(base_dir, "data", "situational_questions.json")

    fallback = {
        "anchor_question": f"Bạn tự đánh giá bản thân như thế nào về khả năng '{trait_key}'?",
        "situational_question": "Hãy kể một tình huống cụ thể bạn đã thể hiện kỹ năng này.",
        "high_score_signals": [],
        "low_score_signals": []
    }

    if not os.path.exists(sq_path):
        return fallback

    try:
        with open(sq_path, "r", encoding="utf-8") as f:
            sq_data = json.load(f)
    except Exception:
        return fallback

    trait_data = sq_data.get(trait_key)
    if not trait_data:
        return fallback

    # Lọc ra những câu hỏi tình huống chưa được dùng trong phiên này
    all_situational = trait_data.get("situational_questions", [])
    unused = [q for q in all_situational if q not in used_questions]

    # Nếu tất cả đã dùng, dùng lại ngẫu nhiên
    chosen = random.choice(unused) if unused else (random.choice(all_situational) if all_situational else fallback["situational_question"])

    return {
        "anchor_question": trait_data.get("anchor_question", fallback["anchor_question"]),
        "situational_question": chosen,
        "high_score_signals": trait_data.get("high_score_signals", []),
        "low_score_signals": trait_data.get("low_score_signals", [])
    }

