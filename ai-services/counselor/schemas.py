from pydantic import BaseModel, Field
from typing import List, Dict

class Message(BaseModel):
    role: str # "user" hoặc "assistant"
    content: str

class ChatRequest(BaseModel):
    session_id: str
    message: str
    conversation_history: List[Message]

class ProfileUpdate(BaseModel):
    trait_scores: Dict[str, int] = Field(
        ..., 
        description="Điểm các tiêu chí từ 1-10: practical_skill, academic_interest, social_interaction, analytical_thinking"
    )
    confidence_scores: Dict[str, float] = Field(
        ..., 
        description="Độ tin cậy của điểm số tương ứng từ 0.0 đến 1.0"
    )

class ChatResponse(BaseModel):
    reply: str
    profile_update: ProfileUpdate
    is_ready: bool
