"""
查询活动报名和签到状态
"""
import asyncio
import logging
import asyncio
import sys
from pathlib import Path

sys.path.append(str(Path(__file__).parent.parent))
from utils.database import get_database, close_database

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

EVENT_IDS = [
    "event_1779788679540",
    "event_1779788646995",
    "event_1779788563531"
]


async def check_status():
    """查询活动状态"""
    try:
        db = await get_database()
        users_col = db["users"]
        events_col = db["events"]
        applies_col = db["user_apply"]
        signs_col = db["sign_records"]

        # 获取学生总数
        total_students = await users_col.count_documents({"role": "student"})
        logger.info(f"📊 学生总数: {total_students}")

        logger.info("\n" + "=" * 80)
        logger.info(f"{'活动ID':<30} {'活动名称':<20} {'报名人数':<10} {'签到人数':<10} {'签到率':<10}")
        logger.info("=" * 80)

        for event_id in EVENT_IDS:
            event = await events_col.find_one({"event_id": event_id})
            
            if not event:
                logger.info(f"❌ {event_id:<30} 活动不存在")
                continue

            title = event.get("title", "未命名")[:18]
            apply_count = event.get("apply_count", 0)
            sign_count = event.get("sign_count", 0)
            
            sign_rate = f"{round(sign_count / apply_count * 100, 1)}%" if apply_count > 0 else "0%"
            
            logger.info(f"✅ {event_id:<30} {title:<20} {apply_count:<10} {sign_count:<10} {sign_rate:<10}")

        logger.info("=" * 80)

        # 详细信息
        logger.info("\n📋 详细信息:")
        for event_id in EVENT_IDS:
            event = await events_col.find_one({"event_id": event_id})
            if not event:
                continue

            title = event.get("title", "未命名")
            apply_count = await applies_col.count_documents({"event_id": event_id})
            sign_count = await signs_col.count_documents({"event_id": event_id})
            
            logger.info(f"\n🎯 {title} ({event_id})")
            logger.info(f"   活动时间: {event.get('start_time', 'N/A')} ~ {event.get('end_time', 'N/A')}")
            logger.info(f"   活动地点: {event.get('location', 'N/A')}")
            logger.info(f"   报名人数: {apply_count}")
            logger.info(f"   签到人数: {sign_count}")

    except Exception as e:
        logger.error(f"❌ 查询失败: {e}", exc_info=True)
    finally:
        await close_database()


if __name__ == "__main__":
    asyncio.run(check_status())
