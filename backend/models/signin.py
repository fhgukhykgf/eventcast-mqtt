"""
签到数据模型
"""
from pydantic import BaseModel, Field
from typing import Optional

class ApplyRequest(BaseModel):
    """报名请求（注意：user_id 和 user_name 会被忽略，实际从 Token 中获取）"""
    event_id: str = Field(..., description="活动ID")
    user_id: Optional[str] = Field(None, description="用户ID（已废弃，从 Token 中获取）")
    user_name: Optional[str] = Field(None, description="用户姓名（已废弃，从 Token 中获取）")

class SignInRequest(BaseModel):
    """签到请求（注意：user_id 和 user_name 会被忽略，实际从 Token 中获取）"""
    event_id: str = Field(..., description="活动ID")
    user_id: Optional[str] = Field(None, description="用户ID（已废弃，从 Token 中获取）")
    user_name: Optional[str] = Field(None, description="用户姓名（已废弃，从 Token 中获取）")
    sign_method: Optional[str] = "scan"