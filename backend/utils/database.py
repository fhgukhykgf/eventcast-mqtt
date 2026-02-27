"""
数据库工具
"""
import os
import logging
from motor.motor_asyncio import AsyncIOMotorClient

logger = logging.getLogger(__name__)

_client = None
_db = None


def get_database_uri():
    """获取数据库URI"""
    return os.getenv("MONGODB_URI", "mongodb://localhost:27017/eventcast")


async def get_database():
    """获取数据库连接"""
    global _client, _db

    if _db is None:
        uri = get_database_uri()
        _client = AsyncIOMotorClient(uri)
        _db = _client["eventcast"]
        logger.info("MongoDB连接成功")

    return _db


async def close_database():
    """关闭数据库连接"""
    global _client
    if _client:
        _client.close()
        logger.info("MongoDB连接已关闭")