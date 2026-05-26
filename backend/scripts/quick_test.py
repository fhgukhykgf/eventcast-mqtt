"""
快速测试脚本 - 检查学生用户并执行报名签到
"""
import asyncio
import logging
from datetime import datetime
import asyncio
import sys
from pathlib import Path

sys.path.append(str(Path(__file__).parent.parent))
from utils.database import get_database, close_database

logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')
logger = logging.getLogger(__name__)

EVENT_IDS = [
    "event_1779788679540",
    "event_1779788646995",
    "event_1779788563531"
]


async def quick_test():
    """快速测试"""
    try:
        db = await get_database()
        users_col = db["users"]
        events_col = db["events"]
        applies_col = db["user_apply"]
        signs_col = db["sign_records"]

        print("\n" + "=" * 60)
        print("📋 步骤 1: 检查学生用户")
        print("=" * 60)
        
        # 检查所有用户
        all_users = await users_col.find({}).to_list(length=None)
        logger.info(f"数据库中总用户数: {len(all_users)}")
        
        # 检查学生用户
        students = await users_col.find({"role": "student"}).to_list(length=None)
        logger.info(f"学生用户数 (role='student'): {len(students)}")
        
        if students:
            logger.info("\n学生用户列表:")
            for s in students[:10]:  # 只显示前10个
                logger.info(f"  - {s['user_id']}: {s.get('username', 'N/A')} ({s.get('real_name', 'N/A')})")
            if len(students) > 10:
                logger.info(f"  ... 还有 {len(students) - 10} 个学生")
        else:
            logger.warning("\n⚠️ 没有找到学生用户！")
            logger.info("检查用户角色分布:")
            roles = {}
            for u in all_users:
                role = u.get('role', 'unknown')
                roles[role] = roles.get(role, 0) + 1
            
            for role, count in roles.items():
                logger.info(f"  - {role}: {count} 个用户")
            
            # 询问是否要创建测试学生
            print("\n" + "=" * 60)
            print("📋 步骤 2: 是否创建测试学生？")
            print("=" * 60)
            
            # 创建3个测试学生
            test_students = [
                {"user_id": "test001", "username": "测试学生1", "password": "123456", "real_name": "学生A", "role": "student", "status": "active"},
                {"user_id": "test002", "username": "测试学生2", "password": "123456", "real_name": "学生B", "role": "student", "status": "active"},
                {"user_id": "test003", "username": "测试学生3", "password": "123456", "real_name": "学生C", "role": "student", "status": "active"},
            ]
            
            logger.info(f"\n准备创建 {len(test_students)} 个测试学生...")
            
            for student in test_students:
                existing = await users_col.find_one({"user_id": student["user_id"]})
                if existing:
                    logger.info(f"  ⏭️  学生已存在: {student['user_id']}")
                else:
                    from utils.auth import hash_password
                    student["password"] = hash_password(student["password"])
                    student["created_at"] = datetime.now().isoformat()
                    student["updated_at"] = datetime.now().isoformat()
                    await users_col.insert_one(student)
                    logger.info(f"  ✅ 创建成功: {student['user_id']} - {student['real_name']}")
            
            # 重新获取学生列表
            students = await users_col.find({"role": "student"}).to_list(length=None)
            logger.info(f"\n✅ 当前学生总数: {len(students)}")

        if not students:
            logger.error("❌ 仍然没有学生用户，无法继续")
            return

        print("\n" + "=" * 60)
        print("📋 步骤 3: 检查活动状态")
        print("=" * 60)
        
        for event_id in EVENT_IDS:
            event = await events_col.find_one({"event_id": event_id})
            if event:
                logger.info(f"\n✅ 活动: {event.get('title', 'N/A')}")
                logger.info(f"   ID: {event_id}")
                logger.info(f"   当前报名人数: {event.get('apply_count', 0)}")
                logger.info(f"   当前签到人数: {event.get('sign_count', 0)}")
            else:
                logger.warning(f"\n❌ 活动不存在: {event_id}")

        print("\n" + "=" * 60)
        print("📋 步骤 4: 执行批量报名和签到")
        print("=" * 60)
        
        total_applied = 0
        total_signed = 0
        
        for student in students:
            user_id = student["user_id"]
            user_name = student.get("real_name", student.get("username", user_id))
            
            logger.info(f"\n👤 处理: {user_id} ({user_name})")
            
            for event_id in EVENT_IDS:
                event = await events_col.find_one({"event_id": event_id})
                if not event:
                    continue
                
                event_title = event.get("title", "未命名")
                
                # 报名
                existing_apply = await applies_col.find_one({
                    "event_id": event_id,
                    "user_id": user_id
                })
                
                if not existing_apply:
                    apply_record = {
                        "event_id": event_id,
                        "user_id": user_id,
                        "user_name": user_name,
                        "apply_time": datetime.now().isoformat(),
                        "status": "applied"
                    }
                    await applies_col.insert_one(apply_record)
                    await events_col.update_one(
                        {"event_id": event_id},
                        {"$inc": {"apply_count": 1}}
                    )
                    logger.info(f"  ✅ 报名: {event_title[:15]}")
                    total_applied += 1
                else:
                    logger.info(f"  ⏭️  已报名: {event_title[:15]}")
                
                # 签到
                existing_sign = await signs_col.find_one({
                    "event_id": event_id,
                    "user_id": user_id
                })
                
                if not existing_sign:
                    sign_record = {
                        "event_id": event_id,
                        "user_id": user_id,
                        "user_name": user_name,
                        "sign_time": datetime.now().isoformat(),
                        "sign_method": "batch_script"
                    }
                    await signs_col.insert_one(sign_record)
                    await events_col.update_one(
                        {"event_id": event_id},
                        {"$inc": {"sign_count": 1}}
                    )
                    logger.info(f"  ✅ 签到: {event_title[:15]}")
                    total_signed += 1
                else:
                    logger.info(f"  ⏭️  已签到: {event_title[:15]}")
        
        print("\n" + "=" * 60)
        print("📊 执行结果")
        print("=" * 60)
        logger.info(f"✅ 新增报名: {total_applied}")
        logger.info(f"✅ 新增签到: {total_signed}")
        
        print("\n" + "=" * 60)
        print("📋 步骤 5: 验证最终结果")
        print("=" * 60)
        
        for event_id in EVENT_IDS:
            event = await events_col.find_one({"event_id": event_id})
            if event:
                actual_apply = await applies_col.count_documents({"event_id": event_id})
                actual_sign = await signs_col.count_documents({"event_id": event_id})
                
                logger.info(f"\n🎯 {event.get('title', 'N/A')}")
                logger.info(f"   数据库记录 - 报名: {event.get('apply_count', 0)}, 签到: {event.get('sign_count', 0)}")
                logger.info(f"   实际记录数 - 报名: {actual_apply}, 签到: {actual_sign}")
                
                if event.get('apply_count', 0) == actual_apply and event.get('sign_count', 0) == actual_sign:
                    logger.info(f"   ✅ 数据一致")
                else:
                    logger.warning(f"   ⚠️  数据不一致，正在修复...")
                    await events_col.update_one(
                        {"event_id": event_id},
                        {"$set": {"apply_count": actual_apply, "sign_count": actual_sign}}
                    )
                    logger.info(f"   ✅ 已修复")

        print("\n" + "=" * 60)
        print("✅ 完成！")
        print("=" * 60)

    except Exception as e:
        logger.error(f"❌ 错误: {e}", exc_info=True)
    finally:
        await close_database()


if __name__ == "__main__":
    asyncio.run(quick_test())
