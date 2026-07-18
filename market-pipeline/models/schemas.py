"""
models/schemas.py - Pydantic models để validate dữ liệu đầu vào từ mock_data_agent1.json
"""
from pydantic import BaseModel, Field, model_validator
from typing import Dict, List, Optional, Any


class DomainSkill(BaseModel):
    weight_omega: float = Field(..., ge=0.0, le=1.0, description="Tần suất xuất hiện trong JD (0-1)")
    required_level: int = Field(..., ge=1, le=10, description="Mức độ thông thạo yêu cầu (1-10)")


class CoreCompetencies(BaseModel):
    analytical_thinking: float = Field(..., ge=1, le=10)
    problem_solving: float = Field(..., ge=1, le=10)
    effective_communication: float = Field(..., ge=1, le=10)
    continuous_learning: float = Field(..., ge=1, le=10)
    team_collaboration: float = Field(..., ge=1, le=10)
    creativity_innovation: float = Field(..., ge=1, le=10)
    adaptability_resilience: float = Field(..., ge=1, le=10)
    critical_thinking: float = Field(..., ge=1, le=10)
    responsibility_autonomy: float = Field(..., ge=1, le=10)
    work_ethics_integrity: float = Field(..., ge=1, le=10)


class LocalDemandSignals(BaseModel):
    urgency: str
    hiring_volume: int


class TimelineTrends(BaseModel):
    risk_of_unemployment: str
    trend_score: float = Field(..., ge=0.0, le=1.0)


class DbData(BaseModel):
    career_track: str
    field_id: str = Field(..., pattern=r"^f_(it|business|art|vocational|medical)$")
    description: str
    avg_salary_min: int = Field(..., gt=0)
    avg_salary_max: int = Field(..., gt=0)
    education_route: str
    typical_employers: List[str]
    region_demand: Dict[str, str]   # {"Hà Nội": "High", ...}
    local_demand_signals: LocalDemandSignals
    timeline_trends: TimelineTrends

    @model_validator(mode="after")
    def check_salary_range(self):
        if self.avg_salary_min >= self.avg_salary_max:
            raise ValueError("avg_salary_min phải nhỏ hơn avg_salary_max")
        return self


class PineconeData(BaseModel):
    vector_id: str
    core_competencies: CoreCompetencies
    domain_competencies: Dict[str, DomainSkill]

    @model_validator(mode="after")
    def check_domain_not_empty(self):
        if not self.domain_competencies:
            raise ValueError("domain_competencies không được rỗng")
        return self


class CareerEntry(BaseModel):
    db_data: DbData
    pinecone_data: PineconeData
