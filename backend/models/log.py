"""
日志数据模型
"""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class OperationLog(BaseModel):
    """操作日志"""
    log_type: str = Field(..., description="日志类型: operation/login")
    user_id: str = Field(..., description="操作用户ID")
    user_name: str = Field(..., description="操作用户名")
    action: str = Field(..., description="操作类型")
    target_type: Optional[str] = Field(None, description="目标类型: event/user/sign")
    target_id: Optional[str] = Field(None, description="目标ID")
    target_name: Optional[str] = Field(None, description="目标名称")
    detail: Optional[str] = Field(None, description="操作详情")
    ip_address: Optional[str] = Field(None, description="IP地址")
    user_agent: Optional[str] = Field(None, description="用户代理")
    source: str = Field(default="webadmin", description="来源: webadmin/miniprogram")
    created_at: str = Field(default_factory=lambda: datetime.now().isoformat())


class LoginLog(BaseModel):
    """登录日志"""
    user_id: str = Field(..., description="用户ID")
    user_name: str = Field(..., description="用户名")
    login_time: str = Field(default_factory=lambda: datetime.now().isoformat())
    ip_address: Optional[str] = Field(None, description="IP地址")
    device: Optional[str] = Field(None, description="设备信息")
    source: str = Field(default="miniprogram", description="登录来源: webadmin/miniprogram")
    status: str = Field(default="success", description="登录状态: success/failed")
    fail_reason: Optional[str] = Field(None, description="失败原因")