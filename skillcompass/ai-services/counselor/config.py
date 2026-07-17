import os
from dotenv import dotenv_values
import google.generativeai as genai
from openai import OpenAI

# Read values directly from .env file to prevent stale OS environment variables
env_values = dotenv_values(".env")

PORT = int(env_values.get("PORT") or os.getenv("PORT") or 8002)
LLM_API_KEY = env_values.get("LLM_API_KEY") or os.getenv("LLM_API_KEY")
LLM_BASE_URL = (env_values.get("LLM_BASE_URL") or "").strip()
LLM_MODEL = env_values.get("LLM_MODEL") or os.getenv("LLM_MODEL") or "gemini-2.5-flash"

# Detect provider
USE_OPENAI = False
if LLM_BASE_URL and "openrouter" in LLM_BASE_URL.lower():
    USE_OPENAI = True
elif not LLM_MODEL.startswith("gemini-"):
    USE_OPENAI = True

# Initialize clients
openai_client = None
if USE_OPENAI:
    if LLM_API_KEY and LLM_API_KEY != "placeholder_replace_me":
        openai_client = OpenAI(api_key=LLM_API_KEY, base_url=LLM_BASE_URL)
        print(f"Using OpenRouter/OpenAI provider with model: {LLM_MODEL}")
    else:
        print("WARNING: Using OpenAI provider but LLM_API_KEY is not configured!")
else:
    if LLM_API_KEY and LLM_API_KEY != "placeholder_replace_me":
        genai.configure(api_key=LLM_API_KEY)
        print(f"Using Google Gemini provider with model: {LLM_MODEL}")
    else:
        print("WARNING: LLM_API_KEY is not set or is still a placeholder! Gemini calls will fail.")

def call_llm(system_instruction: str, messages: list, response_json: bool = False, temperature: float = 0.7) -> str:
    """
    Unified LLM call supporting both Gemini (google-generativeai) and OpenAI/OpenRouter APIs.
    `messages` format: list of dict with {"role": "user"|"assistant"|"model", "content": str}
    """
    if not LLM_API_KEY or LLM_API_KEY == "placeholder_replace_me":
        raise ValueError("LLM_API_KEY is not configured.")

    # 1. Clean and merge consecutive messages of the same role
    cleaned_messages = []
    for msg in messages:
        role = msg.get("role", "user")
        content = msg.get("content", "")
        if not content or not content.strip():
            continue
        # Normalize role
        norm_role = "model" if role in ("model", "assistant") else "user"
        if cleaned_messages and cleaned_messages[-1]["role"] == norm_role:
            cleaned_messages[-1]["content"] += "\n" + content
        else:
            cleaned_messages.append({"role": norm_role, "content": content})

    if not cleaned_messages:
        raise ValueError("No messages to send to LLM.")

    if USE_OPENAI:
        # Convert messages to OpenAI format: role is 'user' or 'assistant' or 'system'
        openai_messages = []
        if system_instruction:
            openai_messages.append({"role": "system", "content": system_instruction})
        
        for msg in cleaned_messages:
            role = "assistant" if msg["role"] == "model" else "user"
            openai_messages.append({"role": role, "content": msg["content"]})
            
        kwargs = {
            "model": LLM_MODEL,
            "messages": openai_messages,
            "temperature": temperature,
            "max_tokens": 4096,  # Tăng giới hạn token để tránh bị cắt cụt do phần suy luận (reasoning)
        }
        if response_json:
            kwargs["response_format"] = {"type": "json_object"}
            
        response = openai_client.chat.completions.create(**kwargs)
        
        # In lượng token đã tiêu thụ (FPT Cloud / OpenAI) ra console
        usage = getattr(response, "usage", None)
        if usage:
            print(f"\n[FPT AI TOKEN USAGE] Prompt: {usage.prompt_tokens} | Completion: {usage.completion_tokens} (incl. reasoning) | Total: {usage.total_tokens}")
        
        # Phòng ngừa lỗi khi content là None (thường gặp ở mô hình suy luận khi chưa ra hết câu trả lời)
        content = response.choices[0].message.content
        if content is None:
            # Fallback lấy reasoning_content nếu có
            content = getattr(response.choices[0].message, "reasoning_content", "") or ""
        return content.strip()
    else:
        # Use Google Gemini SDK
        # For Gemini, the sequence of messages MUST start with 'user'.
        while cleaned_messages and cleaned_messages[0]["role"] == "model":
            cleaned_messages.pop(0)

        if not cleaned_messages:
            raise ValueError("No valid alternating user messages found for Gemini.")

        model = genai.GenerativeModel(
            model_name=LLM_MODEL,
            system_instruction=system_instruction
        )
        
        # Convert messages to Gemini format: role is 'user' or 'model'
        contents = []
        for msg in cleaned_messages:
            contents.append({"role": msg["role"], "parts": [msg["content"]]})
            
        generation_config = {
            "temperature": temperature,
        }
        if response_json:
            generation_config["response_mime_type"] = "application/json"
            
        response = model.generate_content(
            contents,
            generation_config=generation_config
        )
        
        # In lượng token đã tiêu thụ (Gemini) ra console
        usage = getattr(response, "usage_metadata", None)
        if usage:
            print(f"\n[GEMINI TOKEN USAGE] Prompt: {usage.prompt_token_count} | Completion: {usage.candidates_token_count} | Total: {usage.total_token_count}")
            
        return response.text.strip()
