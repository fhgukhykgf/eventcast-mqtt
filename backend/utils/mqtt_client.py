"""
MQTT客户端工具
"""
import os
import json
import logging
import time
import threading
from typing import Optional, Dict, Any

from dotenv import load_dotenv
import paho.mqtt.client as mqtt

load_dotenv()

logger = logging.getLogger(__name__)

_client: Optional[mqtt.Client] = None
_is_connected: bool = False
_reconnect_thread: Optional[threading.Thread] = None
_stop_reconnect: bool = False


def get_mqtt_config() -> Dict[str, Any]:
    """获取MQTT配置"""
    return {
        "broker": os.getenv("MQTT_BROKER", "192.168.1.64"),
        "port": int(os.getenv("MQTT_PORT", "1883")),
        "username": os.getenv("MQTT_USERNAME", "admin"),
        "password": os.getenv("MQTT_PASSWORD", "public"),
        "client_id": os.getenv("MQTT_CLIENT_ID", f"eventcast-backend-{int(time.time())}"),
        "keepalive": int(os.getenv("MQTT_KEEPALIVE", "60")),
        "reconnect_delay": int(os.getenv("MQTT_RECONNECT_DELAY", "5")),
        "max_reconnect_attempts": int(os.getenv("MQTT_MAX_RECONNECT_ATTEMPTS", "10"))
    }


def on_connect(client, userdata, flags, rc, properties=None):
    """MQTT连接回调函数"""
    global _is_connected

    if rc == 0:
        _is_connected = True
        logger.info("✅ MQTT连接成功")
    else:
        _is_connected = False
        error_messages = {
            1: "协议版本错误",
            2: "客户端标识符无效",
            3: "服务器不可用",
            4: "用户名或密码错误",
            5: "未授权"
        }
        error_msg = error_messages.get(rc, f"未知错误代码: {rc}")
        logger.error(f"❌ MQTT连接失败: {error_msg}")


def on_disconnect(client, userdata, rc, properties=None):
    """MQTT断开连接回调函数"""
    global _is_connected
    _is_connected = False
    logger.warning(f"⚠️ MQTT连接断开，返回码: {rc}")
    
    if rc != 0:
        logger.info("🔄 准备自动重连...")
        _start_reconnect_thread()


def on_publish(client, userdata, mid, reason_code=None, properties=None):
    """MQTT发布回调函数"""
    logger.debug(f"📨 消息发布成功，消息ID: {mid}")


def on_log(client, userdata, level, buf):
    """MQTT日志回调函数"""
    log_levels = {
        mqtt.MQTT_LOG_DEBUG: logger.debug,
        mqtt.MQTT_LOG_INFO: logger.info,
        mqtt.MQTT_LOG_NOTICE: logger.info,
        mqtt.MQTT_LOG_WARNING: logger.warning,
        mqtt.MQTT_LOG_ERR: logger.error
    }
    log_func = log_levels.get(level, logger.debug)
    log_func(f"MQTT: {buf}")


def _start_reconnect_thread():
    """启动重连线程"""
    global _reconnect_thread, _stop_reconnect
    
    if _reconnect_thread and _reconnect_thread.is_alive():
        return
    
    _stop_reconnect = False
    _reconnect_thread = threading.Thread(target=_reconnect_worker, daemon=True)
    _reconnect_thread.start()


def _reconnect_worker():
    """重连工作线程"""
    global _stop_reconnect
    
    config = get_mqtt_config()
    max_attempts = config["max_reconnect_attempts"]
    delay = config["reconnect_delay"]
    
    for attempt in range(1, max_attempts + 1):
        if _stop_reconnect:
            logger.info("🛑 重连已停止")
            return
        
        logger.info(f"🔄 第 {attempt}/{max_attempts} 次尝试重连...")
        
        try:
            if _client and _client.is_connected():
                logger.info("✅ MQTT已重连成功")
                return
            
            if _client:
                _client.reconnect()
                time.sleep(2)
                
                if _is_connected:
                    logger.info("✅ MQTT重连成功")
                    return
        except Exception as e:
            logger.warning(f"重连失败: {e}")
        
        time.sleep(delay)
    
    logger.error(f"❌ MQTT重连失败，已达到最大重试次数 {max_attempts}")


