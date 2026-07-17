from pydantic import BaseModel, Field
from typing import List, Dict, Optional

class Message(BaseModel):
    role: str # "user" hoặc "assistant"
    content: str

class EvaluationFramework(BaseModel):
    general_base_questions: List[str] = Field(default_factory=list, description="Câu hỏi mỏ neo Tầng 1 (Chung)")
    field_specific_base_questions: List[str] = Field(default_factory=list, description="Câu hỏi mỏ neo Tầng 2 (Chuyên ngành)")
    traits_to_evaluate: Dict[str, str] = Field(default_factory=dict, description="Các tiêu chí đánh giá gồm {tên_tiêu_chí: mô_tả}")

class ChatRequest(BaseModel):
    session_id: str
    message: str
    target_field: str = Field(..., description="Lĩnh vực người học lựa chọn")
    evaluation_framework: EvaluationFramework = Field(..., description="Khung năng lực động 2 tầng câu hỏi")
    conversation_history: List[Message]

class MarketExpectations(BaseModel):
    preferred_locations: List[str] = Field(default_factory=list, description="Khu vực làm việc mong muốn")
    expected_salary_min: int = Field(0, description="Mức lương khởi điểm kỳ vọng (VND/tháng)")
    willing_to_relocate: bool = Field(False, description="Sẵn sàng chuyển nơi làm việc không")

class ProfileUpdate(BaseModel):
    context_inferred: str = Field("highschool", description="Bối cảnh nhận diện ngầm (mặc định là highschool)")
    trait_scores: Dict[str, int] = Field(..., description="Điểm các tiêu chí tương thích theo framework")
    confidence_scores: Dict[str, float] = Field(..., description="Độ tin cậy của điểm số tương ứng (0.0 đến 1.0)")
    market_expectations: MarketExpectations = Field(..., description="Kỳ vọng thực tế về thị trường của học sinh")

class ChatResponse(BaseModel):
    reply: str
    profile_update: ProfileUpdate
    is_ready: bool
