"""
MQTT客户端工具 - 同步版本
"""
import paho.mqtt.client as mqtt
import os
import json
import logging
import time

logger = logging.getLogger(__name__)

# 全局客户端实例
_client = None
_is_connected = False


def get_mqtt_config():
    """获取MQTT配置"""
    return {
        "broker": os.getenv("MQTT_BROKER", "localhost"),
        "port": int(os.getenv("MQTT_PORT", "1883")),
        "username": os.getenv("MQTT_USERNAME", "admin"),
        "password": os.getenv("MQTT_PASSWORD", "public"),
        "client_id": os.getenv("MQTT_CLIENT_ID", f"eventcast-backend-{int(time.time())}"),
        "keepalive": int(os.getenv("MQTT_KEEPALIVE", "60"))
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


def on_publish(client, userdata, mid):
    """MQTT发布回调函数"""
    logger.debug(f"📨 消息发布成功，消息ID: {mid}")


def on_log(client, userdata, level, buf):
    """MQTT日志回调函数"""
    if level == mqtt.MQTT_LOG_DEBUG:
        logger.debug(f"MQTT调试: {buf}")
    elif level == mqtt.MQTT_LOG_INFO:
        logger.info(f"MQTT信息: {buf}")
    elif level == mqtt.MQTT_LOG_NOTICE:
        logger.info(f"MQTT通知: {buf}")
    elif level == mqtt.MQTT_LOG_WARNING:
        logger.warning(f"MQTT警告: {buf}")
    elif level == mqtt.MQTT_LOG_ERR:
        logger.error(f"MQTT错误: {buf}")


def connect_mqtt():
    """
    连接MQTT代理（同步函数）
    """
    global _client, _is_connected

    if _client is not None and _client.is_connected():
        logger.info("MQTT客户端已连接")
        return True

    config = get_mqtt_config()

    try:
        # 创建客户端
        _client = mqtt.Client(
            client_id=config["client_id"],
            protocol=mqtt.MQTTv5,
            callback_api_version=mqtt.CallbackAPIVersion.VERSION2
        )

        # 设置回调函数
        _client.on_connect = on_connect
        _client.on_disconnect = on_disconnect
        _client.on_publish = on_publish
        _client.on_log = on_log

        # 设置认证
        if config["username"] and config["password"]:
            _client.username_pw_set(config["username"], config["password"])

        logger.info(f"🔄 正在连接MQTT代理: {config['broker']}:{config['port']}")

        # 连接
        _client.connect(
            host=config["broker"],
            port=config["port"],
            keepalive=config["keepalive"]
        )

        # 启动网络循环
        _client.loop_start()

        # 等待连接建立
        time.sleep(1)

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
    """
    断开MQTT连接（同步函数）
    """
    global _client, _is_connected

    if _client and _client.is_connected():
        try:
            _client.loop_stop()
            _client.disconnect()
            _is_connected = False
            logger.info("🔌 MQTT连接已断开")
        except Exception as e:
            logger.error(f"❌ 断开MQTT连接失败: {e}")


def publish_message(topic: str, payload: dict, qos: int = 1, retain: bool = False):
    """
    发布MQTT消息（同步函数，不是异步！）

    Args:
        topic: 主题
        payload: 消息内容（字典）
        qos: 服务质量等级 (0,1,2)
        retain: 是否保留消息

    Returns:
        bool: 是否发布成功
    """
    global _client, _is_connected

    # 检查连接状态
    if not _is_connected or not _client:
        logger.warning("⚠️ MQTT未连接，无法发送消息")
        return False

    try:
        # 将载荷转换为JSON字符串
        payload_str = json.dumps(payload, ensure_ascii=False)

        # 发布消息
        result = _client.publish(topic, payload_str, qos=qos, retain=retain)

        # 检查发布结果
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


def get_mqtt_client():
    """获取MQTT客户端实例"""
    global _client

    if _client is None:
        connect_mqtt()

    return _client


def get_mqtt_status() -> dict:
    """获取MQTT状态信息"""
    client = get_mqtt_client()

    if client is None:
        return {
            "connected": False,
            "status": "not_initialized"
        }

    return {
        "connected": is_mqtt_connected(),
        "broker": client._host if hasattr(client, '_host') else None,
        "port": client._port if hasattr(client, '_port') else None,
        "client_id": client._client_id if hasattr(client, '_client_id') else None
    }