def connect_mqtt() -> bool:
    """连接MQTT代理"""
    global _client, _is_connected, _stop_reconnect

    if _client is not None and _client.is_connected():
        logger.info("MQTT客户端已连接")
        return True

    config = get_mqtt_config()

    try:
        _stop_reconnect = True
        
        _client = mqtt.Client(
            client_id=config["client_id"],
            protocol=mqtt.MQTTv311
        )

        _client.on_connect = on_connect
        _client.on_disconnect = on_disconnect
        _client.on_publish = on_publish
        _client.on_log = on_log

        if config["username"] and config["password"]:
            _client.username_pw_set(config["username"], config["password"])

        _client.reconnect_delay_set(min_delay=1, max_delay=120)

        logger.info(f"🔄 正在连接MQTT代理: {config['broker']}:{config['port']}")

        _client.connect(
            host=config["broker"],
            port=config["port"],
            keepalive=config["keepalive"]
        )

        _client.loop_start()

        for _ in range(10):
            if _is_connected:
                break
            time.sleep(0.5)

        if _is_connected:
            logger.info("✅ MQTT连接成功")
            return True
        else:
            logger.warning("⚠️ MQTT连接超时")
            return False

    except Exception as e:
        logger.error(f"❌ 连接MQTT代理失败: {e}")
        return False


def disconnect_mqtt():
    """断开MQTT连接"""
    global _client, _is_connected, _stop_reconnect

    _stop_reconnect = True
    
    if _client:
        try:
            _client.loop_stop()
            _client.disconnect()
            _is_connected = False
            logger.info("🔌 MQTT连接已断开")
        except Exception as e:
            logger.error(f"❌ 断开MQTT连接失败: {e}")


def publish_message(topic: str, payload: Dict[str, Any], qos: int = 1, retain: bool = False) -> bool:
    """
    发布MQTT消息

    Args:
        topic: 主题
        payload: 消息内容（字典）
        qos: 服务质量等级 (0,1,2)
        retain: 是否保留消息

    Returns:
        bool: 是否发布成功
    """
    global _client, _is_connected

    if not _is_connected or not _client:
        logger.warning("⚠️ MQTT未连接，无法发送消息")
        return False

    try:
        payload_str = json.dumps(payload, ensure_ascii=False)

        result = _client.publish(topic, payload_str, qos=qos, retain=retain)

        if result.rc == mqtt.MQTT_ERR_SUCCESS:
            logger.debug(f"📨 消息发布成功 - 主题: {topic}")
            return True
        else:
            logger.error(f"❌ 消息发布失败 - 主题: {topic}, 错误码: {result.rc}")
            return False

    except Exception as e:
        logger.error(f"❌ 发布MQTT消息异常: {e}")
        return False


def is_mqtt_connected() -> bool:
    """检查MQTT是否已连接"""
    global _is_connected, _client

    if _client is None:
        return False

    return _is_connected and _client.is_connected()


def get_mqtt_client() -> Optional[mqtt.Client]:
    """获取MQTT客户端实例"""
    global _client

    if _client is None:
        connect_mqtt()

    return _client


def get_mqtt_status() -> Dict[str, Any]:
    """获取MQTT状态信息"""
    client = get_mqtt_client()

    if client is None:
        return {
            "connected": False,
            "status": "not_initialized"
        }

    try:
        return {
            "connected": is_mqtt_connected(),
            "broker": client._host if hasattr(client, '_host') else None,
            "port": client._port if hasattr(client, '_port') else None,
            "client_id": client._client_id if hasattr(client, '_client_id') else None
        }
    except Exception as e:
        logger.error(f"获取MQTT状态失败: {e}")
        return {
            "connected": False,
            "status": "error"
        }