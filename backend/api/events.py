"""
活动管理接口
"""
from fastapi import APIRouter, HTTPException
from typing import Optional
from datetime import datetime
import logging

from utils.database import get_database
from utils.mqtt_client import publish_message, is_mqtt_connected
from models.event import EventCreate, EventUpdate

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/create")
async def create_event(event: EventCreate):
    """
    创建新活动
    """
    try:
        db = await get_database()
        events = db["events"]

        # 检查活动ID是否已存在
        existing = await events.find_one({"event_id": event.event_id})
        if existing:
            raise HTTPException(status_code=400, detail="活动ID已存在")

        # 准备活动数据
        event_data = event.dict()
        event_data.update({
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat(),
            "status": "active",
            "apply_count": 0,
            "sign_count": 0,
            "is_deleted": False
        })

        # 插入数据库
        await events.insert_one(event_data)

        # 发送MQTT通知（同步调用，不加await）
        try:
            if is_mqtt_connected():
                publish_message(
                    topic=f"event/{event.event_id}/notice",
                    payload={
                        "type": "event_create",
                        "event_id": event.event_id,
                        "title": event.title,
                        "time": event.time,
                        "location": event.location,
                        "timestamp": datetime.now().isoformat()
                    }
                )
                logger.info(f"📨 MQTT通知已发送: event/{event.event_id}/notice")
            else:
                logger.warning("⚠️ MQTT未连接，跳过通知发送")
        except Exception as mqtt_error:
            # MQTT错误不影响主流程，只记录日志
            logger.warning(f"⚠️ MQTT通知发送失败: {mqtt_error}")

        logger.info(f"✅ 活动创建成功: {event.event_id} - {event.title}")

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
        search: Optional[str] = None
):
    """
    获取活动列表
    """
    try:
        db = await get_database()
        events = db["events"]

        # 构建查询条件
        query = {"is_deleted": {"$ne": True}}
        if status:
            query["status"] = status
        if search:
            query["$or"] = [
                {"title": {"$regex": search, "$options": "i"}},
                {"location": {"$regex": search, "$options": "i"}}
            ]

        # 查询总数
        total = await events.count_documents(query)

        # 查询数据
        cursor = events.find(query).sort("time", 1).skip(skip).limit(limit)
        items = await cursor.to_list(length=limit)

        # 格式化返回
        result = []
        for item in items:
            sign_rate = 0
            if item.get("apply_count", 0) > 0:
                sign_rate = round(item["sign_count"] / item["apply_count"] * 100, 2)

            result.append({
                "event_id": item["event_id"],
                "title": item["title"],
                "time": item["time"],
                "location": item["location"],
                "status": item["status"],
                "apply_count": item["apply_count"],
                "sign_count": item["sign_count"],
                "sign_rate": f"{sign_rate}%",
                "organizer": item.get("organizer", ""),
                "description": item.get("description", "")
            })

        return {
            "code": 200,
            "data": result,
            "total": total
        }

    except Exception as e:
        logger.error(f"❌ 获取活动列表失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/detail/{event_id}")
async def get_event_detail(event_id: str):
    """
    获取活动详情
    """
    try:
        db = await get_database()
        event = await db["events"].find_one({"event_id": event_id})

        if not event or event.get("is_deleted"):
            raise HTTPException(status_code=404, detail="活动不存在")

        sign_rate = 0
        if event.get("apply_count", 0) > 0:
            sign_rate = round(event["sign_count"] / event["apply_count"] * 100, 2)

        return {
            "code": 200,
            "data": {
                "event_id": event["event_id"],
                "title": event["title"],
                "time": event["time"],
                "location": event["location"],
                "status": event["status"],
                "apply_count": event["apply_count"],
                "sign_count": event["sign_count"],
                "sign_rate": f"{sign_rate}%",
                "organizer": event.get("organizer", ""),
                "description": event.get("description", ""),
                "limit_num": event.get("limit_num"),
                "created_at": event.get("created_at")
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ 获取活动详情失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/update/{event_id}")
async def update_event(event_id: str, event_update: EventUpdate):
    """
    更新活动信息
    """
    try:
        db = await get_database()
        events = db["events"]

        # 检查活动是否存在
        event = await events.find_one({"event_id": event_id})
        if not event:
            raise HTTPException(status_code=404, detail="活动不存在")

        # 更新数据
        update_data = event_update.dict(exclude_unset=True)
        if update_data:
            update_data["updated_at"] = datetime.now().isoformat()

            result = await events.update_one(
                {"event_id": event_id},
                {"$set": update_data}
            )

            if result.modified_count > 0:
                logger.info(f"✅ 活动更新成功: {event_id}")

                # 发送MQTT通知
                try:
                    if is_mqtt_connected():
                        publish_message(
                            topic=f"event/{event_id}/notice",
                            payload={
                                "type": "event_update",
                                "event_id": event_id,
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


@router.delete("/delete/{event_id}")
async def delete_event(event_id: str):
    """
    删除活动（软删除）
    """
    try:
        db = await get_database()
        events = db["events"]

        # 软删除：标记为已删除
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

        # 发送MQTT通知
        try:
            if is_mqtt_connected():
                publish_message(
                    topic=f"event/{event_id}/notice",
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
async def get_event_statistics(event_id: str):
    """
    获取活动统计数据
    """
    try:
        db = await get_database()
        event = await db["events"].find_one({"event_id": event_id})

        if not event:
            raise HTTPException(status_code=404, detail="活动不存在")

        # 获取签到记录
        sign_records = await db["sign_records"].find(
            {"event_id": event_id}
        ).to_list(None)

        # 统计签到时间分布
        time_distribution = {}
        for record in sign_records:
            sign_time = record.get("sign_time")
            if sign_time:
                try:
                    hour = datetime.fromisoformat(sign_time.replace('Z', '+00:00')).hour
                    time_distribution[hour] = time_distribution.get(hour, 0) + 1
                except:
                    pass

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