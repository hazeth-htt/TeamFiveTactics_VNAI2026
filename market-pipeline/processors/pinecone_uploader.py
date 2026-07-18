"""
processors/pinecone_uploader.py - Nhúng core_competencies thành vector 10-chiều
và upsert lên Pinecone kèm domain_competencies trong Metadata.

⚠️ QUAN TRỌNG: Thứ tự key trong CORE_COMPETENCY_KEYS phải TUYỆT ĐỐI ĐỒNG BỘ
với cách Agent 3 build vector từ user_profile khi query. Thứ tự này được
định nghĩa tập trung tại config.py.
"""
import json
import numpy as np
from models.schemas import PineconeData
from config import CORE_COMPETENCY_KEYS


def _build_vector(core_competencies_dict: dict) -> list[float]:
    """
    Chuyển dict core_competencies thành dense vector theo thứ tự key cố định.
    Sau đó chuẩn hóa L2 (L2 Normalization) để đảm bảo Cosine Similarity
    trên Pinecone cho kết quả chính xác.

    Ví dụ:
        Input:  {"analytical_thinking": 9, "problem_solving": 8, ...}
        Output: [0.12, 0.31, 0.28, ...]  (10 số float, norm = 1)
    """
    raw_vector = [core_competencies_dict.get(key, 1.0) for key in CORE_COMPETENCY_KEYS]
    np_vector = np.array(raw_vector, dtype=np.float32)

    # L2 Normalization: chia mỗi phần tử cho độ dài vector
    norm = np.linalg.norm(np_vector)
    if norm == 0:
        raise ValueError("Vector core_competencies toàn số 0, không thể normalize.")
    normalized = np_vector / norm
    return normalized.tolist()


def _build_metadata(db_data_dict: dict, domain_competencies: dict) -> dict:
    """
    Tạo dict Metadata để lưu vào Pinecone cùng với vector.
    Metadata dùng để:
    - Hard filtering (Lọc theo province, salary_min, field_id)
    - WFS Re-ranking (Dùng domain_competencies_json)

    ⚠️ Pinecone Metadata chỉ chấp nhận: str, int, float, bool, list[str].
    Dict và nested object phải được json.dumps() thành chuỗi string.
    """
    return {
        # Hard-filter fields (Agent 3 có thể filter trực tiếp)
        "career_track":           db_data_dict["career_track"],
        "field_id":               db_data_dict["field_id"],
        "avg_salary_min":         db_data_dict["avg_salary_min"],
        "avg_salary_max":         db_data_dict["avg_salary_max"],
        "risk_of_unemployment":   db_data_dict["timeline_trends"]["risk_of_unemployment"],
        "trend_score":            db_data_dict["timeline_trends"]["trend_score"],
        "region_demand_json":     json.dumps(db_data_dict["region_demand"]),

        # WFS Re-ranking field (Agent 3 dùng json.loads() để decode)
        "domain_competencies_json": json.dumps(domain_competencies),
    }


def upsert_to_pinecone(index, pinecone_data: PineconeData, db_data_dict: dict, dry_run: bool = False) -> bool:
    """
    Build vector + metadata và upsert lên Pinecone.

    Args:
        index: Pinecone Index object (từ config.get_pinecone_index()).
        pinecone_data: Pydantic model chứa vector_id, core và domain competencies.
        db_data_dict: dict của db_data (để lấy filter fields cho metadata).
        dry_run: Nếu True, chỉ in ra mà không ghi thật.

    Returns:
        True nếu thành công.
    """
    # 1. Build 10-dim vector
    core_dict = pinecone_data.core_competencies.model_dump()
    vector_10d = _build_vector(core_dict)

    # 2. Build metadata
    domain_dict = {
        skill: data.model_dump()
        for skill, data in pinecone_data.domain_competencies.items()
    }
    metadata = _build_metadata(db_data_dict, domain_dict)

    if dry_run:
        print(f"  [DRY-RUN Pinecone] Sẽ upsert vector_id: {pinecone_data.vector_id}")
        print(f"    Vector (10-dim): {[round(v, 4) for v in vector_10d]}")
        print(f"    Metadata keys: {list(metadata.keys())}")
        return True

    try:
        index.upsert(vectors=[
            (pinecone_data.vector_id, vector_10d, metadata)
        ])
        return True
    except Exception as e:
        print(f"  ❌ [Pinecone] Lỗi khi upsert {pinecone_data.vector_id}: {e}")
        return False
