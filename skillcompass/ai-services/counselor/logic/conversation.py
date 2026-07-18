import json
import sys
import os
from typing import List, Dict, Any

# Bổ sung path của root dự án để import config dễ dàng
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import config
from prompts.counselor_prompt import COUNSELOR_SYSTEM_PROMPT
from prompts.evaluator_prompt import EVALUATOR_SYSTEM_PROMPT
from logic.pii_filter import anonymize_message, anonymize_history
from logic.logger_helper import save_json_log

def run_evaluator_llm(
    conversation_history: List[Dict[str, str]], 
    latest_message: str,
    evaluation_framework: Dict[str, Any],
    session_id: str = "unknown"
) -> Dict[str, Any]:
    """
    Gọi LLM Evaluator (Agent 2B) để phân tích cuộc đối thoại hiện tại và trích xuất điểm số.
    """
    traits = evaluation_framework.get("traits_to_evaluate", {})
    
    # 1. Tạo chuỗi mô tả các traits
    traits_desc = ""
    for k, v in traits.items():
        traits_desc += f"- {k}: {v}\n"
        
    # 2. Tạo JSON điểm mặc định để điền vào prompt mẫu
    default_traits = {k: 5 for k in traits.keys()}
    default_core_scores_json = json.dumps(default_traits)
    
    # 3. Format system prompt của Evaluator
    system_instruction = EVALUATOR_SYSTEM_PROMPT.format(
        traits_desc=traits_desc,
        default_core_scores_json=default_core_scores_json
    )
    
    # 4. Chuẩn bị messages — lọc PII trước khi gửi lên LLM bên thứ 3
    messages = anonymize_history(list(conversation_history))
    if latest_message:
        messages.append({"role": "user", "content": anonymize_message(latest_message)})
        
    # Default response structure in case of JSON parse failure
    fallback_response = {
        "core_scores": {k: 5.0 for k in traits.keys()},
        "domain_scores": {},
        "market_expectations": {
            "preferred_locations": [],
            "expected_salary_min": 0
        },
        "evidence": "Không trích xuất được do lỗi JSON",
        "is_off_topic": False
    }
    
    input_log = {
        "system_instruction": system_instruction,
        "messages": messages,
        "response_json": True,
        "temperature": 0.1
    }
    
    try:
        # Gọi LLM (yêu cầu response_json)
        response_text = config.call_llm(
            system_instruction=system_instruction,
            messages=messages,
            response_json=True,
            temperature=0.1
        )
        
        # Xóa markdown code block nếu LLM bọc ngoài
        import re
        cleaned = re.sub(r"^```(?:json)?\s*", "", response_text.strip())
        cleaned = re.sub(r"\s*```$", "", cleaned)
        
        # Parse JSON output
        parsed_data = json.loads(cleaned)
        
        # Defensive parsing check to enforce expected schema structure
        if not isinstance(parsed_data, dict):
            parsed_data = fallback_response
        else:
            if not isinstance(parsed_data.get("core_scores"), dict):
                parsed_data["core_scores"] = fallback_response["core_scores"]
            if not isinstance(parsed_data.get("domain_scores"), dict):
                parsed_data["domain_scores"] = {}
            if not isinstance(parsed_data.get("market_expectations"), dict):
                parsed_data["market_expectations"] = fallback_response["market_expectations"]
            if "is_off_topic" not in parsed_data:
                parsed_data["is_off_topic"] = False
            if "warning_signal" not in parsed_data:
                parsed_data["warning_signal"] = False
        
        # Ghi log thành công
        save_json_log("evaluator", session_id, {
            "input": input_log,
            "output": {
                "raw_response": response_text,
                "parsed": parsed_data
            }
        })
        return parsed_data
    except Exception as e:
        print(f"Error calling or parsing Evaluator LLM: {e}")
        # Ghi log thất bại kèm theo error message
        save_json_log("evaluator", session_id, {
            "input": input_log,
            "error": str(e),
            "fallback": fallback_response
        })
        return fallback_response

def run_counselor_llm(
    conversation_history: List[Dict[str, str]], 
    latest_message: str,
    target_field: str,
    evaluation_framework: Dict[str, Any],
    counselor_instruction: str,
    session_id: str = "unknown"
) -> List[str]:
    """
    Gọi LLM Counselor (Agent 2A) để sinh câu trả lời tự nhiên dưới dạng mảng các dòng ngắn.
    """
    gen_qs = evaluation_framework.get("general_base_questions", [])
    spec_qs = evaluation_framework.get("field_specific_base_questions", [])
    traits = evaluation_framework.get("traits_to_evaluate", {})
    
    # 1. Định dạng chi tiết khung năng lực mỏ neo để tiêm vào prompt
    details = "1. CÁC CÂU HỎI MỎ NEO TẦNG 1 (CHUNG):\n"
    for q in gen_qs:
        details += f'- "{q}"\n'
        
    details += "\n2. CÁC CÂU HỎI MỎ NEO TẦNG 2 (CHUYÊN NGÀNH):\n"
    for q in spec_qs:
        details += f'- "{q}"\n'
        
    details += "\n3. CÁC TIÊU CHÍ ĐÁNH GIÁ (TRAITS):\n"
    for k, v in traits.items():
        details += f"- {k}: {v}\n"
        
    # 2. Format system prompt của Counselor
    system_instruction = COUNSELOR_SYSTEM_PROMPT.format(
        framework_details=details,
        counselor_instruction=counselor_instruction
    )
    
    # 3. Chuẩn bị messages — lọc PII trước khi gửi lên LLM bên thứ 3
    messages = anonymize_history(list(conversation_history))
    if latest_message:
        messages.append({"role": "user", "content": anonymize_message(latest_message)})
        
    input_log = {
        "system_instruction": system_instruction,
        "messages": messages,
        "temperature": 0.7
    }

    try:
        response_text = config.call_llm(
            system_instruction=system_instruction,
            messages=messages,
            temperature=0.7
        )
        
        # 4. Tách các dòng phản hồi ngắn (split theo newline)
        raw_lines = [line.strip() for line in response_text.split('\n') if line.strip()]
        
        # Lọc bỏ các dòng chứa số thứ tự rập khuôn như "1.", "2." (nếu LLM vi phạm định dạng)
        replies_list = []
        for line in raw_lines:
            # Loại bỏ tiền tố "1. ", "2. ", "- " nếu có
            cleaned_line = line
            if cleaned_line.startswith(("- ", "* ")):
                cleaned_line = cleaned_line[2:].strip()
            elif cleaned_line.strip() and cleaned_line[0].isdigit():
                # Check nếu bắt đầu bằng "digits. "
                parts = cleaned_line.split('.', 1)
                if len(parts) > 1 and parts[0].isdigit():
                    cleaned_line = parts[1].strip()
            
            if cleaned_line:
                replies_list.append(cleaned_line)
                
        # Fallback nếu phản hồi trống
        if not replies_list:
            replies_list = ["Mình hiểu rồi. Bạn có thể chia sẻ thêm về trải nghiệm thực tế này không?"]
            
        save_json_log("counselor", session_id, {
            "input": input_log,
            "output": {
                "raw_response": response_text,
                "parsed_replies": replies_list
            }
        })
        return replies_list
    except Exception as e:
        print(f"Error calling Counselor LLM: {e}")
        fallback = ["Rất tiếc, hệ thống gặp gián đoạn nhẹ. Mình cùng tiếp tục trò chuyện nhé."]
        save_json_log("counselor", session_id, {
            "input": input_log,
            "error": str(e),
            "fallback": fallback
        })
        return fallback
