"""
EventCast-MQTT 主程序
"""
import sys
import os

sys.path.append(os.path.dirname(__file__))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging
from contextlib import asynccontextmanager
from datetime import datetime

from api import events, signin, users
from utils.database import get_database
from utils.mqtt_client import connect_mqtt

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


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
    logger.info("EventCast-MQTT 服务关闭")


app = FastAPI(
    title="EventCast-MQTT",
    description="活动快传 - 轻量化活动管理系统",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(events.router, prefix="/api/events", tags=["活动管理"])
app.include_router(signin.router, prefix="/api/sign", tags=["签到管理"])
app.include_router(users.router, prefix="/api/users", tags=["用户管理"])


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


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)