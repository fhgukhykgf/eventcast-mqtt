"""
创建管理员账号
"""
import asyncio
import hashlib
import sys
from pathlib import Path

sys.path.append(str(Path(__file__).parent.parent))

from backend.utils.database import get_database


def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()


async def create_admin():
    """创建管理员账号"""
    db = await get_database()

    admin = {
        "user_id": "admin",
        "username": "admin",
        "password": hash_password("admin123"),
        "real_name": "系统管理员",
        "role": "admin",
        "status": "active",
        "created_at": "2026-01-01T00:00:00"
    }

    existing = await db.users.find_one({"user_id": "admin"})
    if existing:
        print("管理员账号已存在")
        return

    await db.users.insert_one(admin)
    print("管理员账号创建成功")
    print("用户名: admin")
    print("密码: admin123")


if __name__ == "__main__":
    asyncio.run(create_admin())