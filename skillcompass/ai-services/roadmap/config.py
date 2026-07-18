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

# ── Pinecone ──
def get_pinecone_index():
    """Khởi tạo và trả về Pinecone Index object."""
    from pinecone import Pinecone
    api_key = os.getenv("PINECONE_API_KEY")
    index_name = os.getenv("PINECONE_INDEX_NAME", "skillcompass-careers")
    if not api_key:
        raise ValueError("PINECONE_API_KEY chưa được cấu hình trong .env")
    pc = Pinecone(api_key=api_key)
    return pc.Index(index_name)

# ── PostgreSQL ──
def get_pg_connection():
    """Tạo và trả về kết nối PostgreSQL."""
    import psycopg2
    try:
        conn = psycopg2.connect(
            host=os.getenv("POSTGRES_HOST", "localhost"),
            port=int(os.getenv("POSTGRES_PORT", 5432)),
            dbname=os.getenv("POSTGRES_DB", "SKILLCOMPASS"),
            user=os.getenv("POSTGRES_USER", "postgres"),
            password=os.getenv("POSTGRES_PASSWORD", ""),
        )
        return conn
    except psycopg2.OperationalError as e:
        raise ConnectionError(f"Không thể kết nối PostgreSQL: {e}")

# ── 10 Core Competency Keys (Standard UCEF) ──
CORE_COMPETENCY_KEYS = [
    "adaptability_resilience",
    "analytical_thinking",
    "continuous_learning",
    "creativity_innovation",
    "critical_thinking",
    "effective_communication",
    "problem_solving",
    "responsibility_autonomy",
    "team_collaboration",
    "work_ethics_integrity",
]

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
