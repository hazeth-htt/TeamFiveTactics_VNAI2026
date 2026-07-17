import os
from dotenv import load_dotenv
from openai import OpenAI

# Load env variables from .env file
load_dotenv()

PORT = int(os.getenv("PORT", 8002))
LLM_API_KEY = os.getenv("LLM_API_KEY")
LLM_BASE_URL = os.getenv("LLM_BASE_URL", "https://openrouter.ai/api/v1")
LLM_MODEL = os.getenv("LLM_MODEL", "qwen/qwen-2.5-32b-instruct")

# Initialize standard OpenAI client (compatible with OpenRouter, DeepSeek, OpenAI, etc.)
client = None
if LLM_API_KEY and LLM_API_KEY != "placeholder_replace_me":
    client = OpenAI(
        base_url=LLM_BASE_URL,
        api_key=LLM_API_KEY
    )
else:
    print("WARNING: LLM_API_KEY is not set or is still a placeholder! LLM calls will fail until configured.")
