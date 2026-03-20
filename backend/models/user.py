"""
用户数据模型
"""
from pydantic import BaseModel, Field, validator, EmailStr
from typing import Optional
import re


class UserRegister(BaseModel):
    """用户注册请求"""
    user_id: str = Field(..., min_length=3, max_length=50)
    username: str = Field(..., min_length=3, max_length=30)
    password: str = Field(..., min_length=6, max_length=50)
    confirmPassword: str = Field(..., min_length=6, max_length=50)
    real_name: str = Field(..., min_length=2, max_length=20)
    email: Optional[str] = None
    phone: Optional[str] = None
    role: Optional[str] = "student"

    @validator('user_id')
    def validate_user_id(cls, v):
        if not re.match(r'^[a-zA-Z0-9_-]+$', v):
            raise ValueError('用户ID只能包含字母、数字、下划线和短横线')
        return v

    @validator('username')
    def validate_username(cls, v):
        if not re.match(r'^[a-zA-Z0-9_\u4e00-\u9fa5]+$', v):
            raise ValueError('用户名只能包含字母、数字、下划线和中文')
        return v

    @validator('phone')
    def validate_phone(cls, v):
        if v and not re.match(r'^1[3-9]\d{9}$', v):
            raise ValueError('手机号格式不正确')
        return v
        
    @validator('email')
    def validate_email(cls, v):
        if v and not re.match(r'^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$', v):
            raise ValueError('邮箱格式不正确')
        return v

    @validator('confirmPassword')
    def passwords_match(cls, v, values):
        if 'password' in values and v != values['password']:
            raise ValueError('两次输入的密码不一致')
        return v


class UserLogin(BaseModel):
    """用户登录请求"""
    identifier: str = Field(..., description="用户名或用户ID")
    password: str = Field(..., min_length=6, max_length=50)
    captcha_id: Optional[str] = Field(None, description="验证码ID")
    captcha_code: Optional[str] = Field(None, description="验证码")