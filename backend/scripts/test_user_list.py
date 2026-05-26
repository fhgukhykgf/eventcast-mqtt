"""
测试用户列表接口
"""
import asyncio
import logging
from utils.database import get_database, close_database
from utils.auth import get_current_user, require_admin, TokenData

logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')
logger = logging.getLogger(__name__)


async def test_user_list():
    """测试用户列表查询"""
    try:
        db = await get_database()
        users_col = db["users"]

        print("\n" + "=" * 60)
        print("🔍 测试用户列表接口")
        print("=" * 60)

        # 1. 测试数据库连接
        print("\n📋 步骤 1: 测试数据库连接")
        await db.command("ping")
        print("✅ 数据库连接正常")

        # 2. 查询所有用户
        print("\n📋 步骤 2: 查询所有用户")
        total = await users_col.count_documents({})
        print(f"✅ 总用户数: {total}")

        # 3. 查询学生用户
        print("\n📋 步骤 3: 查询学生用户")
        student_count = await users_col.count_documents({"role": "student"})
        print(f"✅ 学生用户数: {student_count}")

        # 4. 测试带分页的查询
        print("\n📋 步骤 4: 测试分页查询 (skip=20, limit=20)")
        query = {}
        skip = 20
        limit = 20
        
        total_filtered = await users_col.count_documents(query)
        print(f"✅ 符合条件的用户总数: {total_filtered}")
        
        cursor = users_col.find(query, {"password": 0}).sort("created_at", -1).skip(skip).limit(limit)
        users = await cursor.to_list(length=limit)
        print(f"✅ 返回用户数: {len(users)}")

        # 5. 显示用户示例
        if users:
            print("\n📋 返回的用户示例(前5个):")
            for u in users[:5]:
                print(f"  - {u.get('user_id')}: {u.get('username')} ({u.get('real_name')}) - {u.get('role')}")

        # 6. 测试搜索功能
        print("\n📋 步骤 5: 测试搜索功能")
        import re
        search = "2026"
        safe_search = re.escape(search[:50])
        search_query = {
            "$or": [
                {"user_id": {"$regex": safe_search, "$options": "i"}},
                {"username": {"$regex": safe_search, "$options": "i"}},
                {"real_name": {"$regex": safe_search, "$options": "i"}}
            ]
        }
        search_count = await users_col.count_documents(search_query)
        print(f"✅ 搜索 '{search}' 找到 {search_count} 个用户")

        # 7. 测试角色过滤
        print("\n📋 步骤 6: 测试角色过滤")
        for role in ['student', 'admin', 'organizer']:
            role_count = await users_col.count_documents({"role": role})
            print(f"  - {role}: {role_count} 个用户")

        print("\n" + "=" * 60)
        print("✅ 所有测试通过！")
        print("=" * 60)
        print("\n💡 如果接口仍然返回 500 错误，可能的原因:")
        print("  1. Token 无效或过期")
        print("  2. 当前用户不是管理员")
        print("  3. 后端服务未正确启动")
        print("  4. Nginx 配置问题（如果使用）")
        print("=" * 60)

    except Exception as e:
        logger.error(f"❌ 测试失败: {e}", exc_info=True)
    finally:
        await close_database()


if __name__ == "__main__":
    asyncio.run(test_user_list())
