import json
from openai import OpenAI
import config
import prompts

# Khởi tạo OpenAI Client kết nối với DeepSeek API qua FPT Cloud
client = None

def get_client() -> OpenAI:
    """
    Khởi tạo và trả về client kết nối OpenAI-compatible API.
    """
    global client
    if client is None:
        if not config.LLM_API_KEY:
            raise ValueError("LLM_API_KEY chưa được cấu hình trong file .env!")
        client = OpenAI(
            api_key=config.LLM_API_KEY,
            base_url=config.LLM_BASE_URL
        )
    return client

def evaluate_domain_skills(conversation_history: list, required_skills: list) -> dict:
    """
    Gọi DeepSeek API chấm điểm các kỹ năng chuyên môn của học sinh dựa trên lịch sử chat.
    """
    openai_client = get_client()
    
    # Tạo prompt chấm điểm
    user_prompt = prompts.generate_evaluation_prompt(conversation_history, required_skills)
    
    try:
        # Gọi API Chat Completions của DeepSeek
        response = openai_client.chat.completions.create(
            model=config.LLM_MODEL,
            messages=[
                {"role": "system", "content": prompts.DOMAIN_EVAL_SYSTEM_INSTRUCTION},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.1  # Nhiệt độ cực thấp để đảm bảo kết quả đánh giá khách quan
        )
        
        # Trích xuất và parse kết quả JSON trả về
        raw_text = response.choices[0].message.content.strip()
        result = json.loads(raw_text)
        
        # Đảm bảo kết quả là Dictionary và ép kiểu điểm số về float
        final_scores = {}
        for skill_id in required_skills:
            score = result.get(skill_id, 1.0)
            try:
                final_scores[skill_id] = float(score)
            except:
                final_scores[skill_id] = 1.0
                
        return final_scores
        
    except json.JSONDecodeError as je:
        print(f"Error parsing JSON domain scores: {je}")
        # Hỗ trợ làm sạch các thẻ markdown ```json ```
        try:
            cleaned_text = response.choices[0].message.content.strip()
            if cleaned_text.startswith("```json"):
                cleaned_text = cleaned_text[7:]
            if cleaned_text.endswith("```"):
                cleaned_text = cleaned_text[:-3]
            result = json.loads(cleaned_text.strip())
            
            final_scores = {}
            for skill_id in required_skills:
                score = result.get(skill_id, 1.0)
                final_scores[skill_id] = float(score)
            return final_scores
        except Exception as fe:
            print(f"Fallback parse failed: {fe}. Returning default scores.")
            return {skill_id: 1.0 for skill_id in required_skills}
            
    except Exception as e:
        print(f"Error calling DeepSeek API during skill evaluation: {e}")
        # Dự phòng lỗi kết nối hoặc API: Trả về điểm mặc định 1.0 để không gây gián đoạn thuật toán RAG
        return {skill_id: 1.0 for skill_id in required_skills}

def generate_career_roadmap(user_profile: dict, matched_careers: list) -> dict:
    """
    Gọi DeepSeek API để sinh báo cáo lộ trình dựa trên hồ sơ học sinh và các ngành học đã lọc sẵn.
    """
    openai_client = get_client()

    # Tạo nội dung prompt người dùng
    user_prompt = prompts.generate_user_prompt(user_profile, matched_careers)

    try:
        # Gọi API Chat Completions của DeepSeek
        response = openai_client.chat.completions.create(
            model=config.LLM_MODEL,
            messages=[
                {"role": "system", "content": prompts.ROADMAP_SYSTEM_INSTRUCTION},
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
