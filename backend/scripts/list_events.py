"""
列出所有活动
"""
import asyncio
import logging
from utils.database import get_database, close_database

logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')
logger = logging.getLogger(__name__)


async def list_events():
    """列出所有活动"""
    try:
        db = await get_database()
        events_col = db["events"]
        
        events = await events_col.find({}).sort("created_at", -1).to_list(length=None)
        
        print("\n" + "=" * 80)
        print(f"{'活动ID':<30} {'活动名称':<25} {'状态':<10} {'报名':<6} {'签到':<6}")
        print("=" * 80)
        
        for event in events:
            event_id = event.get("event_id", "N/A")
            title = event.get("title", "未命名")[:23]
            status = event.get("status", "N/A")
            apply_count = event.get("apply_count", 0)
            sign_count = event.get("sign_count", 0)
            
            print(f"{event_id:<30} {title:<25} {status:<10} {apply_count:<6} {sign_count:<6}")
        
        print("=" * 80)
        print(f"总计: {len(events)} 个活动\n")
        
    except Exception as e:
        logger.error(f"❌ 错误: {e}", exc_info=True)
    finally:
        await close_database()


if __name__ == "__main__":
    asyncio.run(list_events())
