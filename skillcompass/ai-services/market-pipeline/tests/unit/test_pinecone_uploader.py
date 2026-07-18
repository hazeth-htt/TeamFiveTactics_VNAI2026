import pytest
from unittest.mock import MagicMock
from models.schemas import PineconeData, CoreCompetencies, DomainSkill
from processors.pinecone_uploader import (
    _build_vector,
    _build_metadata,
    upsert_to_pinecone
)

def test_build_vector_normalization():
    """Kiểm tra vector 10 chiều được chuẩn hóa L2 chính xác"""
    core_dict = {
        "analytical_thinking": 3,
        "problem_solving": 4,
        "effective_communication": 0,
        "continuous_learning": 0,
        "team_collaboration": 0,
        "creativity_innovation": 0,
        "adaptability_resilience": 0,
        "critical_thinking": 0,
        "responsibility_autonomy": 0,
        "work_ethics_integrity": 0
    }
    # Norm của 3, 4, 0... là sqrt(3^2 + 4^2) = 5
    # Vector sau chuẩn hóa: [3/5, 4/5, 0, ...] = [0.6, 0.8, 0, ...]
    vector = _build_vector(core_dict)
    assert len(vector) == 10
    assert vector[1] == pytest.approx(0.6)
    assert vector[6] == pytest.approx(0.8)
    assert sum(x**2 for x in vector) == pytest.approx(1.0)

def test_build_vector_zero_error():
    """Kiểm tra báo lỗi khi tất cả điểm năng lực bằng 0 (norm = 0)"""
    core_dict = {k: 0 for k in [
        "analytical_thinking", "problem_solving", "effective_communication",
        "continuous_learning", "team_collaboration", "creativity_innovation",
        "adaptability_resilience", "critical_thinking", "responsibility_autonomy",
        "work_ethics_integrity"
    ]}
    with pytest.raises(ValueError):
        _build_vector(core_dict)

def test_build_metadata():
    """Kiểm tra đóng gói metadata Pinecone hợp lệ"""
    db_data = {
        "career_track": "Backend Engineer",
        "field_id": "it",
        "avg_salary_min": 12000000,
        "avg_salary_max": 25000000,
        "region_demand": {"HN": "high", "HCM": "high"},
        "timeline_trends": {"risk_of_unemployment": "Low", "trend_score": "0.85"}
    }
    domain_comp = {"python": {"weight_omega": 0.9, "required_level": 8}}
    
    metadata = _build_metadata(db_data, domain_comp)
    assert metadata["career_track"] == "Backend Engineer"
    assert metadata["field_id"] == "it"
    assert metadata["avg_salary_min"] == 12000000
    assert metadata["trend_score"] == 0.85
    assert "region_demand_json" in metadata
    assert "domain_competencies_json" in metadata

def test_upsert_to_pinecone_success():
    """Kiểm tra gọi upsert_to_pinecone thành công"""
    mock_index = MagicMock()
    core = CoreCompetencies(
        analytical_thinking=8, problem_solving=8, effective_communication=8,
        continuous_learning=8, team_collaboration=8, creativity_innovation=8,
        adaptability_resilience=8, critical_thinking=8, responsibility_autonomy=8,
        work_ethics_integrity=8
    )
    pinecone_data = PineconeData(
        vector_id="career_0001",
        core_competencies=core,
        domain_competencies={"python": DomainSkill(weight_omega=0.8, required_level=7)}
    )
    db_data = {
        "career_track": "Backend Engineer",
        "field_id": "it",
        "avg_salary_min": 12000000,
        "avg_salary_max": 25000000,
        "region_demand": {},
        "timeline_trends": {}
    }
    
    ok = upsert_to_pinecone(mock_index, pinecone_data, db_data, dry_run=False)
    assert ok is True
    mock_index.upsert.assert_called_once()

def test_upsert_to_pinecone_dry_run():
    """Kiểm tra dry-run không gọi đến Pinecone thực"""
    mock_index = MagicMock()
    core = CoreCompetencies(
        analytical_thinking=8, problem_solving=8, effective_communication=8,
        continuous_learning=8, team_collaboration=8, creativity_innovation=8,
        adaptability_resilience=8, critical_thinking=8, responsibility_autonomy=8,
        work_ethics_integrity=8
    )
    pinecone_data = PineconeData(
        vector_id="career_0001",
        core_competencies=core,
        domain_competencies={"python": DomainSkill(weight_omega=0.8, required_level=7)}
    )
    db_data = {
        "career_track": "Backend Engineer",
        "field_id": "it",
        "avg_salary_min": 12000000,
        "avg_salary_max": 25000000,
        "region_demand": {},
        "timeline_trends": {}
    }
    
    ok = upsert_to_pinecone(mock_index, pinecone_data, db_data, dry_run=True)
    assert ok is True
    mock_index.upsert.assert_not_called()
