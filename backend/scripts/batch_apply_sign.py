"""
批量报名和签到脚本
为所有学生用户批量报名并签到指定活动
"""
import asyncio
import logging
from datetime import datetime
from utils.database import get_database, close_database

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# 需要处理的活动ID
EVENT_IDS = [
    "event_1779788679540",
    "event_1779788646995",
    "event_1779788563531"
]


async def batch_apply_and_sign():
    """批量报名和签到"""
    try:
        # 连接数据库
        db = await get_database()
        users_col = db["users"]
        events_col = db["events"]
        applies_col = db["user_apply"]
        signs_col = db["sign_records"]

        logger.info("=" * 60)
        logger.info("🚀 开始批量报名和签到")
        logger.info("=" * 60)

        # 1. 获取所有学生用户
        students = await users_col.find({"role": "student"}).to_list(length=None)
        logger.info(f"📊 找到 {len(students)} 个学生用户")

        if not students:
            logger.warning("⚠️ 没有找到学生用户")
            return

        # 2. 验证活动是否存在
        existing_events = []
        for event_id in EVENT_IDS:
            event = await events_col.find_one({"event_id": event_id})
            if event:
                existing_events.append(event)
                logger.info(f"✅ 活动存在: {event_id} - {event.get('title', '未命名')}")
            else:
                logger.warning(f"❌ 活动不存在: {event_id}")

        if not existing_events:
            logger.error("❌ 没有找到任何有效活动")
            return

        logger.info(f"\n📋 将处理 {len(existing_events)} 个活动")

        # 3. 批量处理每个学生的报名和签到
        total_applied = 0
        total_signed = 0
        total_skipped_apply = 0
        total_skipped_sign = 0

        for student in students:
            user_id = student["user_id"]
            user_name = student.get("real_name", student.get("username", user_id))

            logger.info(f"\n👤 处理学生: {user_id} ({user_name})")

            for event in existing_events:
                event_id = event["event_id"]
                event_title = event.get("title", "未命名")

                # 3.1 检查是否已报名
                existing_apply = await applies_col.find_one({
                    "event_id": event_id,
                    "user_id": user_id
                })

                if existing_apply:
                    logger.info(f"  ⏭️  已报名: {event_title}")
                    total_skipped_apply += 1
                else:
                    # 报名
                    apply_record = {
                        "event_id": event_id,
                        "user_id": user_id,
                        "user_name": user_name,
                        "apply_time": datetime.now().isoformat(),
                        "status": "applied"
                    }

                    try:
                        await applies_col.insert_one(apply_record)
                        
                        # 更新活动报名人数
                        await events_col.update_one(
                            {"event_id": event_id},
                            {"$inc": {"apply_count": 1}}
                        )
                        
                        logger.info(f"  ✅ 报名成功: {event_title}")
                        total_applied += 1
                    except Exception as e:
                        if "duplicate key error" in str(e).lower() or "e11000" in str(e).lower():
                            logger.info(f"  ⏭️  已报名(并发): {event_title}")
                            total_skipped_apply += 1
                        else:
                            logger.error(f"  ❌ 报名失败: {event_title} - {e}")

                # 3.2 检查是否已签到
                existing_sign = await signs_col.find_one({
                    "event_id": event_id,
                    "user_id": user_id
                })

                if existing_sign:
                    logger.info(f"  ⏭️  已签到: {event_title}")
                    total_skipped_sign += 1
                else:
                    # 签到
                    sign_record = {
                        "event_id": event_id,
                        "user_id": user_id,
                        "user_name": user_name,
                        "sign_time": datetime.now().isoformat(),
                        "sign_method": "batch_script"
                    }

                    try:
                        await signs_col.insert_one(sign_record)
                        
                        # 更新活动签到人数
                        await events_col.update_one(
                            {"event_id": event_id},
                            {"$inc": {"sign_count": 1}}
                        )
                        
                        logger.info(f"  ✅ 签到成功: {event_title}")
                        total_signed += 1
                    except Exception as e:
                        if "duplicate key error" in str(e).lower() or "e11000" in str(e).lower():
                            logger.info(f"  ⏭️  已签到(并发): {event_title}")
                            total_skipped_sign += 1
                        else:
                            logger.error(f"  ❌ 签到失败: {event_title} - {e}")

        # 4. 输出统计信息
        logger.info("\n" + "=" * 60)
        logger.info("📊 批量处理完成 - 统计信息")
        logger.info("=" * 60)
        logger.info(f"👥 处理学生数: {len(students)}")
        logger.info(f"📝 活动数量: {len(existing_events)}")
        logger.info(f"✅ 新增报名: {total_applied}")
        logger.info(f"⏭️  跳过报名(已报): {total_skipped_apply}")
        logger.info(f"✅ 新增签到: {total_signed}")
        logger.info(f"⏭️  跳过签到(已签): {total_skipped_sign}")
        logger.info(f"📈 总报名数: {total_applied + total_skipped_apply}")
        logger.info(f"📈 总签到数: {total_signed + total_skipped_sign}")
        logger.info("=" * 60)

        # 5. 验证结果
        logger.info("\n🔍 验证数据一致性...")
        for event in existing_events:
            event_id = event["event_id"]
            event_title = event.get("title", "未命名")
            
            # 获取最新的活动数据
            updated_event = await events_col.find_one({"event_id": event_id})
            
            # 统计实际报名和签到数
            actual_apply_count = await applies_col.count_documents({"event_id": event_id})
            actual_sign_count = await signs_col.count_documents({"event_id": event_id})
            
            logger.info(f"\n📋 活动: {event_title} ({event_id})")
            logger.info(f"  数据库记录报名: {updated_event.get('apply_count', 0)}")
            logger.info(f"  实际报名记录: {actual_apply_count}")
            logger.info(f"  数据库记录签到: {updated_event.get('sign_count', 0)}")
            logger.info(f"  实际签到记录: {actual_sign_count}")
            
            # 检查是否一致
            if updated_event.get('apply_count', 0) == actual_apply_count:
                logger.info(f"  ✅ 报名人数一致")
            else:
                logger.warning(f"  ⚠️  报名人数不一致，正在修复...")
                await events_col.update_one(
                    {"event_id": event_id},
                    {"$set": {"apply_count": actual_apply_count}}
                )
                logger.info(f"  ✅ 已修复报名人数")
            
            if updated_event.get('sign_count', 0) == actual_sign_count:
                logger.info(f"  ✅ 签到人数一致")
            else:
                logger.warning(f"  ⚠️  签到人数不一致，正在修复...")
                await events_col.update_one(
                    {"event_id": event_id},
                    {"$set": {"sign_count": actual_sign_count}}
                )
                logger.info(f"  ✅ 已修复签到人数")

        logger.info("\n" + "=" * 60)
        logger.info("✅ 所有操作完成！")
        logger.info("=" * 60)

    except Exception as e:
        logger.error(f"❌ 批量处理失败: {e}", exc_info=True)
        raise
    finally:
        await close_database()


if __name__ == "__main__":
    print("\n" + "=" * 60)
    print("⚠️  批量报名和签到脚本")
    print("=" * 60)
    print(f"📋 活动ID:")
    for eid in EVENT_IDS:
        print(f"   - {eid}")
    print("=" * 60)
    
    confirm = input("\n⚡ 此操作将修改数据库，是否继续？(yes/no): ")
    
    if confirm.lower() == "yes":
        print("\n🚀 开始执行...\n")
        asyncio.run(batch_apply_and_sign())
        print("\n✅ 脚本执行完成！\n")
    else:
        print("\n❌ 操作已取消\n")
