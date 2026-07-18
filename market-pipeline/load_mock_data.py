"""
load_mock_data.py - Nạp mock data từ JSON vào PostgreSQL (chạy 1 lần khi setup).

Script này đọc file mock_data_agent1.json và INSERT vào bảng career_tracks,
với vector_id = NULL để agent1.py sẽ xử lý tiếp (LLM extract + Pinecone upsert).

Cách chạy:
    python load_mock_data.py                            # Dùng file mặc định
    python load_mock_data.py --input path/to/data.json  # Chỉ định file khác
    python load_mock_data.py --dry-run                  # Xem trước không INSERT
"""
import json
import argparse
from config import get_pg_connection

INSERT_SQL = """
INSERT INTO public.career_tracks (
    career_track, track_type, description,
    avg_salary_min, avg_salary_max, education_route,
    typical_employers, region_demand, local_demand_signals, timeline_trends
)
VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
ON CONFLICT DO NOTHING;
"""

CREATE_TABLE_SQL = """
CREATE TABLE IF NOT EXISTS public.career_tracks (
    id                   SERIAL PRIMARY KEY,
    career_track         VARCHAR(150) NOT NULL,
    track_type           VARCHAR(50),
    description          TEXT,
    avg_salary_min       INTEGER,
    avg_salary_max       INTEGER,
    education_route      TEXT,
    typical_employers    TEXT[],
    region_demand        JSONB,
    local_demand_signals JSONB,
    timeline_trends      JSONB,
    vector_id            VARCHAR(100),
    created_at           TIMESTAMP DEFAULT NOW(),
    updated_at           TIMESTAMP DEFAULT NOW()
);
"""

FIELD_TO_TRACK_TYPE = {
    "f_it":         "academic",
    "f_business":   "academic",
    "f_art":        "academic",
    "f_vocational": "vocational",
    "f_medical":    "academic",
}


def load(input_path: str, dry_run: bool):
    with open(input_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    print(f"📂 Đọc {len(data)} entries từ {input_path}")

    conn = get_pg_connection()
    with conn.cursor() as cur:
        cur.execute(CREATE_TABLE_SQL)
    conn.commit()
    print("  ✅ Bảng career_tracks đã sẵn sàng.\n")

    success = 0
    for i, entry in enumerate(data):
        db = entry.get("db_data", entry)  # Hỗ trợ cả format cũ và mới
        career_track  = db.get("career_track", "Unknown")
        field_id      = db.get("field_id", "f_it")
        track_type    = FIELD_TO_TRACK_TYPE.get(field_id, "academic")

        row = (
            career_track,
            track_type,
            db.get("description", ""),
            db.get("avg_salary_min", 0),
            db.get("avg_salary_max", 0),
            db.get("education_route", ""),
            db.get("typical_employers", []),
            json.dumps(db.get("region_demand", {})),
            json.dumps(db.get("local_demand_signals", {})),
            json.dumps(db.get("timeline_trends", {})),
        )

        print(f"  [{i+1}/{len(data)}] {career_track} ({field_id})")

        if not dry_run:
            with conn.cursor() as cur:
                cur.execute(INSERT_SQL, row)
            conn.commit()
            success += 1

    if not dry_run:
        conn.close()
        print(f"\n✅ Đã INSERT {success}/{len(data)} bản ghi vào PostgreSQL.")
        print("   Chạy python agent1.py để bắt đầu xử lý LLM + Pinecone.")
    else:
        print(f"\n[DRY-RUN] Sẽ INSERT {len(data)} bản ghi. Không có gì bị ghi.")


def main():
    parser = argparse.ArgumentParser(description="Load mock data vào PostgreSQL")
    parser.add_argument("--input", default="../../mock_data_agent1.json",
                        help="Đường dẫn file JSON mock data")
    parser.add_argument("--dry-run", action="store_true",
                        help="Chỉ xem trước, không INSERT vào DB")
    args = parser.parse_args()

    if args.dry_run:
        print("⚠️  DRY-RUN: Không ghi vào DB.\n")

    load(args.input, args.dry_run)


if __name__ == "__main__":
    main()
