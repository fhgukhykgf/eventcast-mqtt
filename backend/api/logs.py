"""
日志管理接口
"""
from fastapi import APIRouter, HTTPException, Depends, Query
from typing import Optional
import logging

from utils.auth import get_current_user, TokenData, require_admin
from utils.log_utils import get_operation_logs, get_login_logs

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/operation")
async def list_operation_logs(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    log_type: Optional[str] = None,
    user_id: Optional[str] = None,
    action: Optional[str] = None,
    target_type: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    current_user: TokenData = Depends(require_admin)
):
    """
    获取操作日志列表（仅管理员）
    """
    try:
        logs, total = await get_operation_logs(
            skip=skip,
            limit=limit,
            log_type=log_type,
            user_id=user_id,
            action=action,
            target_type=target_type,
            start_date=start_date,
            end_date=end_date
        )
        
        # 转换 _id 为字符串
        for log in logs:
            log["_id"] = str(log.get("_id", ""))
        
        return {
            "code": 200,
            "data": logs,
            "total": total
        }
        
    except Exception as e:
        logger.error(f"获取操作日志失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/login")
async def list_login_logs(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    user_id: Optional[str] = None,
    source: Optional[str] = None,
    status: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    current_user: TokenData = Depends(require_admin)
):
    """
    获取登录日志列表（仅管理员）
    """
    try:
        logs, total = await get_login_logs(
            skip=skip,
            limit=limit,
            user_id=user_id,
            source=source,
            status=status,
            start_date=start_date,
            end_date=end_date
        )
        
        # 转换 _id 为字符串
        for log in logs:
            log["_id"] = str(log.get("_id", ""))
        
        return {
            "code": 200,
            "data": logs,
            "total": total
        }
        
    except Exception as e:
        logger.error(f"获取登录日志失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))