"""
日志记录工具
"""
from datetime import datetime
from typing import Optional
from utils.database import get_database
import logging

logger = logging.getLogger(__name__)


async def log_operation(
    log_type: str,
    user_id: Optional[str],
    user_name: Optional[str],
    action: str,
    target_type: Optional[str] = None,
    target_id: Optional[str] = None,
    target_name: Optional[str] = None,
    detail: Optional[str] = None,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None,
    source: str = "webadmin"
):
    """
    记录操作日志
    
    Args:
        log_type: 日志类型 (operation/login)
        user_id: 操作用户ID
        user_name: 操作用户名
        action: 操作类型 (create/update/delete/cancel/login/logout)
        target_type: 目标类型
        target_id: 目标ID (event_id/user_id)
        target_name: 目标名称
        detail: 操作详情
        ip_address: IP地址
        user_agent: 用户代理
        source: 来源
    """
    try:
        db = await get_database()
        logs_col = db["operation_logs"]
        
        log_data = {
            "log_type": log_type,
            "user_id": user_id,
            "user_name": user_name,
            "action": action,
            "target_type": target_type,
            "target_id": target_id,
            "target_name": target_name,
            "detail": detail,
            "ip_address": ip_address,
            "user_agent": user_agent,
            "source": source,
            "created_at": datetime.now().isoformat()
        }
        
        await logs_col.insert_one(log_data)
        logger.info(f"📝 操作日志: {user_name} {action} {target_type or ''} {target_id or ''}")
        
    except Exception as e:
        logger.error(f"记录操作日志失败: {e}")


async def log_login(
    user_id: str,
    user_name: str,
    source: str = "miniprogram",
    ip_address: Optional[str] = None,
    device: Optional[str] = None,
    status: str = "success",
    fail_reason: Optional[str] = None
):
    """
    记录登录日志
    
    Args:
        user_id: 用户ID
        user_name: 用户名
        source: 登录来源
        ip_address: IP地址
        device: 设备信息
        status: 登录状态
        fail_reason: 失败原因
    """
    try:
        db = await get_database()
        logs_col = db["login_logs"]
        
        log_data = {
            "user_id": user_id,
            "user_name": user_name,
            "login_time": datetime.now().isoformat(),
            "ip_address": ip_address,
            "device": device,
            "source": source,
            "status": status,
            "fail_reason": fail_reason
        }
        
        await logs_col.insert_one(log_data)
        logger.info(f"🔑 登录日志: {user_name} from {source} - {status}")
        
    except Exception as e:
        logger.error(f"记录登录日志失败: {e}")


async def get_operation_logs(
    skip: int = 0,
    limit: int = 50,
    log_type: Optional[str] = None,
    user_id: Optional[str] = None,
    action: Optional[str] = None,
    target_type: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None
):
    """获取操作日志列表"""
    try:
        db = await get_database()
        logs_col = db["operation_logs"]
        
        query = {}
        if log_type:
            query["log_type"] = log_type
        if user_id:
            query["user_id"] = user_id
        if action:
            query["action"] = action
        if target_type:
            query["target_type"] = target_type
        if start_date or end_date:
            query["created_at"] = {}
            if start_date:
                query["created_at"]["$gte"] = start_date
            if end_date:
                query["created_at"]["$lte"] = end_date
        
        total = await logs_col.count_documents(query)
        logs = await logs_col.find(query).sort("created_at", -1).skip(skip).limit(limit).to_list(length=limit)
        
        return logs, total
        
    except Exception as e:
        logger.error(f"获取操作日志失败: {e}")
        return [], 0


async def get_login_logs(
    skip: int = 0,
    limit: int = 50,
    user_id: Optional[str] = None,
    source: Optional[str] = None,
    status: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None
):
    """获取登录日志列表"""
    try:
        db = await get_database()
        logs_col = db["login_logs"]
        
        query = {}
        if user_id:
            query["user_id"] = user_id
        if source:
            query["source"] = source
        if status:
            query["status"] = status
        if start_date or end_date:
            query["login_time"] = {}
            if start_date:
                query["login_time"]["$gte"] = start_date
            if end_date:
                query["login_time"]["$lte"] = end_date
        
        total = await logs_col.count_documents(query)
        logs = await logs_col.find(query).sort("login_time", -1).skip(skip).limit(limit).to_list(length=limit)
        
        return logs, total
        
    except Exception as e:
        logger.error(f"获取登录日志失败: {e}")
        return [], 0