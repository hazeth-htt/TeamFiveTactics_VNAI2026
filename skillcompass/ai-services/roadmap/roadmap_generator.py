import json
from openai import OpenAI
import config
import prompts

# Khởi tạo OpenAI Client kết nối với DeepSeek API qua FPT Cloud
client = None
if config.LLM_API_KEY:
    client = OpenAI(
        api_key=config.LLM_API_KEY,
        base_url=config.LLM_BASE_URL
    )

def generate_career_roadmap(user_profile: dict, matched_careers: list) -> dict:
    """
    Gọi DeepSeek API qua thư viện OpenAI để sinh báo cáo lộ trình dựa trên hồ sơ học sinh và các ngành học đã lọc sẵn.
    """
    global client
    if not client:
        if not config.LLM_API_KEY:
            raise ValueError("LLM_API_KEY chưa được cấu hình trong file .env!")
        client = OpenAI(
            api_key=config.LLM_API_KEY,
            base_url=config.LLM_BASE_URL
        )

    # Tạo nội dung prompt người dùng
    user_prompt = prompts.generate_user_prompt(user_profile, matched_careers)

    try:
        # Gọi API Chat Completions của DeepSeek
        response = client.chat.completions.create(
            model=config.LLM_MODEL,
            messages=[
                {"role": "system", "content": prompts.SYSTEM_INSTRUCTION},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.2
        )
        
        # Trích xuất và parse dữ liệu JSON nhận được
        raw_text = response.choices[0].message.content.strip()
        result = json.loads(raw_text)
        return result
        
    except json.JSONDecodeError as je:
        print(f"Error parsing JSON response from DeepSeek: {je}")
        # Phương án dự phòng làm sạch chuỗi markdown code block nếu có
        try:
            cleaned_text = response.choices[0].message.content.strip()
            if cleaned_text.startswith("```json"):
                cleaned_text = cleaned_text[7:]
            if cleaned_text.endswith("```"):
                cleaned_text = cleaned_text[:-3]
            return json.loads(cleaned_text.strip())
        except Exception as fe:
            raise ValueError(f"Cannot parse JSON from AI response: {response.choices[0].message.content}") from fe
            
    except Exception as e:
        print(f"Error calling DeepSeek API: {e}")
        raise e
