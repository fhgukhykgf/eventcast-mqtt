"""
数据库工具
"""
import os
import logging
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

load_dotenv()

logger = logging.getLogger(__name__)

_client = None
_db = None


def get_database_uri():
    """获取数据库URI"""
    return os.getenv("MONGODB_URI", "mongodb://192.168.1.64:27017/eventcast")


async def get_database():
    """获取数据库连接（带连接池配置）"""
    global _client, _db

    if _db is None:
        uri = get_database_uri()
        
        _client = AsyncIOMotorClient(
            uri,
            maxPoolSize=int(os.getenv("MONGO_MAX_POOL_SIZE", "10")),
            minPoolSize=int(os.getenv("MONGO_MIN_POOL_SIZE", "1")),
            maxIdleTimeMS=int(os.getenv("MONGO_MAX_IDLE_TIME_MS", "30000")),
            connectTimeoutMS=int(os.getenv("MONGO_CONNECT_TIMEOUT_MS", "5000")),
            serverSelectionTimeoutMS=int(os.getenv("MONGO_SERVER_SELECTION_TIMEOUT_MS", "5000")),
        )
        _db = _client["eventcast"]
        logger.info("MongoDB连接池已创建")

    return _db


async def close_database():
    """关闭数据库连接"""
    global _client
    if _client:
        _client.close()
        _client = None
        _db = None
        logger.info("MongoDB连接已关闭")