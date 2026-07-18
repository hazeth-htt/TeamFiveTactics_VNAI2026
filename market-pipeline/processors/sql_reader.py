"""
processors/sql_reader.py - Đọc dữ liệu từ PostgreSQL (career_tracks table)
và dùng LLM để bóc tách ra core_competencies + domain_competencies.

Luồng:
    PostgreSQL (career_tracks)
        → Lọc các bản ghi chưa có vector_id (chưa được embed)
        → Gọi LLM bóc tách description → core + domain competencies
        → Build PineconeData
        → Upsert lên Pinecone
        → Cập nhật vector_id vào PostgreSQL

THIẾT KẾ MỞ:
    - field_id được đọc thẳng từ cột PostgreSQL (crawler tự set khi insert)
    - Không hardcode số lượng ngành nghề hay lĩnh vực
    - Domain competencies do LLM tự sinh từ JD → tự scale với mọi ngành mới
"""
import json
from dataclasses import dataclass
from typing import Optional

from models.schemas import PineconeData, CoreCompetencies, DomainSkill
from processors.llm_extractor import extract_competencies_from_jd
from processors.pinecone_uploader import upsert_to_pinecone


@dataclass
class CareerTrackRow:
    """Đại diện cho một bản ghi trong bảng career_tracks của PostgreSQL."""
    id: int
    career_track: str
    field_id: str               # Crawler tự điền: f_it, f_medical, f_law, f_finance...
    description: Optional[str]
    avg_salary_min: Optional[int]
    avg_salary_max: Optional[int]
    education_route: Optional[str]
    typical_employers: Optional[list]
    region_demand: Optional[dict]
    local_demand_signals: Optional[dict]
    timeline_trends: Optional[dict]
    vector_id: Optional[str]    # None = chưa được embed


# ── SQL Queries ────────────────────────────────────────────────────────────────
SQL_FETCH_UNEMBEDDED = """
SELECT
    id, career_track, field_id, description,
    avg_salary_min, avg_salary_max, education_route,
    typical_employers, region_demand, local_demand_signals,
    timeline_trends, vector_id
FROM public.career_tracks
WHERE vector_id IS NULL
ORDER BY id ASC
LIMIT %s;
"""

SQL_UPDATE_VECTOR_ID = """
UPDATE public.career_tracks
SET vector_id = %s, updated_at = NOW()
WHERE id = %s;
"""


def fetch_unembedded_careers(conn, batch_size: int = 50) -> list[CareerTrackRow]:
    """
    Lấy danh sách các career tracks chưa được embed (vector_id IS NULL).
    Không giới hạn field_id — lấy tất cả ngành nghề có trong DB.

    Args:
        conn: psycopg2 connection object.
        batch_size: Số lượng bản ghi lấy mỗi lần chạy.

    Returns:
        Danh sách CareerTrackRow objects.
    """
    with conn.cursor() as cur:
        cur.execute(SQL_FETCH_UNEMBEDDED, (batch_size,))
        rows = cur.fetchall()

    result = []
    for row in rows:
        result.append(CareerTrackRow(
            id=row[0],
            career_track=row[1],
            field_id=row[2] or "f_other",      # fallback nếu crawler chưa set
            description=row[3] or "",
            avg_salary_min=row[4],
            avg_salary_max=row[5],
            education_route=row[6] or "",
            typical_employers=row[7] or [],
            region_demand=row[8] or {},
            local_demand_signals=row[9] or {},
            timeline_trends=row[10] or {},
            vector_id=row[11],
        ))

    return result


def process_career_from_sql(
    conn,
    pinecone_index,
    career: CareerTrackRow,
    dry_run: bool = False,
) -> bool:
    """
    Xử lý một career track từ PostgreSQL:
    1. Gọi LLM bóc tách description → core + domain competencies.
    2. Build PineconeData và upsert lên Pinecone.
    3. Cập nhật vector_id vào PostgreSQL.

    field_id đến từ DB (crawler tự set) → không hardcode ngành nghề.

    Returns:
        True nếu thành công.
    """
    # 1. Tạo JD text từ các trường có trong DB
    jd_text = f"""
Vị trí: {career.career_track}
Mô tả: {career.description}
Lộ trình đào tạo: {career.education_route}
""".strip()

    # 2. Gọi LLM bóc tách (LLM tự hiểu ngành bất kỳ, không cần mapping cứng)
    print(f"  🤖 [LLM] Đang phân tích: {career.career_track} ({career.field_id})...")
    llm_result = extract_competencies_from_jd(career.career_track, jd_text)

    if not llm_result:
        print(f"  ❌ Không thể bóc tách JD cho: {career.career_track}")
        return False

    # 3. Build PineconeData
    try:
        core_data   = llm_result.get("core_competencies", {})
        domain_data = llm_result.get("domain_competencies", {})

        core_obj = CoreCompetencies(**core_data)

        domain_obj = {}
        for skill, vals in domain_data.items():
            domain_obj[skill] = DomainSkill(
                weight_omega=vals.get("weight_omega", 0.5),
                required_level=vals.get("required_level", 5),
            )

        # vector_id = career_{id}_{field_id} — field_id tự do, không hardcode
        vector_id = f"career_{career.id:04d}_{career.field_id}"

        pinecone_data = PineconeData(
            vector_id=vector_id,
            core_competencies=core_obj,
            domain_competencies=domain_obj,
        )

    except Exception as e:
        print(f"  ❌ Lỗi build data cho '{career.career_track}': {e}")
        return False

    # 4. Upsert lên Pinecone
    db_data_dict = {
        "career_track":      career.career_track,
        "field_id":          career.field_id,   # Đến từ DB, không hardcode
        "avg_salary_min":    career.avg_salary_min or 0,
        "avg_salary_max":    career.avg_salary_max or 0,
        "region_demand":     career.region_demand,
        "timeline_trends":   career.timeline_trends,
    }

    pinecone_ok = upsert_to_pinecone(
        index=pinecone_index,
        pinecone_data=pinecone_data,
        db_data_dict=db_data_dict,
        dry_run=dry_run,
    )

    if not pinecone_ok:
        return False

    # 5. Cập nhật vector_id vào PostgreSQL
    if not dry_run:
        with conn.cursor() as cur:
            cur.execute(SQL_UPDATE_VECTOR_ID, (vector_id, career.id))
        conn.commit()
        print(f"  ✅ vector_id='{vector_id}' đã được lưu.")
    else:
        print(f"  [DRY-RUN] Sẽ set vector_id='{vector_id}'")

    return True
