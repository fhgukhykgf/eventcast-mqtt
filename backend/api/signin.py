"""
签到管理接口
"""
from fastapi import APIRouter, HTTPException
from datetime import datetime
import logging
from utils.database import get_database
from utils.mqtt_client import publish_message, is_mqtt_connected
from models.signin import ApplyRequest, SignInRequest

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/apply")
async def apply_event(apply_data: ApplyRequest):
    """报名活动"""
    try:
        db = await get_database()
        events = db["events"]
        applies = db["user_apply"]

        # 检查活动
        event = await events.find_one({"event_id": apply_data.event_id})
        if not event:
            raise HTTPException(status_code=404, detail="活动不存在")

        if event["status"] != "active":
            raise HTTPException(status_code=400, detail="活动已结束")

        # 检查是否已报名
        existing = await applies.find_one({
            "event_id": apply_data.event_id,
            "user_id": apply_data.user_id
        })
        if existing:
            raise HTTPException(status_code=400, detail="已报名")

        # 检查人数限制
        if event.get("limit_num") and event["apply_count"] >= event["limit_num"]:
            raise HTTPException(status_code=400, detail="报名人数已满")

        # 创建报名记录
        apply_record = {
            "event_id": apply_data.event_id,
            "user_id": apply_data.user_id,
            "user_name": apply_data.user_name,
            "apply_time": datetime.now().isoformat(),
            "status": "applied"
        }

        await applies.insert_one(apply_record)

        # 更新活动报名数
        await events.update_one(
            {"event_id": apply_data.event_id},
            {"$inc": {"apply_count": 1}}
        )

        # 发送MQTT通知
        try:
            if is_mqtt_connected():
                publish_message(f"event/{apply_data.event_id}/notice", {
                    "type": "apply_success",
                    "user_id": apply_data.user_id,
                    "user_name": apply_data.user_name,
                    "apply_time": apply_record["apply_time"]
                })
        except Exception as mqtt_error:
            logger.warning(f"MQTT通知发送失败: {mqtt_error}")

        logger.info(f"✅ 报名成功: {apply_data.user_id} -> {apply_data.event_id}")
        return {"code": 200, "msg": "报名成功"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ 报名失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/cancel")
async def cancel_apply(apply_data: ApplyRequest):
    """取消报名"""
    try:
        db = await get_database()
        events = db["events"]
        applies = db["user_apply"]

        # 删除报名记录
        result = await applies.delete_one({
            "event_id": apply_data.event_id,
            "user_id": apply_data.user_id
        })

        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="报名记录不存在")

        # 更新活动报名数
        await events.update_one(
            {"event_id": apply_data.event_id},
            {"$inc": {"apply_count": -1}}
        )

        logger.info(f"✅ 取消报名: {apply_data.user_id} -> {apply_data.event_id}")
        return {"code": 200, "msg": "取消成功"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ 取消失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/in")
async def sign_in(sign_data: SignInRequest):
    """签到"""
    try:
        db = await get_database()
        events = db["events"]
        applies = db["user_apply"]
        signs = db["sign_records"]

        # 检查活动
        event = await events.find_one({"event_id": sign_data.event_id})
        if not event:
            raise HTTPException(status_code=404, detail="活动不存在")

        # 检查是否报名
        apply = await applies.find_one({
            "event_id": sign_data.event_id,
            "user_id": sign_data.user_id
        })
        if not apply:
            raise HTTPException(status_code=400, detail="请先报名")

        # 检查是否已签到
        existing = await signs.find_one({
            "event_id": sign_data.event_id,
            "user_id": sign_data.user_id
        })
        if existing:
            raise HTTPException(status_code=400, detail="已签到")

        # 创建签到记录
        sign_record = {
            "event_id": sign_data.event_id,
            "user_id": sign_data.user_id,
            "user_name": sign_data.user_name,
            "sign_time": datetime.now().isoformat(),
            "sign_method": sign_data.sign_method or "scan"
        }

        await signs.insert_one(sign_record)

        # 更新活动签到数
        await events.update_one(
            {"event_id": sign_data.event_id},
            {"$inc": {"sign_count": 1}}
        )

        # 计算实时签到率
        sign_rate = 0
        if event["apply_count"] > 0:
            sign_rate = round((event["sign_count"] + 1) / event["apply_count"] * 100, 2)

        # 发送MQTT通知
        try:
            if is_mqtt_connected():
                publish_message(f"event/{sign_data.event_id}/sign_in", {
                    "type": "sign_in",
                    "user_id": sign_data.user_id,
                    "user_name": sign_data.user_name,
                    "sign_time": sign_record["sign_time"]
                })
        except Exception as mqtt_error:
            logger.warning(f"MQTT通知发送失败: {mqtt_error}")

        logger.info(f"✅ 签到成功: {sign_data.user_id} -> {sign_data.event_id}")
        return {
            "code": 200,
            "msg": "签到成功",
            "data": {
                "sign_time": sign_record["sign_time"],
                "sign_rate": f"{sign_rate}%"
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ 签到失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/status/{event_id}/{user_id}")
async def get_sign_status(event_id: str, user_id: str):
    """获取签到状态"""
    try:
        db = await get_database()

        # 检查报名
        apply = await db["user_apply"].find_one({
            "event_id": event_id,
            "user_id": user_id
        })

        # 检查签到
        sign = await db["sign_records"].find_one({
            "event_id": event_id,
            "user_id": user_id
        })

        return {
            "code": 200,
            "data": {
                "has_applied": apply is not None,
                "has_signed": sign is not None,
                "apply_time": apply.get("apply_time") if apply else None,
                "sign_time": sign.get("sign_time") if sign else None
            }
        }

    except Exception as e:
        logger.error(f"获取签到状态失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/records/{event_id}")
async def get_sign_records(event_id: str, skip: int = 0, limit: int = 50):
    """获取活动签到记录"""
    try:
        db = await get_database()

        total = await db["sign_records"].count_documents({"event_id": event_id})

        cursor = db["sign_records"].find(
            {"event_id": event_id}
        ).sort("sign_time", -1).skip(skip).limit(limit)

        records = await cursor.to_list(length=limit)

        result = []
        for r in records:
            result.append({
                "user_id": r["user_id"],
                "user_name": r["user_name"],
                "sign_time": r["sign_time"],
                "sign_method": r.get("sign_method", "scan")
            })

        return {"code": 200, "data": result, "total": total}

    except Exception as e:
        logger.error(f"获取签到记录失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/count/{event_id}")
async def get_sign_count(event_id: str):
    """获取签到计数"""
    try:
        db = await get_database()

        event = await db["events"].find_one({"event_id": event_id})
        if not event:
            raise HTTPException(status_code=404, detail="活动不存在")

        sign_rate = 0
        if event["apply_count"] > 0:
            sign_rate = round(event["sign_count"] / event["apply_count"] * 100, 2)

        return {
            "code": 200,
            "data": {
                "apply_count": event["apply_count"],
                "sign_count": event["sign_count"],
                "sign_rate": f"{sign_rate}%"
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"获取签到计数失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/user/{user_id}")
async def get_user_sign_records(user_id: str, skip: int = 0, limit: int = 20):
    """
    获取用户的活动记录（包括报名和签到）
    """
    try:
        db = await get_database()

        # 获取用户的报名记录
        applies = await db["user_apply"].find(
            {"user_id": user_id}
        ).sort("apply_time", -1).skip(skip).limit(limit).to_list(length=limit)

        # 获取用户的签到记录
        signs = await db["sign_records"].find(
            {"user_id": user_id}
        ).to_list(length=None)

        # 创建签到记录映射
        sign_map = {s["event_id"]: s for s in signs}

        # 获取活动详情
        result = []
        for apply in applies:
            event = await db["events"].find_one({"event_id": apply["event_id"]})
            if event:
                sign_record = sign_map.get(apply["event_id"])
                result.append({
                    "event_id": apply["event_id"],
                    "event_title": event.get("title", ""),
                    "event_time": event.get("time", ""),
                    "event_location": event.get("location", ""),
                    "apply_time": apply.get("apply_time", ""),
                    "sign_time": sign_record.get("sign_time") if sign_record else None,
                    "status": "signed" if sign_record else "applied"
                })

        # 获取总数
        total = await db["user_apply"].count_documents({"user_id": user_id})

        return {
            "code": 200,
            "data": result,
            "total": total
        }

    except Exception as e:
        logger.error(f"获取用户活动记录失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))