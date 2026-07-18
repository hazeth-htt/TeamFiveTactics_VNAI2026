"""
processors/pg_writer.py - Ghi db_data vào bảng career_tracks trong PostgreSQL.

Dùng INSERT ... ON CONFLICT DO UPDATE (Upsert) để pipeline có thể chạy lại
nhiều lần mà không gây trùng lặp dữ liệu.
"""
import json
import psycopg2
from psycopg2.extras import execute_values
from models.schemas import DbData


# SQL để tạo bảng nếu chưa tồn tại (chạy 1 lần khi init)
CREATE_TABLE_SQL = """
CREATE TABLE IF NOT EXISTS public.career_tracks (
    id                  SERIAL PRIMARY KEY,
    career_track        VARCHAR(150) NOT NULL,
    field_id            VARCHAR(50)  NOT NULL,
    description         TEXT,
    avg_salary_min      INTEGER,
    avg_salary_max      INTEGER,
    education_route     TEXT,
    typical_employers   TEXT[],
    region_demand       JSONB,
    local_demand_signals JSONB,
    timeline_trends     JSONB,
    vector_id           VARCHAR(100),
    created_at          TIMESTAMP DEFAULT NOW(),
    updated_at          TIMESTAMP DEFAULT NOW(),
    CONSTRAINT uq_career_field UNIQUE (career_track, field_id)
);
"""

# SQL để upsert (insert hoặc update nếu đã tồn tại)
UPSERT_SQL = """
INSERT INTO public.career_tracks (
    career_track, field_id, description, avg_salary_min, avg_salary_max,
    education_route, typical_employers, region_demand, local_demand_signals,
    timeline_trends, vector_id, updated_at
)
VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW())
ON CONFLICT (career_track, field_id)
DO UPDATE SET
    description          = EXCLUDED.description,
    avg_salary_min       = EXCLUDED.avg_salary_min,
    avg_salary_max       = EXCLUDED.avg_salary_max,
    education_route      = EXCLUDED.education_route,
    typical_employers    = EXCLUDED.typical_employers,
    region_demand        = EXCLUDED.region_demand,
    local_demand_signals = EXCLUDED.local_demand_signals,
    timeline_trends      = EXCLUDED.timeline_trends,
    vector_id            = EXCLUDED.vector_id,
    updated_at           = NOW();
"""


def ensure_table_exists(conn):
    """Tạo bảng career_tracks nếu chưa tồn tại."""
    with conn.cursor() as cur:
        cur.execute(CREATE_TABLE_SQL)
    conn.commit()
    print("  ✅ [PG] Bảng career_tracks đã sẵn sàng.")


def upsert_career_to_pg(conn, db_data: DbData, vector_id: str, dry_run: bool = False) -> bool:
    """
    Ghi một career entry vào PostgreSQL.

    Args:
        conn: psycopg2 connection object.
        db_data: Pydantic model chứa dữ liệu cần ghi.
        vector_id: ID của vector tương ứng trong Pinecone (để liên kết).
        dry_run: Nếu True, không ghi thật vào DB.

    Returns:
        True nếu thành công.
    """
    row = (
        db_data.career_track,
        db_data.field_id,
        db_data.description,
        db_data.avg_salary_min,
        db_data.avg_salary_max,
        db_data.education_route,
        db_data.typical_employers,                          # list -> text[]
        json.dumps(db_data.region_demand),                  # dict -> JSONB
        json.dumps(db_data.local_demand_signals.model_dump()),
        json.dumps(db_data.timeline_trends.model_dump()),
        vector_id,
    )

    if dry_run:
        print(f"  [DRY-RUN PG] Sẽ upsert: {db_data.career_track} ({db_data.field_id})")
        return True

    try:
        with conn.cursor() as cur:
            cur.execute(UPSERT_SQL, row)
        conn.commit()
        return True
    except Exception as e:
        conn.rollback()
        print(f"  ❌ [PG] Lỗi khi ghi {db_data.career_track}: {e}")
        return False
