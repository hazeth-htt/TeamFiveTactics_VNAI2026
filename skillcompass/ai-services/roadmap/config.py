import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# DeepSeek / OpenAI Standard LLM Config
LLM_API_KEY = os.getenv("LLM_API_KEY")
LLM_BASE_URL = os.getenv("LLM_BASE_URL")
LLM_MODEL = os.getenv("LLM_MODEL", "DeepSeek-V4-Flash")

# Data paths
DATA_AGENT1_PATH = os.getenv("DATA_AGENT1_PATH", "mock_data_agent1.json")

# Verification log
print("=== Configurations Loaded ===")
print(f"LLM_MODEL: {LLM_MODEL}")
print(f"LLM_BASE_URL: {LLM_BASE_URL}")
print(f"DATA_AGENT1_PATH: {DATA_AGENT1_PATH}")
if not LLM_API_KEY:
    print("Warning: LLM_API_KEY is not set!")
else:
    print("LLM_API_KEY: Loaded successfully (masked: " + LLM_API_KEY[:5] + "..." + LLM_API_KEY[-5:] + ")")
print("=============================")
