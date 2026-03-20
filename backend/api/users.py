"""
用户管理接口
"""
from fastapi import APIRouter, HTTPException, Depends, Request
from fastapi.responses import Response
from datetime import datetime
import logging
import uuid
from typing import Optional, List

from utils.database import get_database
from utils.auth import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_user,
    require_admin,
    TokenData
)
from utils.captcha import create_captcha, verify_captcha
from utils.log_utils import log_operation, log_login
from models.user import UserRegister, UserLogin
from pydantic import BaseModel

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/captcha")
async def get_captcha():
    """获取验证码"""
    import base64
    captcha_id = str(uuid.uuid4())
    code, image_bytes = create_captcha(captcha_id)
    
    logger.debug(f"生成验证码: {captcha_id} -> {code}")
    
    image_base64 = base64.b64encode(image_bytes).decode('utf-8')
    
    return {
        "code": 200,
        "data": {
            "captcha_id": captcha_id,
            "captcha_image": f"data:image/png;base64,{image_base64}"
        }
    }


@router.get("/captcha/image/{captcha_id}")
async def get_captcha_image(captcha_id: str):
    """获取验证码图片（直接返回图片）"""
    code, image_bytes = create_captcha(captcha_id)
    
    return Response(
        content=image_bytes,
        media_type="image/png",
        headers={"Cache-Control": "no-cache, no-store, must-revalidate"}
    )


class UserCreate(BaseModel):
    """管理员创建用户"""
    user_id: str
    username: str
    password: str
    real_name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    role: str = "student"


class UserUpdate(BaseModel):
    """管理员更新用户"""
    username: Optional[str] = None
    real_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    role: Optional[str] = None
    status: Optional[str] = None
    password: Optional[str] = None


@router.post("/register")
async def register(user: UserRegister):
    """用户注册"""
    try:
        db = await get_database()
        users = db["users"]

        existing = await users.find_one({
            "$or": [
                {"user_id": user.user_id},
                {"username": user.username}
            ]
        })

        if existing:
            raise HTTPException(status_code=400, detail="用户ID或用户名已存在")

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

        if "confirmPassword" in user_data:
            del user_data["confirmPassword"]

        await users.insert_one(user_data)

        token = create_access_token(user.user_id, user.role or "student")

        logger.info(f"用户注册成功: {user.user_id}")

        return {
            "code": 200,
            "msg": "注册成功",
            "data": {
                "user_info": {
                    "user_id": user.user_id,
                    "username": user.username,
                    "real_name": user.real_name,
                    "email": user.email,
                    "phone": user.phone,
                    "role": user.role or "student"
                },
                "token": token
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"注册失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/login")
async def login(login_data: UserLogin, request: Request):
    """用户登录"""
    source = "webadmin" if login_data.captcha_id else "miniprogram"
    ip_address = request.client.host if request.client else None
    
    try:
        # 验证验证码
        if login_data.captcha_id and login_data.captcha_code:
            if not verify_captcha(login_data.captcha_id, login_data.captcha_code):
                raise HTTPException(status_code=400, detail="验证码错误或已过期")

        db = await get_database()
        users = db["users"]

        user = await users.find_one({
            "$or": [
                {"username": login_data.identifier},
                {"user_id": login_data.identifier}
            ]
        })

        if not user:
            await log_login(
                user_id=login_data.identifier,
                user_name=login_data.identifier,
                source=source,
                ip_address=ip_address,
                status="failed",
                fail_reason="用户不存在"
            )
            raise HTTPException(status_code=401, detail="用户不存在")

        if user["status"] != "active":
            await log_login(
                user_id=user["user_id"],
                user_name=user["username"],
                source=source,
                ip_address=ip_address,
                status="failed",
                fail_reason="账号已被禁用"
            )
            raise HTTPException(status_code=401, detail="账号已被禁用")

        if not verify_password(login_data.password, user["password"]):
            await log_login(
                user_id=user["user_id"],
                user_name=user["username"],
                source=source,
                ip_address=ip_address,
                status="failed",
                fail_reason="密码错误"
            )
            raise HTTPException(status_code=401, detail="密码错误")

        await users.update_one(
            {"_id": user["_id"]},
            {"$set": {"last_login": datetime.now().isoformat()}}
        )

        # 记录登录成功日志
        await log_login(
            user_id=user["user_id"],
            user_name=user["username"],
            source=source,
            ip_address=ip_address,
            status="success"
        )

        # 记录操作日志
        await log_operation(
            log_type="login",
            user_id=user["user_id"],
            user_name=user["username"],
            action="login",
            detail=f"用户登录 ({source})",
            ip_address=ip_address,
            source=source
        )

        token = create_access_token(user["user_id"], user.get("role", "student"))

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
                    "role": user.get("role", "student")
                },
                "token": token
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"登录失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/info/{user_id}")
async def get_user_info(user_id: str, current_user: TokenData = Depends(get_current_user)):
    """获取用户信息（需登录）"""
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
                "created_at": user.get("created_at"),
                "last_login": user.get("last_login")
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"获取用户信息失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/statistics/{user_id}")
async def get_user_statistics(user_id: str, current_user: TokenData = Depends(get_current_user)):
    """获取用户统计（需登录）"""
    try:
        db = await get_database()

        apply_count = await db["user_apply"].count_documents({"user_id": user_id})
        sign_count = await db["sign_records"].count_documents({"user_id": user_id})

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


