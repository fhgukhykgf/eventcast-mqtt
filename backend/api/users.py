"""
用户管理接口
"""
from fastapi import APIRouter, HTTPException
import hashlib
import logging
from datetime import datetime
from utils.database import get_database
from models.user import UserRegister, UserLogin

router = APIRouter()
logger = logging.getLogger(__name__)


def hash_password(password: str) -> str:
    """密码哈希"""
    return hashlib.sha256(password.encode()).hexdigest()


def generate_token(user_id: str) -> str:
    """生成简单token"""
    import time
    return hashlib.md5(f"{user_id}{time.time()}".encode()).hexdigest()


@router.post("/register")
async def register(user: UserRegister):
    """用户注册"""
    try:
        db = await get_database()
        users = db["users"]

        # 检查用户是否已存在
        existing = await users.find_one({
            "$or": [
                {"user_id": user.user_id},
                {"username": user.username}
            ]
        })

        if existing:
            raise HTTPException(status_code=400, detail="用户ID或用户名已存在")

        # 准备用户数据
        user_data = user.dict()
        user_data["password"] = hash_password(user.password)
        user_data.update({
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat(),
            "status": "active",
            "apply_count": 0,
            "sign_count": 0,
            "role": user.role or "student"
        })

        # 移除确认密码字段
        if "confirmPassword" in user_data:
            del user_data["confirmPassword"]

        await users.insert_one(user_data)

        logger.info(f"用户注册成功: {user.user_id}")
        return {"code": 200, "msg": "注册成功"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"注册失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/login")
async def login(login_data: UserLogin):
    """用户登录"""
    try:
        db = await get_database()
        users = db["users"]

        # 查找用户
        user = await users.find_one({
            "$or": [
                {"username": login_data.identifier},
                {"user_id": login_data.identifier}
            ]
        })

        if not user:
            raise HTTPException(status_code=401, detail="用户不存在")

        if user["status"] != "active":
            raise HTTPException(status_code=401, detail="账号已被禁用")

        # 验证密码
        if user["password"] != hash_password(login_data.password):
            raise HTTPException(status_code=401, detail="密码错误")

        # 更新最后登录时间
        await users.update_one(
            {"_id": user["_id"]},
            {"$set": {"last_login": datetime.now().isoformat()}}
        )

        # 返回用户信息
        return {
            "code": 200,
            "msg": "登录成功",
            "data": {
                "user_info": {
                    "user_id": user["user_id"],
                    "username": user["username"],
                    "real_name": user.get("real_name", ""),
                    "email": user.get("email", ""),
                    "phone": user.get("phone", ""),
                    "role": user["role"]
                },
                "token": generate_token(user["user_id"])
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"登录失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/info/{user_id}")
async def get_user_info(user_id: str):
    """获取用户信息"""
    try:
        db = await get_database()
        user = await db["users"].find_one({"user_id": user_id})

        if not user:
            raise HTTPException(status_code=404, detail="用户不存在")

        return {
            "code": 200,
            "data": {
                "user_id": user["user_id"],
                "username": user["username"],
                "real_name": user.get("real_name", ""),
                "email": user.get("email", ""),
                "phone": user.get("phone", ""),
                "role": user["role"],
                "status": user["status"],
                "created_at": user.get("created_at")
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"获取用户信息失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/statistics/{user_id}")
async def get_user_statistics(user_id: str):
    """获取用户统计"""
    try:
        db = await get_database()

        # 获取报名数
        apply_count = await db["user_apply"].count_documents({"user_id": user_id})

        # 获取签到数
        sign_count = await db["sign_records"].count_documents({"user_id": user_id})

        # 计算签到率
        sign_rate = 0
        if apply_count > 0:
            sign_rate = round(sign_count / apply_count * 100, 2)

        return {
            "code": 200,
            "data": {
                "apply_count": apply_count,
                "sign_count": sign_count,
                "sign_rate": f"{sign_rate}%"
            }
        }

    except Exception as e:
        logger.error(f"获取用户统计失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))