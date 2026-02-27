"""
签到数据模型
"""
from pydantic import BaseModel, Field
from typing import Optional

class ApplyRequest(BaseModel):
    """报名请求"""
    event_id: str = Field(..., description="活动ID")
    user_id: str = Field(..., description="用户ID")
    user_name: str = Field(..., description="用户姓名")

class SignInRequest(BaseModel):
    """签到请求"""
    event_id: str = Field(..., description="活动ID")
    user_id: str = Field(..., description="用户ID")
    user_name: str = Field(..., description="用户姓名")
    sign_method: Optional[str] = "scan"