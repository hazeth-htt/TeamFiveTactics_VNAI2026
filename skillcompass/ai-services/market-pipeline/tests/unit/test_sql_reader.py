import pytest
from unittest.mock import patch, MagicMock
from processors.sql_reader import (
    _map_track_type_to_field_id,
    process_career_from_sql,
    CareerTrackRow
)

@pytest.fixture
def mock_career():
    return CareerTrackRow(
        id=42,
        career_track="Bác sĩ Chỉnh nha",
        track_type="Y tế & Chăm sóc sức khỏe",
        description="Khám, tư vấn và điều trị răng hàm mặt chuyên sâu...",
        avg_salary_min=20000000,
        avg_salary_max=50000000,
        education_route="Đại học Y Dược 6 năm",
        typical_employers=["Bệnh viện răng hàm mặt", "Nha khoa quốc tế"],
        region_demand={"HN": "high", "HCM": "high"},
        local_demand_signals={},
        timeline_trends={},
        vector_id=None
    )

@pytest.fixture
def mock_pg_conn():
    conn = MagicMock()
    # Mock context manager for cursor
    mock_cursor = MagicMock()
    conn.cursor.return_value.__enter__.return_value = mock_cursor
    return conn

def test_map_track_type_to_field_id():
    """Kiểm tra việc chuyển đổi track_type sang ASCII slug"""
    assert _map_track_type_to_field_id("Du lịch & Giải trí") == "du_lich_giai_tri"
    assert _map_track_type_to_field_id("Công nghệ thông tin") == "cong_nghe_thong_tin"
    assert _map_track_type_to_field_id("Nhân sự") == "nhan_su"
    assert _map_track_type_to_field_id("Cơ khí & Tự động hóa") == "co_khi_tu_dong_hoa"
    assert _map_track_type_to_field_id("") == "general"
    assert _map_track_type_to_field_id(None) == "general"

def test_process_career_success(mock_career, mock_pg_conn):
    """TC-SQL-01: Pipeline chạy thành công hoàn toàn cho 1 bản ghi"""
    mock_pinecone = MagicMock()
    mock_llm_result = {
        "core_competencies": {
            "analytical_thinking": 8, "problem_solving": 8,
            "effective_communication": 9, "continuous_learning": 8,
            "team_collaboration": 7, "creativity_innovation": 6,
            "adaptability_resilience": 8, "critical_thinking": 8,
            "responsibility_autonomy": 8, "work_ethics_integrity": 9
        },
        "domain_competencies": {
            "orthodontics": {"weight_omega": 0.95, "required_level": 9}
        }
    }
    
    with patch("processors.sql_reader.extract_competencies_from_jd", return_value=mock_llm_result):
        ok = process_career_from_sql(
            conn=mock_pg_conn,
            pinecone_index=mock_pinecone,
            career=mock_career,
            dry_run=False
        )
        
    assert ok is True
    # Kiểm tra đã gọi upsert lên Pinecone
    mock_pinecone.upsert.assert_called_once()
    # Kiểm tra database đã chạy lệnh UPDATE vector_id
    mock_cursor = mock_pg_conn.cursor.return_value.__enter__.return_value
    mock_cursor.execute.assert_called_once()
    sql_arg = mock_cursor.execute.call_args[0][0]
    params_arg = mock_cursor.execute.call_args[0][1]
    assert "UPDATE public.career_tracks" in sql_arg
    assert params_arg[1] == mock_career.id

def test_process_career_llm_failure(mock_career, mock_pg_conn):
    """TC-SQL-02: LLM trả về kết quả rỗng → không đẩy Pinecone, không ghi DB"""
    mock_pinecone = MagicMock()
    
    with patch("processors.sql_reader.extract_competencies_from_jd", return_value=None):
        ok = process_career_from_sql(
            conn=mock_pg_conn,
            pinecone_index=mock_pinecone,
            career=mock_career,
            dry_run=False
        )
        
    assert ok is False
    mock_pinecone.upsert.assert_not_called()
    mock_cursor = mock_pg_conn.cursor.return_value.__enter__.return_value
    mock_cursor.execute.assert_not_called()

def test_process_career_pinecone_failure(mock_career, mock_pg_conn):
    """TC-SQL-03: Gửi Pinecone bị lỗi → database rollback hoặc không update vector_id"""
    mock_pinecone = MagicMock()
    mock_pinecone.upsert.side_effect = Exception("Pinecone timeout error")
    
    mock_llm_result = {
        "core_competencies": {
            "analytical_thinking": 5, "problem_solving": 5,
            "effective_communication": 5, "continuous_learning": 5,
            "team_collaboration": 5, "creativity_innovation": 5,
            "adaptability_resilience": 5, "critical_thinking": 5,
            "responsibility_autonomy": 5, "work_ethics_integrity": 5
        },
        "domain_competencies": {}
    }
    
    with patch("processors.sql_reader.extract_competencies_from_jd", return_value=mock_llm_result):
        # Vì process_career_from_sql bắt và xử lý exception Pinecone, hoặc chúng ta xem behavior của nó
        # Hãy xem sql_reader.py xem có bắt exception upsert không.
        ok = process_career_from_sql(
            conn=mock_pg_conn,
            pinecone_index=mock_pinecone,
            career=mock_career,
            dry_run=False
        )
        
    assert ok is False
    mock_cursor = mock_pg_conn.cursor.return_value.__enter__.return_value
    mock_cursor.execute.assert_not_called()
