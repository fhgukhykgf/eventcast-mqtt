"""
EventCast-MQTT 主程序
"""
import sys
import os
from dotenv import load_dotenv

load_dotenv()
sys.path.append(os.path.dirname(__file__))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging
from contextlib import asynccontextmanager
from datetime import datetime
from typing import List

from api import events, signin, users, logs
from utils.database import get_database, close_database
from utils.mqtt_client import connect_mqtt, disconnect_mqtt, get_mqtt_status, get_mqtt_config
from utils.logging_config import setup_logging, configure_uvicorn_logging, setup_error_logging

setup_logging(
    log_level=os.getenv("LOG_LEVEL", "INFO"),
    log_dir=os.getenv("LOG_DIR", "./logs"),
    console_output=True
)
configure_uvicorn_logging()
setup_error_logging()

logger = logging.getLogger(__name__)

ALLOWED_ORIGINS: List[str] = os.getenv("CORS_ORIGINS", "*").split(",")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("EventCast-MQTT 服务启动...")
    
    try:
        db = await get_database()
        await db.command("ping")
        logger.info("MongoDB连接成功")
    except Exception as e:
        logger.error(f"MongoDB连接失败: {e}")

    try:
        connect_mqtt()
        logger.info("MQTT连接成功")
    except Exception as e:
        logger.error(f"MQTT连接失败: {e}")

    yield
    
    logger.info("EventCast-MQTT 服务关闭中...")
    disconnect_mqtt()
    await close_database()
    logger.info("EventCast-MQTT 服务已关闭")


app = FastAPI(
    title="EventCast-MQTT",
    description="活动快传 - 轻量化活动管理系统",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(events.router, prefix="/api/events", tags=["活动管理"])
app.include_router(signin.router, prefix="/api/sign", tags=["签到管理"])
app.include_router(users.router, prefix="/api/users", tags=["用户管理"])
app.include_router(logs.router, prefix="/api/logs", tags=["日志管理"])


@app.get("/")
async def root():
    return {
        "service": "EventCast-MQTT",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs"
    }


@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat()
    }


@app.get("/api/mqtt/status")
async def mqtt_status():
    """获取MQTT状态信息"""
    try:
        status = get_mqtt_status()
        config = get_mqtt_config()
        return {
            "status": "ok",
            "mqtt": {
                "status": status,
                "config": config
            }
        }
    except Exception as e:
        logger.error(f"获取MQTT状态失败: {e}")
        return {
            "status": "error",
            "message": str(e)
        }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host=os.getenv("BACKEND_HOST", "0.0.0.0"),
        port=int(os.getenv("BACKEND_PORT", "8000")),
        reload=os.getenv("DEBUG", "false").lower() == "true"
    )