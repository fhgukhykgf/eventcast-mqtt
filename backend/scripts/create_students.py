"""
批量创建学生用户脚本
创建90个学生用户，用户ID从20260011到20260100
"""
import asyncio
import logging
from datetime import datetime
from pathlib import Path
import sys
sys.path.append(str(Path(__file__).parent.parent))
from utils.database import get_database, close_database
from utils.auth import hash_password

logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')
logger = logging.getLogger(__name__)

# 配置
START_ID = 20260011
END_ID = 20260100
DEFAULT_PASSWORD = "123456"


async def batch_create_students():
    """批量创建学生用户"""
    try:
        db = await get_database()
        users_col = db["users"]

        print("\n" + "=" * 60)
        print("🚀 批量创建学生用户")
        print("=" * 60)
        print(f"📋 用户ID范围: {START_ID} - {END_ID}")
        print(f"📋 预计创建: {END_ID - START_ID + 1} 个学生")
        print(f"📋 默认密码: {DEFAULT_PASSWORD}")
        print("=" * 60)

        # 密码加密（只需加密一次）
        hashed_pwd = hash_password(DEFAULT_PASSWORD)
        
        created_count = 0
        skipped_count = 0
        error_count = 0

        # 批量创建
        for i in range(START_ID, END_ID + 1):
            user_id = str(i)
            username = user_id
            real_name = user_id

            # 检查用户是否已存在
            existing = await users_col.find_one({"user_id": user_id})
            
            if existing:
                logger.info(f"⏭️  用户已存在: {user_id}")
                skipped_count += 1
                continue

            # 创建用户
            user_data = {
                "user_id": user_id,
                "username": username,
                "password": hashed_pwd,
                "real_name": real_name,
                "email": "",
                "phone": "",
                "role": "student",
                "status": "active",
                "created_at": datetime.now().isoformat(),
                "updated_at": datetime.now().isoformat(),
                "apply_count": 0,
                "sign_count": 0,
                "last_login": ""
            }

            try:
                await users_col.insert_one(user_data)
                created_count += 1
                
                if created_count % 10 == 0:
                    logger.info(f"✅ 已创建 {created_count} 个用户...")
                    
            except Exception as e:
                logger.error(f"❌ 创建用户 {user_id} 失败: {e}")
                error_count += 1

        # 统计信息
        print("\n" + "=" * 60)
        print("📊 创建完成 - 统计信息")
        print("=" * 60)
        print(f"✅ 成功创建: {created_count} 个用户")
        print(f"⏭️  跳过(已存在): {skipped_count} 个用户")
        print(f"❌ 创建失败: {error_count} 个用户")
        print(f"📈 总计处理: {created_count + skipped_count + error_count} 个用户")
        print("=" * 60)

        # 验证结果
        total_students = await users_col.count_documents({"role": "student"})
        logger.info(f"\n🔍 验证: 数据库中现有学生用户总数: {total_students}")

        # 显示最新创建的10个用户
        logger.info("\n📋 最新创建的学生用户(前10个):")
        cursor = users_col.find(
            {"role": "student"},
            {"user_id": 1, "username": 1, "real_name": 1, "role": 1, "status": 1}
        ).sort("created_at", -1).limit(10)
        
        students = await cursor.to_list(length=10)
        for s in students:
            logger.info(f"  - {s['user_id']}: {s['username']} ({s['real_name']}) - {s['status']}")

        print("\n" + "=" * 60)
        print("✅ 批量创建完成！")
        print("=" * 60)
        print(f"\n💡 登录信息:")
        print(f"   用户名: 20260011 ~ 20260100")
        print(f"   密码: {DEFAULT_PASSWORD}")
        print("=" * 60)

    except Exception as e:
        logger.error(f"❌ 批量创建失败: {e}", exc_info=True)
        raise
    finally:
        await close_database()


if __name__ == "__main__":
    confirm = input("\n⚡ 将在数据库中创建90个学生用户，是否继续？(yes/no): ")
    
    if confirm.lower() == "yes":
        print("\n🚀 开始执行...\n")
        asyncio.run(batch_create_students())
        print("\n✅ 脚本执行完成！\n")
    else:
        print("\n❌ 操作已取消\n")
