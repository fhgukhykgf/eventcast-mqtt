"""
活动管理接口
"""
from fastapi import APIRouter, HTTPException, Depends
from typing import Optional, Dict, Any
from datetime import datetime
import logging

from utils.database import get_database
from utils.mqtt_client import publish_message, is_mqtt_connected
from utils.auth import get_current_user, require_organizer, TokenData, get_current_user_optional
from utils.log_utils import log_operation
from models.event import EventCreate, EventUpdate
import re as regex_module

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/create")
async def create_event(event: EventCreate, current_user: TokenData = Depends(require_organizer)):
    """
    创建新活动（需组织者或管理员权限）
    """
    try:
        db = await get_database()
        events = db["events"]

        existing = await events.find_one({"event_id": event.event_id})
        if existing:
            raise HTTPException(status_code=400, detail="活动ID已存在")

        event_data = event.dict()
        if not event_data.get('time'):
            event_data['time'] = event_data['start_time']
        event_data.update({
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat(),
            "status": "active",
            "apply_count": 0,
            "sign_count": 0,
            "is_deleted": False,
            "created_by": current_user.user_id
        })

        await events.insert_one(event_data)

        try:
            if is_mqtt_connected():
                # 发布到活动专属 topic
                publish_message(
                    topic=f"event/{event.event_id}/notice",
                    payload={
                        "type": "event_create",
                        "event_id": event.event_id,
                        "title": event.title,
                        "time": event_data['time'],
                        "start_time": event_data.get('start_time'),
                        "end_time": event_data.get('end_time'),
                        "location": event.location,
                        "timestamp": datetime.now().isoformat()
                    }
                )
                # 同时发布到系统广播，让所有用户收到新活动通知
                publish_message(
                    topic="system/broadcast",
                    payload={
                        "type": "event_create",
                        "event_id": event.event_id,
                        "title": event.title,
                        "time": event_data['time'],
                        "start_time": event_data.get('start_time'),
                        "end_time": event_data.get('end_time'),
                        "location": event.location,
                        "timestamp": datetime.now().isoformat()
                    }
                )
                logger.info(f"📨 MQTT通知已发送: event/{event.event_id}/notice 和 system/broadcast")
            else:
                logger.warning("⚠️ MQTT未连接，跳过通知发送")
        except Exception as mqtt_error:
            logger.warning(f"⚠️ MQTT通知发送失败: {mqtt_error}")

        logger.info(f"✅ 活动创建成功: {event.event_id} - {event.title}")

        await log_operation(
            log_type="operation",
            user_id=current_user.user_id,
            user_name=current_user.user_id,
            action="create",
            target_type="event",
            target_id=event.event_id,
            target_name=event.title,
            detail=f"创建活动: {event.title}",
            source="webadmin"
        )

        return {
            "code": 200,
            "msg": "活动创建成功",
            "event_id": event.event_id
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ 创建活动失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/list")
async def get_events(
        status: Optional[str] = None,
        skip: int = 0,
        limit: int = 20,
        search: Optional[str] = None,
        current_user: Optional[TokenData] = Depends(get_current_user_optional)
):
    """
    获取活动列表（公开接口）
    学生不显示签到数据，组织者/管理员显示完整数据
    """
    try:
        db = await get_database()
        events = db["events"]

        query: Dict[str, Any] = {"is_deleted": {"$ne": True}}
        if status:
            query["status"] = status
        if search:
            # 安全：转义正则特殊字符防止 ReDoS，并限制搜索长度
            safe_search = regex_module.escape(search[:50])
            query["$or"] = [
                {"title": {"$regex": safe_search, "$options": "i"}},
                {"location": {"$regex": safe_search, "$options": "i"}}
            ]

        total = await events.count_documents(query)

        cursor = events.find(query).sort("time", 1).skip(skip).limit(limit)
        items = await cursor.to_list(length=limit)

        # 判断是否为组织者或管理员
        is_organizer = False
        if current_user and current_user.role in ['organizer', 'admin']:
            is_organizer = True

        result = []
        for item in items:
            event_data = {
                "event_id": item["event_id"],
                "title": item["title"],
                "time": item["time"],
                "start_time": item.get("start_time", item["time"]),
                "end_time": item.get("end_time", item["time"]),
                "location": item["location"],
                "status": item["status"],
                "organizer": item.get("organizer", ""),
                "description": item.get("description", "")
            }
            
            # 只有组织者/管理员能看到签到数据
            if is_organizer:
                sign_rate = 0
                if item.get("apply_count", 0) > 0:
                    sign_rate = round(item["sign_count"] / item["apply_count"] * 100, 2)
                event_data["apply_count"] = item["apply_count"]
                event_data["sign_count"] = item["sign_count"]
                event_data["sign_rate"] = f"{sign_rate}%"

            result.append(event_data)

        return {
            "code": 200,
            "data": result,
            "total": total
        }

    except Exception as e:
        logger.error(f"❌ 获取活动列表失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/stats")
async def get_events_stats(current_user: TokenData = Depends(require_organizer)):
    """
    获取所有活动的报名和签到统计（从数据库实际统计）
    """
    try:
        db = await get_database()
        events_col = db["events"]
        applies_col = db["user_apply"]
        signs_col = db["sign_records"]

        # 获取所有活动
        events = await events_col.find({"is_deleted": {"$ne": True}}).to_list(length=None)
        
        # 一次性统计所有活动的报名数
        apply_stats_cursor = applies_col.aggregate([
            {"$group": {"_id": "$event_id", "count": {"$sum": 1}}}
        ])
        apply_stats_list = await apply_stats_cursor.to_list(length=None)
        apply_stats_map = {s["_id"]: s["count"] for s in apply_stats_list}

        # 一次性统计所有活动的签到数
        sign_stats_cursor = signs_col.aggregate([
            {"$group": {"_id": "$event_id", "count": {"$sum": 1}}}
        ])
        sign_stats_list = await sign_stats_cursor.to_list(length=None)
        sign_stats_map = {s["_id"]: s["count"] for s in sign_stats_list}
        
        stats = {}
        for event in events:
            event_id = event["event_id"]
            stats[event_id] = {
                "apply_count": apply_stats_map.get(event_id, 0),
                "sign_count": sign_stats_map.get(event_id, 0)
            }
        
        logger.info(f"📊 统计了 {len(stats)} 个活动的报名签到数据")
        
        return {
            "code": 200,
            "data": stats
        }

    except Exception as e:
        logger.error(f"❌ 获取统计数据失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/detail/{event_id}")
async def get_event_detail(
    event_id: str,
    current_user: Optional[TokenData] = Depends(get_current_user_optional)
):
    """
    获取活动详情（公开接口）
    学生不显示签到数据，组织者/管理员显示完整数据
    """
    try:
        db = await get_database()
        event = await db["events"].find_one({"event_id": event_id})

        if not event or event.get("is_deleted"):
            raise HTTPException(status_code=404, detail="活动不存在")

        # 判断是否为组织者或管理员
        is_organizer = False
        if current_user and current_user.role in ['organizer', 'admin']:
            is_organizer = True

        event_data = {
            "event_id": event["event_id"],
            "title": event["title"],
            "time": event["time"],
            "start_time": event.get("start_time", event["time"]),
            "end_time": event.get("end_time", event["time"]),
            "location": event["location"],
            "status": event["status"],
            "organizer": event.get("organizer", ""),
            "description": event.get("description", ""),
            "limit_num": event.get("limit_num"),
            "created_at": event.get("created_at"),
            "created_by": event.get("created_by"),
            "updated_at": event.get("updated_at"),
            "updated_by": event.get("updated_by")
        }

        # 只有组织者/管理员能看到签到数据
        if is_organizer:
            sign_rate = 0
            if event.get("apply_count", 0) > 0:
                sign_rate = round(event["sign_count"] / event["apply_count"] * 100, 2)
            event_data["apply_count"] = event["apply_count"]
            event_data["sign_count"] = event["sign_count"]
            event_data["sign_rate"] = f"{sign_rate}%"

        return {
            "code": 200,
            "data": event_data
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ 获取活动详情失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/update/{event_id}")
async def update_event(event_id: str, event_update: EventUpdate, current_user: TokenData = Depends(require_organizer)):
    """
    更新活动信息（需组织者或管理员权限）
    """
    try:
        db = await get_database()
        events = db["events"]

        event = await events.find_one({"event_id": event_id, "is_deleted": {"$ne": True}})
        if not event:
            raise HTTPException(status_code=404, detail="活动不存在")

        update_data = event_update.dict(exclude_unset=True)
        # 安全：过滤掉不应被客户端修改的字段
        for protected_field in ["is_deleted", "apply_count", "sign_count", "created_at", "created_by"]:
            update_data.pop(protected_field, None)
        if update_data:
            update_data["updated_at"] = datetime.now().isoformat()
            update_data["updated_by"] = current_user.user_id

            result = await events.update_one(
                {"event_id": event_id},
                {"$set": update_data}
            )

            if result.modified_count > 0:
                logger.info(f"✅ 活动更新成功: {event_id}")

                # 获取更新后的标题，如果未提供则使用旧标题
                updated_title = update_data.get("title", event.get("title"))

                # 记录操作日志
                await log_operation(
                    log_type="operation",
                    user_id=current_user.user_id or "unknown",
                    user_name=current_user.user_id or "unknown",
                    action="update",
                    target_type="event",
                    target_id=event_id,
                    target_name=updated_title,
                    detail=f"更新活动: {updated_title}",
                    source="webadmin"
                )

                try:
                    if is_mqtt_connected():
                        # 发布到活动专属 topic
                        publish_message(
                            topic=f"event/{event_id}/notice",
                            payload={
                                "type": "event_update",
                                "event_id": event_id,
                                "event_title": event.get("title"),
                                "timestamp": datetime.now().isoformat()
                            }
                        )
                        # 同时发布到系统广播
                        publish_message(
                            topic="system/broadcast",
                            payload={
                                "type": "event_update",
                                "event_id": event_id,
                                "event_title": event.get("title"),
                                "timestamp": datetime.now().isoformat()
                            }
                        )
                except Exception as mqtt_error:
                    logger.warning(f"⚠️ MQTT通知发送失败: {mqtt_error}")

        return {"code": 200, "msg": "更新成功"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ 更新活动失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/cancel/{event_id}")
async def cancel_event(event_id: str, current_user: TokenData = Depends(require_organizer)):
    """
    取消活动（需组织者或管理员权限）
    """
    try:
        db = await get_database()
        events = db["events"]

        event = await events.find_one({"event_id": event_id})
        if not event:
            raise HTTPException(status_code=404, detail="活动不存在")

        if event.get("status") == "cancelled":
            raise HTTPException(status_code=400, detail="活动已取消")

        result = await events.update_one(
            {"event_id": event_id},
            {"$set": {
                "status": "cancelled",
                "updated_at": datetime.now().isoformat()
            }}
        )

        if result.modified_count == 0:
            raise HTTPException(status_code=500, detail="取消失败")

        logger.info(f"✅ 活动取消成功: {event_id}")

        # 记录操作日志
        await log_operation(
            log_type="operation",
            user_id=current_user.user_id,
            user_name=current_user.user_id,
            action="cancel",
            target_type="event",
            target_id=event_id,
            target_name=event.get("title"),
            detail=f"取消活动: {event.get('title')}",
            source="webadmin"
        )

        try:
            if is_mqtt_connected():
                # 发布到活动专属 topic
                publish_message(
                    topic=f"event/{event_id}/notice",
                    payload={
                        "type": "event_cancel",
                        "event_id": event_id,
                        "event_title": event.get("title"),
                        "timestamp": datetime.now().isoformat()
                    }
                )
                # 同时发布到系统广播
                publish_message(
                    topic="system/broadcast",
                    payload={
                        "type": "event_cancel",
                        "event_id": event_id,
                        "event_title": event.get("title"),
                        "timestamp": datetime.now().isoformat()
                    }
                )
        except Exception as mqtt_error:
            logger.warning(f"⚠️ MQTT通知发送失败: {mqtt_error}")

        return {"code": 200, "msg": "活动已取消"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ 取消活动失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/delete/{event_id}")
async def delete_event(event_id: str, current_user: TokenData = Depends(require_organizer)):
    """
    删除活动（需组织者或管理员权限，软删除）
    """
    try:
        db = await get_database()
        events = db["events"]

        # 先获取活动信息用于日志，并检查是否已删除
        event = await events.find_one({"event_id": event_id, "is_deleted": {"$ne": True}})
        if not event:
            raise HTTPException(status_code=404, detail="活动不存在或已删除")
        event_title = event.get("title", event_id)

        result = await events.update_one(
            {"event_id": event_id},
            {"$set": {
                "is_deleted": True,
                "status": "ended",
                "updated_at": datetime.now().isoformat()
            }}
        )

        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="活动不存在")

        logger.info(f"✅ 活动删除成功: {event_id}")

        # 记录操作日志
        await log_operation(
            log_type="operation",
            user_id=current_user.user_id,
            user_name=current_user.user_id,
            action="delete",
            target_type="event",
            target_id=event_id,
            target_name=event_title,
            detail=f"删除活动: {event_title}",
            source="webadmin"
        )

        try:
            if is_mqtt_connected():
                # 发布到活动专属 topic
                publish_message(
                    topic=f"event/{event_id}/notice",
                    payload={
                        "type": "event_delete",
                        "event_id": event_id,
                        "timestamp": datetime.now().isoformat()
                    }
                )
                # 同时发布到系统广播
                publish_message(
                    topic="system/broadcast",
                    payload={
                        "type": "event_delete",
                        "event_id": event_id,
                        "timestamp": datetime.now().isoformat()
                    }
                )
        except Exception as mqtt_error:
            logger.warning(f"⚠️ MQTT通知发送失败: {mqtt_error}")

        return {"code": 200, "msg": "删除成功"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ 删除活动失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/statistics/{event_id}")
async def get_event_statistics(event_id: str, current_user: TokenData = Depends(get_current_user)):
    """
    获取活动统计数据（需登录）
    """
    try:
        db = await get_database()
        event = await db["events"].find_one({"event_id": event_id})

        if not event:
            raise HTTPException(status_code=404, detail="活动不存在")

        sign_records = await db["sign_records"].find(
            {"event_id": event_id}
        ).to_list(None)

        time_distribution = {}
        for record in sign_records:
            sign_time = record.get("sign_time")
            if sign_time:
                try:
                    hour = datetime.fromisoformat(sign_time.replace('Z', '+00:00')).hour
                    time_distribution[hour] = time_distribution.get(hour, 0) + 1
                except (ValueError, TypeError) as e:
                    logger.debug(f"解析签到时间失败: {sign_time}, 错误: {e}")

        sign_rate = 0
        if event.get("apply_count", 0) > 0:
            sign_rate = round(event["sign_count"] / event["apply_count"] * 100, 2)

        return {
            "code": 200,
            "data": {
                "event_id": event_id,
                "title": event.get("title"),
                "apply_count": event.get("apply_count", 0),
                "sign_count": event.get("sign_count", 0),
                "sign_rate": f"{sign_rate}%",
                "time_distribution": time_distribution,
                "sign_records_count": len(sign_records)
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ 获取活动统计失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))