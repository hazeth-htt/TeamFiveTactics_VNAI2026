from pydantic import BaseModel, Field
from typing import List, Dict, Optional

class Message(BaseModel):
    role: str  # "user" hoặc "assistant"
    content: str

class EvaluationFramework(BaseModel):
    general_base_questions: List[str] = Field(default_factory=list, description="Câu hỏi mỏ neo Tầng 1 (Chung)")
    field_specific_base_questions: List[str] = Field(default_factory=list, description="Câu hỏi mỏ neo Tầng 2 (Chuyên ngành)")
    traits_to_evaluate: Dict[str, str] = Field(default_factory=dict, description="Các tiêu chí đánh giá gồm {tên_tiêu_chí: mô_tả}")

class MarketExpectations(BaseModel):
    preferred_locations: List[str] = Field(default_factory=list, description="Khu vực làm việc mong muốn")
    expected_salary_min: int = Field(0, description="Mức lương khởi điểm kỳ vọng (VND/tháng)")
    willing_to_relocate: bool = Field(False, description="Sẵn sàng chuyển nơi làm việc không")
    family_support: Optional[str] = Field(None, description="Định hướng từ gia đình")
    health_issues: Optional[str] = Field(None, description="Cân nhắc sức khỏe đặc biệt")
    asked_family: bool = Field(False, description="Đã hỏi về gia đình chưa")
    asked_health: bool = Field(False, description="Đã hỏi về sức khỏe chưa")


class ProfileState(BaseModel):
    context_inferred: str = Field("highschool", description="Bối cảnh nhận diện ngầm")
    core_scores: Dict[str, float] = Field(default_factory=dict, description="Điểm số các Core Competencies")
    domain_scores: Dict[str, float] = Field(default_factory=dict, description="Điểm số kỹ năng chuyên môn")
    market_expectations: MarketExpectations = Field(default_factory=MarketExpectations, description="Kỳ vọng thực tế thị trường")
    confidence_scores: Dict[str, float] = Field(default_factory=dict, description="Độ tin cậy của các tiêu chí tương ứng")
    is_ready: bool = Field(False, description="Đã thu thập đủ thông tin để sinh roadmap")

class ChatRequest(BaseModel):
    session_id: str
    message: str
    target_field: str = Field(..., description="Lĩnh vực học sinh lựa chọn")
    evaluation_framework: EvaluationFramework = Field(..., description="Khung năng lực động")
    conversation_history: List[Message]
    current_state: Optional[ProfileState] = Field(None, description="Trạng thái hồ sơ hiện tại gửi từ NestJS")

class ChatResponse(BaseModel):
    replies: List[str] = Field(..., description="Danh sách câu phản hồi ngắn")
    profile_update: ProfileState = Field(..., description="Trạng thái hồ sơ được cập nhật")
    is_ready: bool = Field(False, description="Cờ đánh giá kết thúc phiên chat")
