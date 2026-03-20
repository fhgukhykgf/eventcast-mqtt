"""
活动数据模型
"""
from pydantic import BaseModel, Field, validator
from typing import Optional
import re


class EventCreate(BaseModel):
    """创建活动请求"""
    event_id: str = Field(..., min_length=3, max_length=50)
    title: str = Field(..., min_length=2, max_length=100)
    start_time: str = Field(..., description="格式: YYYY-MM-DD HH:MM")
    end_time: str = Field(..., description="格式: YYYY-MM-DD HH:MM")
    location: str = Field(..., min_length=2, max_length=100)
    limit_num: Optional[int] = Field(None, ge=1, le=1000)
    description: Optional[str] = Field(None, max_length=500)
    organizer: Optional[str] = Field(None, max_length=50)
    time: Optional[str] = Field(None, description="兼容旧字段")

    @validator('event_id')
    def validate_event_id(cls, v):
        if not re.match(r'^[a-zA-Z0-9_-]+$', v):
            raise ValueError('活动ID只能包含字母、数字、下划线和短横线')
        return v

    @validator('start_time', 'end_time', 'time')
    def validate_time(cls, v):
        if v is None:
            return v
        from datetime import datetime
        try:
            datetime.strptime(v, '%Y-%m-%d %H:%M')
        except ValueError:
            raise ValueError('时间格式应为 YYYY-MM-DD HH:MM')
        return v


class EventUpdate(BaseModel):
    """更新活动请求"""
    title: Optional[str] = Field(None, min_length=2, max_length=100)
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    location: Optional[str] = Field(None, min_length=2, max_length=100)
    organizer: Optional[str] = Field(None, max_length=50)
    description: Optional[str] = Field(None, max_length=500)
    status: Optional[str] = None
    time: Optional[str] = None

    @validator('start_time', 'end_time', 'time')
    def validate_time(cls, v):
        if v is None:
            return v
        from datetime import datetime
        try:
            datetime.strptime(v, '%Y-%m-%d %H:%M')
        except ValueError:
            raise ValueError('时间格式应为 YYYY-MM-DD HH:MM')
        return v