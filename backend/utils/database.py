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
    return os.getenv("MONGODB_URI", "mongodb://127.0.0.1:27017/eventcast")


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


async def check_database_health() -> bool:
    """检查数据库是否健康"""
    try:
        db = await get_database()
        await db.command("ping")
        return True
    except Exception as e:
        logger.error(f"数据库健康检查失败: {e}")
        return False


async def get_database_stats() -> dict:
    """获取数据库统计信息"""
    try:
        db = await get_database()
        stats = await db.command("dbStats", scale=1)
        return {
            "database": stats.get("db", "eventcast"),
            "collections": stats.get("collections", 0),
            "objects": stats.get("objects", 0),
            "data_size": stats.get("dataSize", 0),
            "storage_size": stats.get("storageSize", 0),
            "index_size": stats.get("indexSize", 0),
            "total_size": stats.get("dataSize", 0) + stats.get("indexSize", 0)
        }
    except Exception as e:
        logger.error(f"获取数据库统计失败: {e}")
        return None