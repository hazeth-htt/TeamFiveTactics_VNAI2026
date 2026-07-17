from config import client, LLM_MODEL
from prompts import COUNSELOR_SYSTEM_PROMPT

def generate_reply(conversation_history: list, latest_message: str) -> str:
    # Fallback reply in case LLM API client is not configured
    if not client:
        return "Chào em! Anh đang chạy thử nghiệm hệ thống. Khi em cấu hình khóa API xong, anh sẽ tư vấn cụ thể và chi tiết hơn cho em nhé."

    try:
        # Build messages for API call
        messages = [{"role": "system", "content": COUNSELOR_SYSTEM_PROMPT}]
        
        # Add conversation history
        for msg in conversation_history:
            messages.append({"role": msg["role"], "content": msg["content"]})
            
        # Add latest user message
        messages.append({"role": "user", "content": latest_message})

        # Call the LLM (OpenRouter / DeepSeek / OpenAI)
        response = client.chat.completions.create(
            model=LLM_MODEL,
            messages=messages,
            temperature=0.7,
            max_tokens=500
        )
        
        return response.choices[0].message.content.strip()
    except Exception as e:
        print(f"Error calling LLM in counselor_agent: {e}")
        return f"Anh ghi nhận ý kiến của em về: '{latest_message}'. Em có thể chia sẻ thêm về môn học em thích nhất ở trường không?"
