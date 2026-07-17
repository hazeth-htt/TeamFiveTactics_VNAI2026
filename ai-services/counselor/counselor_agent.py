import config
from prompts import COUNSELOR_SYSTEM_PROMPT

def generate_reply(conversation_history: list, latest_message: str, target_field: str, evaluation_framework: dict, steering_directives: list = None) -> str:
    """
    Sinh câu phản hồi tự động thích ứng dựa trên khung câu hỏi mỏ neo 2 tầng và chỉ thị hệ thống.
    """
    if not config.LLM_API_KEY or config.LLM_API_KEY == "placeholder_replace_me":
        return "Vui lòng cấu hình LLM_API_KEY trong file .env để bắt đầu trò chuyện hướng nghiệp thực tế với AI."

    try:
        # Chuẩn bị lịch sử trò chuyện đầy đủ
        full_history = list(conversation_history)
        if latest_message:
            full_history.append({"role": "user", "content": latest_message})

        # Định dạng chi tiết khung năng lực và câu hỏi mỏ neo để tiêm vào prompt
        gen_qs = evaluation_framework.get("general_base_questions", [])
        spec_qs = evaluation_framework.get("field_specific_base_questions", [])
        traits = evaluation_framework.get("traits_to_evaluate", {})
        
        details = "1. CÁC CÂU HỎI MỎ NEO TẦNG 1 (CHUNG):\n"
        for q in gen_qs:
            details += f"- \"{q}\"\n"
        
        details += f"\n2. CÁC CÂU HỎI MỎ NEO TẦNG 2 (CHUYÊN NGÀNH - Lĩnh vực: {target_field}):\n"
        for q in spec_qs:
            details += f"- \"{q}\"\n"
            
        details += "\n3. CÁC TIÊU CHÍ (TRAITS) CẦN ĐÁNH GIÁ ĐỂ CHẤM ĐIỂM:\n"
        for trait_name, trait_desc in traits.items():
            details += f"- {trait_name}: {trait_desc}\n"

        # Định cấu hình system instruction
        system_instruction = COUNSELOR_SYSTEM_PROMPT.format(framework_details=details)

        # Bổ sung các chỉ thị định hướng hội thoại nếu có (ví dụ yêu cầu hỏi về vùng miền/mức lương)
        if steering_directives:
            system_instruction += "\n\nCHỈ THỊ QUAN TRỌNG BẮT BUỘC CHO LƯỢT NÀY:\n"
            for directive in steering_directives:
                system_instruction += f"- {directive}\n"

        # Gọi LLM sinh câu trả lời
        reply = config.call_llm(
            system_instruction=system_instruction,
            messages=full_history,
            temperature=0.7
        )
        return reply
    except Exception as e:
        print(f"Error calling LLM in counselor_agent: {e}")
        return f"[Lỗi kết nối API]: {str(e)}. Vui lòng kiểm tra lại khóa API hoặc kết nối mạng của bạn."
