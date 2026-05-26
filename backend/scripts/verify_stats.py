"""
验证和修复活动报名签到统计数据
"""
import asyncio
import logging
from utils.database import get_database, close_database

logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')
logger = logging.getLogger(__name__)


async def verify_and_fix_stats():
    """验证并修复统计数据"""
    try:
        db = await get_database()
        events_col = db["events"]
        applies_col = db["user_apply"]
        signs_col = db["sign_records"]

        print("\n" + "=" * 80)
        print("🔍 验证活动报名签到统计数据")
        print("=" * 80)

        # 获取所有活动
        events = await events_col.find({}).to_list(length=None)
        logger.info(f"📊 找到 {len(events)} 个活动")

        fixed_count = 0
        consistent_count = 0

        for event in events:
            event_id = event.get("event_id")
            title = event.get("title", "未命名")
            
            # 获取实际的报名和签到数
            actual_apply_count = await applies_col.count_documents({"event_id": event_id})
            actual_sign_count = await signs_col.count_documents({"event_id": event_id})
            
            # 数据库记录的值
            db_apply_count = event.get("apply_count", 0)
            db_sign_count = event.get("sign_count", 0)
            
            # 检查是否一致
            apply_consistent = db_apply_count == actual_apply_count
            sign_consistent = db_sign_count == actual_sign_count
            
            if apply_consistent and sign_consistent:
                consistent_count += 1
                logger.info(f"✅ {title[:20]:<20} | 报名: {db_apply_count} = {actual_apply_count} | 签到: {db_sign_count} = {actual_sign_count}")
            else:
                fixed_count += 1
                logger.warning(f"❌ {title[:20]:<20} | 报名: {db_apply_count} ≠ {actual_apply_count} | 签到: {db_sign_count} ≠ {actual_sign_count}")
                
                # 修复数据
                await events_col.update_one(
                    {"event_id": event_id},
                    {"$set": {
                        "apply_count": actual_apply_count,
                        "sign_count": actual_sign_count
                    }}
                )
                logger.info(f"   🔧 已修复: 报名={actual_apply_count}, 签到={actual_sign_count}")

        print("\n" + "=" * 80)
        print("📊 统计结果")
        print("=" * 80)
        logger.info(f"✅ 数据一致: {consistent_count} 个活动")
        logger.info(f"🔧 已修复: {fixed_count} 个活动")
        logger.info(f"📈 总计: {len(events)} 个活动")
        print("=" * 80)

        # 总体统计
        total_apply = await applies_col.count_documents({})
        total_sign = await signs_col.count_documents({})
        
        logger.info(f"\n📋 全局统计:")
        logger.info(f"   总报名记录数: {total_apply}")
        logger.info(f"   总签到记录数: {total_sign}")

    except Exception as e:
        logger.error(f"❌ 验证失败: {e}", exc_info=True)
    finally:
        await close_database()


if __name__ == "__main__":
    asyncio.run(verify_and_fix_stats())
