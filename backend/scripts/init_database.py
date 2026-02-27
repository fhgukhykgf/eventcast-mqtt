"""
数据库初始化脚本
"""
import asyncio
import sys
from pathlib import Path

sys.path.append(str(Path(__file__).parent.parent))

from backend.utils.database import get_database


async def init_database():
    """初始化数据库"""
    db = await get_database()

    # 创建集合
    collections = ["events", "users", "user_apply", "sign_records"]
    for col in collections:
        if col not in await db.list_collection_names():
            await db.create_collection(col)
            print(f"创建集合: {col}")

    # 创建索引
    await db.events.create_index("event_id", unique=True)
    await db.events.create_index("time")
    await db.events.create_index("status")

    await db.users.create_index("user_id", unique=True)
    await db.users.create_index("username", unique=True)

    await db.user_apply.create_index([("event_id", 1), ("user_id", 1)], unique=True)
    await db.sign_records.create_index([("event_id", 1), ("user_id", 1)], unique=True)

    print("索引创建完成")

    # 插入测试数据
    test_users = [
        {
            "user_id": "20230001",
            "username": "student01",
            "password": "8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92",  # 123456
            "real_name": "张三",
            "role": "student",
            "status": "active",
            "created_at": "2024-01-01T00:00:00"
        },
        {
            "user_id": "O2023001",
            "username": "organizer01",
            "password": "8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92",
            "real_name": "李组织",
            "role": "organizer",
            "status": "active",
            "created_at": "2024-01-01T00:00:00"
        }
    ]

    for user in test_users:
        existing = await db.users.find_one({"user_id": user["user_id"]})
        if not existing:
            await db.users.insert_one(user)
            print(f"创建测试用户: {user['user_id']}")

    print("数据库初始化完成")


if __name__ == "__main__":
    asyncio.run(init_database())