"""
认证工具模块
提供 JWT 认证和密码哈希功能
"""
import os
import logging
from datetime import datetime, timedelta
from typing import Optional

import bcrypt
from jose import jwt, JWTError
from fastapi import Depends, HTTPException, Header
from pydantic import BaseModel

logger = logging.getLogger(__name__)

DEFAULT_SECRET_KEY = "your-secret-key-change-in-production"  # nosec B105
SECRET_KEY = os.getenv("SECRET_KEY", DEFAULT_SECRET_KEY)
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 24

# 安全检测：启动时检查 SECRET_KEY 是否为默认值
if SECRET_KEY == DEFAULT_SECRET_KEY:
    import warnings
    warnings.warn(
        "⚠️ 安全警告：SECRET_KEY 使用了默认值，请在生产环境中设置强随机密钥！"
        "在 .env 文件中设置 SECRET_KEY=<随机密钥>",
        RuntimeWarning,
        stacklevel=2
    )


class TokenData(BaseModel):
    user_id: Optional[str] = None
    role: Optional[str] = None


def hash_password(password: str) -> str:
    """使用 bcrypt 哈希密码"""
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """验证密码"""
    return bcrypt.checkpw(
        plain_password.encode('utf-8'),
        hashed_password.encode('utf-8')
    )


def create_access_token(user_id: str, role: str = "student", expires_delta: Optional[timedelta] = None) -> str:
    """创建 JWT 访问令牌"""
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)

    to_encode = {
        "sub": user_id,
        "role": role,
        "exp": expire,
        "iat": datetime.utcnow()
    }

    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def decode_token(token: str) -> Optional[TokenData]:
    """解码并验证 JWT 令牌"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        role: str = payload.get("role")

        if user_id is None:
            return None

        return TokenData(user_id=user_id, role=role)
    except JWTError as e:
        logger.warning(f"Token 解码失败: {e}")
        return None


async def get_current_user(
    authorization: Optional[str] = Header(None),
    token: Optional[str] = None
) -> TokenData:
    """获取当前登录用户（依赖项）"""
    # 支持从 query parameter 或 header 获取 token
    if not authorization and token:
        authorization = f"Bearer {token}"
    
    if not authorization:
        raise HTTPException(status_code=401, detail="未登录，请先登录")

    if authorization.startswith("Bearer "):
        auth_token = authorization[7:]
    else:
        auth_token = authorization

    token_data = decode_token(auth_token)
    if token_data is None:
        raise HTTPException(status_code=401, detail="Token 无效或已过期")

    return token_data


async def get_current_user_optional(authorization: Optional[str] = Header(None)) -> Optional[TokenData]:
    """获取当前登录用户（可选，不强制登录）"""
    if not authorization:
        return None

    if authorization.startswith("Bearer "):
        token = authorization[7:]
    else:
        token = authorization

    return decode_token(token)


async def require_admin(current_user: TokenData = Depends(get_current_user)) -> TokenData:
    """要求管理员权限"""
    if current_user.role not in ["admin"]:
        raise HTTPException(status_code=403, detail="权限不足，需要管理员权限")
    return current_user


async def require_organizer(current_user: TokenData = Depends(get_current_user)) -> TokenData:
    """要求组织者或管理员权限"""
    if current_user.role not in ["admin", "organizer"]:
        raise HTTPException(status_code=403, detail="权限不足，需要组织者或管理员权限")
    return current_user