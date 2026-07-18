"""
config.py - Khởi tạo kết nối PostgreSQL và Pinecone từ biến môi trường.
"""
import os
from dotenv import load_dotenv

load_dotenv()

# ── Pinecone ──────────────────────────────────────────────────────────────────
def get_pinecone_index():
    """Khởi tạo và trả về Pinecone Index object."""
    from pinecone import Pinecone
    api_key = os.getenv("PINECONE_API_KEY")
    index_name = os.getenv("PINECONE_INDEX_NAME", "skillcompass-careers")
    if not api_key:
        raise ValueError("PINECONE_API_KEY chưa được cấu hình trong .env")
    pc = Pinecone(api_key=api_key)
    return pc.Index(index_name)

# ── PostgreSQL ─────────────────────────────────────────────────────────────────
def get_pg_connection():
    """Tạo và trả về kết nối PostgreSQL."""
    import psycopg2
    try:
        conn = psycopg2.connect(
            host=os.getenv("POSTGRES_HOST", "localhost"),
            port=int(os.getenv("POSTGRES_PORT", 5432)),
            dbname=os.getenv("POSTGRES_DB", "skillcompass"),
            user=os.getenv("POSTGRES_USER", "postgres"),
            password=os.getenv("POSTGRES_PASSWORD", ""),
        )
        return conn
    except psycopg2.OperationalError as e:
        raise ConnectionError(f"Không thể kết nối PostgreSQL: {e}")

# ── LLM (FPT Cloud / OpenAI-compatible) ───────────────────────────────────────
LLM_API_KEY   = os.getenv("LLM_API_KEY", "")
LLM_BASE_URL  = os.getenv("LLM_BASE_URL", "https://mkp-api.fptcloud.com/v1")
LLM_MODEL     = os.getenv("LLM_MODEL", "DeepSeek-V4-Flash")

# ── Pipeline Config ────────────────────────────────────────────────────────────
INPUT_FILE = os.getenv("INPUT_FILE", "../mock_data_agent1.json")
BATCH_SIZE = int(os.getenv("BATCH_SIZE", 50))

# Thứ tự key CỐ ĐỊNH để build vector 10-chiều (phải khớp giữa Agent 1 và Agent 3)
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
