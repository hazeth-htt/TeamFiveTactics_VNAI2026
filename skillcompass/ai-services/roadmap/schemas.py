from pydantic import BaseModel, Field
from typing import Dict, List, Optional

# --- REQUEST SCHEMAS (From NestJS) ---

class MarketExpectations(BaseModel):
    preferred_locations: List[str] = Field(default_factory=list, description="Danh sách các tỉnh thành muốn làm việc")
    expected_salary_min: int = Field(default=0, ge=0, description="Mức lương mong muốn tối thiểu (VND)")
    willing_to_relocate: bool = Field(default=False, description="Sẵn sàng chuyển vị trí làm việc hay không")

class UserProfile(BaseModel):
    core_scores: Dict[str, float] = Field(..., description="Điểm số 10 năng lực cốt lõi UCEF (thang điểm 1-10)")
    market_expectations: MarketExpectations = Field(..., description="Kỳ vọng thực tế của học sinh")

class ChatMessage(BaseModel):
    role: str = Field(..., description="Vai trò: user | assistant | system")
    content: str = Field(..., description="Nội dung tin nhắn")

class RoadmapRequest(BaseModel):
    user_profile: UserProfile
    conversation_history: List[ChatMessage] = Field(default_factory=list, description="Lịch sử hội thoại đầy đủ giữa học sinh và Agent 2")


# --- RESPONSE SCHEMAS (To NestJS) ---

class RoleProgression(BaseModel):
    level: str = Field(..., description="Cấp bậc thăng tiến: Entry | Mid | Advanced")
    title: str = Field(..., description="Tên công việc / vị trí")
    description: str = Field(..., description="Mô tả tóm tắt nhiệm vụ của cấp bậc này")

class SkillTree(BaseModel):
    fundamentals: List[str] = Field(..., description="Kỹ năng nền tảng cơ bản")
    core_technologies: List[str] = Field(..., description="Kỹ năng/Công nghệ cốt lõi cần làm việc")
    advanced_skills: List[str] = Field(..., description="Kỹ năng nâng cao để thăng tiến")

class CareerPath(BaseModel):
    path_id: int = Field(..., description="ID định danh lộ trình")
    track_type: str = Field(..., description="Loại lộ trình: academic (đại học) | vocational (học nghề)")
    career_track: str = Field(..., description="Tên ngành nghề hướng tới")
    match_score: int = Field(..., description="Điểm phù hợp tính cách & chuyên môn WFS (1-100)")
    why_it_fits: str = Field(..., description="Giải thích lý do lựa chọn và sự tương hợp")
    market_warning: str = Field("", description="Cảnh báo thị trường nếu có bất đồng về lương/địa điểm hoặc rủi ro thất nghiệp")
    role_progression: List[RoleProgression] = Field(..., description="Lộ trình thăng tiến 3 bước")
    skill_tree: SkillTree = Field(..., description="Cây kỹ năng đi kèm")

class RoadmapResponse(BaseModel):
    user_profile_summary: str = Field(..., description="Tóm tắt tổng quan về tính cách và tiềm năng của học sinh")
    paths: List[CareerPath] = Field(..., description="Danh sách 2-3 lộ trình sự nghiệp được đề xuất")
    disclaimer: str = Field(
        default="Lộ trình hướng nghiệp này được tổng hợp dựa trên dữ liệu thị trường lao động tại địa phương và đặc tính cá nhân của bạn. Đây là tài liệu tham khảo, bạn hoàn toàn có quyền tự quyết định con đường học tập của mình.",
        description="Tuyên bố miễn trừ trách nhiệm pháp lý"
    )