@router.get("/me")
async def get_current_user_info(current_user: TokenData = Depends(get_current_user)):
    """获取当前登录用户信息"""
    try:
        db = await get_database()
        user = await db["users"].find_one({"user_id": current_user.user_id})

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
                "status": user["status"]
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"获取当前用户信息失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/list")
async def get_users_list(
    skip: int = 0,
    limit: int = 50,
    search: Optional[str] = None,
    role: Optional[str] = None,
    current_user: TokenData = Depends(require_admin)
):
    """获取用户列表（管理员权限）"""
    try:
        db = await get_database()
        users_col = db["users"]

        query = {}
        if search:
            query["$or"] = [
                {"user_id": {"$regex": search, "$options": "i"}},
                {"username": {"$regex": search, "$options": "i"}},
                {"real_name": {"$regex": search, "$options": "i"}}
            ]
        if role:
            query["role"] = role

        total = await users_col.count_documents(query)

        cursor = users_col.find(query, {"password": 0}).sort("created_at", -1).skip(skip).limit(limit)
        users = await cursor.to_list(length=limit)

        result = []
        for u in users:
            result.append({
                "user_id": u.get("user_id"),
                "username": u.get("username"),
                "real_name": u.get("real_name", ""),
                "email": u.get("email", ""),
                "phone": u.get("phone", ""),
                "role": u.get("role", "student"),
                "status": u.get("status", "active"),
                "created_at": u.get("created_at", ""),
                "last_login": u.get("last_login", "")
            })

        return {"code": 200, "data": result, "total": total}

    except Exception as e:
        logger.error(f"获取用户列表失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/create")
async def admin_create_user(user: UserCreate, current_user: TokenData = Depends(require_admin)):
    """管理员创建用户"""
    try:
        db = await get_database()
        users_col = db["users"]

        existing = await users_col.find_one({
            "$or": [
                {"user_id": user.user_id},
                {"username": user.username}
            ]
        })

        if existing:
            raise HTTPException(status_code=400, detail="用户ID或用户名已存在")

        user_data = {
            "user_id": user.user_id,
            "username": user.username,
            "password": hash_password(user.password),
            "real_name": user.real_name,
            "email": user.email or "",
            "phone": user.phone or "",
            "role": user.role,
            "status": "active",
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat(),
            "apply_count": 0,
            "sign_count": 0
        }

        await users_col.insert_one(user_data)
        logger.info(f"管理员创建用户: {user.user_id}")

        await log_operation(
            log_type="operation",
            user_id=current_user.user_id,
            user_name=current_user.user_id,
            action="create",
            target_type="user",
            target_id=user.user_id,
            target_name=user.real_name,
            detail=f"创建用户: {user.username} ({user.real_name})",
            source="webadmin"
        )

        return {"code": 200, "msg": "创建成功", "data": {"user_id": user.user_id}}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"创建用户失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/update/{user_id}")
async def admin_update_user(user_id: str, user: UserUpdate, current_user: TokenData = Depends(require_admin)):
    """管理员更新用户"""
    try:
        db = await get_database()
        users_col = db["users"]

        existing = await users_col.find_one({"user_id": user_id})
        if not existing:
            raise HTTPException(status_code=404, detail="用户不存在")

        update_data = user.dict(exclude_unset=True)
        
        if "password" in update_data and update_data["password"]:
            update_data["password"] = hash_password(update_data["password"])
        
        update_data["updated_at"] = datetime.now().isoformat()

        if update_data:
            await users_col.update_one(
                {"user_id": user_id},
                {"$set": update_data}
            )

        logger.info(f"管理员更新用户: {user_id}")

        await log_operation(
            log_type="operation",
            user_id=current_user.user_id,
            user_name=current_user.user_id,
            action="update",
            target_type="user",
            target_id=user_id,
            target_name=existing.get("real_name", user_id),
            detail=f"更新用户: {existing.get('username')}",
            source="webadmin"
        )

        return {"code": 200, "msg": "更新成功"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"更新用户失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/delete/{user_id}")
async def admin_delete_user(user_id: str, current_user: TokenData = Depends(require_admin)):
    """管理员删除用户"""
    try:
        if user_id == current_user.user_id:
            raise HTTPException(status_code=400, detail="不能删除自己的账号")

        db = await get_database()
        users_col = db["users"]

        result = await users_col.delete_one({"user_id": user_id})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="用户不存在")

        logger.info(f"管理员删除用户: {user_id}")

        await log_operation(
            log_type="operation",
            user_id=current_user.user_id,
            user_name=current_user.user_id,
            action="delete",
            target_type="user",
            target_id=user_id,
            target_name=user_id,
            detail=f"删除用户: {user_id}",
            source="webadmin"
        )

        return {"code": 200, "msg": "删除成功"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"删除用户失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/toggle-status/{user_id}")
async def toggle_user_status(user_id: str, current_user: TokenData = Depends(require_admin)):
    """切换用户状态（启用/禁用）"""
    try:
        if user_id == current_user.user_id:
            raise HTTPException(status_code=400, detail="不能禁用自己的账号")

        db = await get_database()
        users_col = db["users"]

        user = await users_col.find_one({"user_id": user_id})
        if not user:
            raise HTTPException(status_code=404, detail="用户不存在")

        new_status = "inactive" if user.get("status") == "active" else "active"
        
        await users_col.update_one(
            {"user_id": user_id},
            {"$set": {"status": new_status, "updated_at": datetime.now().isoformat()}}
        )

        logger.info(f"管理员切换用户状态: {user_id} -> {new_status}")

        await log_operation(
            log_type="operation",
            user_id=current_user.user_id,
            user_name=current_user.user_id,
            action="update",
            target_type="user",
            target_id=user_id,
            target_name=user.get("real_name", user_id),
            detail=f"{'启用' if new_status == 'active' else '禁用'}用户: {user.get('username')}",
            source="webadmin"
        )

        return {"code": 200, "msg": "状态已更新", "data": {"status": new_status}}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"切换用户状态失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))