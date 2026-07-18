"""
main.py - Agent 1: Toàn bộ pipeline xử lý dữ liệu tuyển dụng

Luồng 1 chiều liên tiếp:

  [Crawler] ─────────────────────────────────────────────────────────────────
    Crawl web (VietnamWorks, TopCV...) → INSERT vào PostgreSQL career_tracks
    Mỗi bản ghi mới INSERT vào sẽ có vector_id = NULL (chưa được xử lý)
  ────────────────────────────────────────────────────────────────────────────
                                    │
                                    ▼  (PostgreSQL career_tracks WHERE vector_id IS NULL)
  [Pipeline này] ─────────────────────────────────────────────────────────────
    Bước 1: Kết nối PostgreSQL + Pinecone
    Bước 2: Lấy danh sách bản ghi chưa có vector (vector_id IS NULL)
    Bước 3: Với MỖI bản ghi → Gọi LLM bóc tách description
               → core_competencies (10 năng lực cốt lõi)
               → domain_competencies (kỹ năng chuyên môn đặc thù)
    Bước 4: L2 normalize → Upsert vector 10-chiều + metadata lên Pinecone
    Bước 5: UPDATE vector_id vào PostgreSQL (đánh dấu "đã xử lý")
    Bước 6: Lặp lại từ Bước 3 cho bản ghi tiếp theo
  ────────────────────────────────────────────────────────────────────────────

Cách chạy:
    python main.py                      # Xử lý batch 50 bản ghi
    python main.py --batch-size 100     # Xử lý 100 bản ghi mỗi lần
    python main.py --dry-run            # Xem kết quả LLM, không ghi DB
    python main.py --skip-pinecone      # Chỉ chạy LLM, không ghi Pinecone (debug)
"""
import argparse

from config import BATCH_SIZE, get_pg_connection, get_pinecone_index
from processors.sql_reader import fetch_unembedded_careers, process_career_from_sql


def run(batch_size: int, dry_run: bool, skip_pinecone: bool):
    # ── Bước 1: Kết nối ────────────────────────────────────────────────────────
    print("🔌 Kết nối PostgreSQL...")
    pg_conn = get_pg_connection()
    print("  ✅ PostgreSQL: OK")

    pinecone_index = None
    if not skip_pinecone and not dry_run:
        print("🔌 Kết nối Pinecone...")
        pinecone_index = get_pinecone_index()
        print("  ✅ Pinecone: OK\n")

    # ── Bước 2: Lấy danh sách chưa xử lý ──────────────────────────────────────
    print(f"📖 Lấy tối đa {batch_size} bản ghi có vector_id IS NULL...")
    careers = fetch_unembedded_careers(pg_conn, batch_size)

    if not careers:
        print("  ✅ Tất cả bản ghi đã được xử lý. Không có gì mới.")
        pg_conn.close()
        return

    total = len(careers)
    print(f"  📋 Tìm thấy {total} bản ghi cần xử lý.\n")

    # ── Bước 3→5: Xử lý từng bản ghi (LLM → Pinecone → Update PG) ────────────
    success = 0
    fail = 0

    for i, career in enumerate(careers):
        print(f"[{i+1}/{total}] {career.career_track} (id={career.id})")
        ok = process_career_from_sql(
            conn=pg_conn,
            pinecone_index=pinecone_index,
            career=career,
            dry_run=dry_run,
        )
        if ok:
            success += 1
        else:
            fail += 1

    pg_conn.close()

    # ── Tổng kết ───────────────────────────────────────────────────────────────
    label = "[DRY-RUN]" if dry_run else "[LIVE]"
    print(f"\n{'='*50}")
    print(f"  {label} Pipeline hoàn tất!")
    print(f"  ✅ Thành công: {success}/{total}")
    if fail:
        print(f"  ❌ Thất bại:   {fail}/{total}")
    print(f"{'='*50}\n")


def main():
    parser = argparse.ArgumentParser(description="Agent 1 - Data Processing Pipeline")
    parser.add_argument("--batch-size", type=int, default=BATCH_SIZE,
                        help=f"Số bản ghi xử lý mỗi lần (default: {BATCH_SIZE})")
    parser.add_argument("--dry-run", action="store_true",
                        help="Chỉ in kết quả LLM, KHÔNG ghi vào DB")
    parser.add_argument("--skip-pinecone", action="store_true",
                        help="Bỏ qua Pinecone (dùng khi debug LLM output)")
    args = parser.parse_args()

    if args.dry_run:
        print("⚠️  DRY-RUN: Không ghi vào bất kỳ DB nào.\n")

    run(args.batch_size, args.dry_run, args.skip_pinecone)


if __name__ == "__main__":
    main()
