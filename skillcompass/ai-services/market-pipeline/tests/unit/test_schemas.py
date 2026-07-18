import pytest
from pydantic import ValidationError
from models.schemas import DbData, PineconeData, CoreCompetencies, DomainSkill

def test_domain_skill_valid():
    """Kiểm tra DomainSkill hợp lệ"""
    skill = DomainSkill(weight_omega=0.8, required_level=7)
    assert skill.weight_omega == 0.8
    assert skill.required_level == 7

def test_domain_skill_invalid_omega():
    """Kiểm tra DomainSkill lỗi khi weight_omega ngoài phạm vi [0.0, 1.0]"""
    with pytest.raises(ValidationError):
        DomainSkill(weight_omega=-0.1, required_level=7)
    with pytest.raises(ValidationError):
        DomainSkill(weight_omega=1.1, required_level=7)

def test_domain_skill_invalid_level():
    """Kiểm tra DomainSkill lỗi khi required_level ngoài phạm vi [1, 10]"""
    with pytest.raises(ValidationError):
        DomainSkill(weight_omega=0.5, required_level=0)
    with pytest.raises(ValidationError):
        DomainSkill(weight_omega=0.5, required_level=11)

def test_core_competencies_invalid_range():
    """Kiểm tra CoreCompetencies lỗi khi điểm ngoài phạm vi [1, 10]"""
    with pytest.raises(ValidationError):
        CoreCompetencies(
            analytical_thinking=11, # > 10
            problem_solving=8, effective_communication=8, continuous_learning=8,
            team_collaboration=8, creativity_innovation=8, adaptability_resilience=8,
            critical_thinking=8, responsibility_autonomy=8, work_ethics_integrity=8
        )

def test_db_data_salary_range_validator():
    """Kiểm tra validator avg_salary_min phải nhỏ hơn avg_salary_max"""
    # Hợp lệ
    db_data = DbData(
        career_track="Developer",
        field_id="it",
        description="Write code",
        avg_salary_min=10000000,
        avg_salary_max=20000000,
        education_route="Self study",
        typical_employers=["Google"],
        region_demand={"HN": "High"},
        local_demand_signals={"urgency": "High", "hiring_volume": 10},
        timeline_trends={"risk_of_unemployment": "Low", "trend_score": 0.9}
    )
    assert db_data.avg_salary_min == 10000000
    
    # Không hợp lệ: min >= max
    with pytest.raises(ValidationError):
        DbData(
            career_track="Developer",
            field_id="it",
            description="Write code",
            avg_salary_min=20000000,
            avg_salary_max=15000000, # nhỏ hơn min
            education_route="Self study",
            typical_employers=["Google"],
            region_demand={"HN": "High"},
            local_demand_signals={"urgency": "High", "hiring_volume": 10},
            timeline_trends={"risk_of_unemployment": "Low", "trend_score": 0.9}
        )

def test_pinecone_data_empty_domain():
    """Kiểm tra PineconeData lỗi khi domain_competencies bị rỗng"""
    core = CoreCompetencies(
        analytical_thinking=8, problem_solving=8, effective_communication=8,
        continuous_learning=8, team_collaboration=8, creativity_innovation=8,
        adaptability_resilience=8, critical_thinking=8, responsibility_autonomy=8,
        work_ethics_integrity=8
    )
    
    # Hợp lệ
    p_data = PineconeData(
        vector_id="career_0001",
        core_competencies=core,
        domain_competencies={"python": DomainSkill(weight_omega=0.8, required_level=7)}
    )
    assert "python" in p_data.domain_competencies

    # Lỗi: empty dict
    with pytest.raises(ValidationError):
        PineconeData(
            vector_id="career_0001",
            core_competencies=core,
            domain_competencies={}
        )
