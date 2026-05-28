"""
日志配置模块
配置应用程序的日志记录
"""

import os
import logging
import logging.handlers
from datetime import datetime
from typing import Optional


def setup_logging(
        log_level: str = "INFO",
        log_dir: str = "./logs",
        log_file: Optional[str] = None,
        console_output: bool = True
):
    """
    设置应用程序日志配置

    Args:
        log_level: 日志级别 (DEBUG, INFO, WARNING, ERROR, CRITICAL)
        log_dir: 日志文件目录
        log_file: 日志文件名，如为None则自动生成
        console_output: 是否在控制台输出日志
    """
    # 创建日志目录
    os.makedirs(log_dir, exist_ok=True)

    # 设置日志级别
    numeric_level = getattr(logging, log_level.upper(), logging.INFO)

    # 配置根日志记录器
    root_logger = logging.getLogger()
    root_logger.setLevel(numeric_level)

    # 清除现有的处理器
    for handler in root_logger.handlers[:]:
        root_logger.removeHandler(handler)

    # 创建格式化器
    formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )

    # 文件处理器
    if log_file is None:
        log_file = f"eventcast_{datetime.now().strftime('%Y%m%d')}.log"

    log_path = os.path.join(log_dir, log_file)

    file_handler = logging.handlers.RotatingFileHandler(
        log_path,
        maxBytes=10 * 1024 * 1024,  # 10MB
        backupCount=5,
        encoding='utf-8'
    )
    file_handler.setFormatter(formatter)
    file_handler.setLevel(numeric_level)
    root_logger.addHandler(file_handler)

    # 控制台处理器
    if console_output:
        console_handler = logging.StreamHandler()
        console_handler.setFormatter(formatter)
        console_handler.setLevel(numeric_level)
        root_logger.addHandler(console_handler)

    # 设置特定模块的日志级别
    logging.getLogger("pymongo").setLevel(logging.WARNING)
    logging.getLogger("urllib3").setLevel(logging.WARNING)
    logging.getLogger("asyncio").setLevel(logging.WARNING)
    logging.getLogger("watchfiles").setLevel(logging.WARNING)

    logging.info(f"日志配置完成 - 级别: {log_level}, 文件: {log_path}")


def get_logger(name: str) -> logging.Logger:
    """
    获取指定名称的日志记录器

    Args:
        name: 日志记录器名称

    Returns:
        logging.Logger 实例
    """
    return logging.getLogger(name)


def log_api_request(logger: logging.Logger, request_info: dict):
    """
    记录API请求日志

    Args:
        logger: 日志记录器
        request_info: 请求信息字典，包含：
            - method: HTTP方法
            - path: 请求路径
            - client: 客户端IP
            - user_id: 用户ID（可选）
            - processing_time: 处理时间（毫秒）
            - status_code: 状态码
    """
    method = request_info.get('method', 'UNKNOWN')
    path = request_info.get('path', '/')
    client = request_info.get('client', '0.0.0.0')  # nosec B104
    user_id = request_info.get('user_id', 'anonymous')
    processing_time = request_info.get('processing_time', 0)
    status_code = request_info.get('status_code', 200)

    log_message = (
        f"API请求 - {method} {path} "
        f"来自 {client} "
        f"用户 {user_id} "
        f"状态 {status_code} "
        f"耗时 {processing_time}ms"
    )

    if status_code >= 500:
        logger.error(log_message)
    elif status_code >= 400:
        logger.warning(log_message)
    else:
        logger.info(log_message)


def log_database_operation(logger: logging.Logger, operation_info: dict):
    """
    记录数据库操作日志

    Args:
        logger: 日志记录器
        operation_info: 操作信息字典，包含：
            - collection: 集合名称
            - operation: 操作类型 (find/insert/update/delete)
            - filter: 查询条件
            - result: 操作结果
            - duration: 操作耗时（毫秒）
    """
    collection = operation_info.get('collection', 'unknown')
    operation = operation_info.get('operation', 'unknown')
    filter_cond = operation_info.get('filter', {})
    result = operation_info.get('result', {})
    duration = operation_info.get('duration', 0)

    log_message = (
        f"数据库操作 - 集合: {collection}, "
        f"操作: {operation}, "
        f"条件: {filter_cond}, "
        f"结果: {result}, "
        f"耗时: {duration}ms"
    )

    logger.debug(log_message)


def log_mqtt_operation(logger: logging.Logger, operation_info: dict):
    """
    记录MQTT操作日志

    Args:
        logger: 日志记录器
        operation_info: 操作信息字典，包含：
            - operation: 操作类型 (publish/subscribe/unsubscribe)
            - topic: 主题
            - qos: 服务质量等级
            - success: 是否成功
            - error: 错误信息（如果有）
    """
    operation = operation_info.get('operation', 'unknown')
    topic = operation_info.get('topic', 'unknown')
    qos = operation_info.get('qos', 0)
    success = operation_info.get('success', False)
    error = operation_info.get('error')

    if success:
        log_message = (
            f"MQTT操作成功 - 操作: {operation}, "
            f"主题: {topic}, "
            f"QOS: {qos}"
        )
        logger.info(log_message)
    else:
        log_message = (
            f"MQTT操作失败 - 操作: {operation}, "
            f"主题: {topic}, "
            f"错误: {error}"
        )
        logger.error(log_message)


def log_user_activity(logger: logging.Logger, activity_info: dict):
    """
    记录用户活动日志

    Args:
        logger: 日志记录器
        activity_info: 活动信息字典，包含：
            - user_id: 用户ID
            - action: 操作类型 (login/logout/apply/signin/...)
            - event_id: 活动ID（如果相关）
            - details: 详细信息
            - ip_address: IP地址
    """
    user_id = activity_info.get('user_id', 'anonymous')
    action = activity_info.get('action', 'unknown')
    event_id = activity_info.get('event_id')
    details = activity_info.get('details', {})
    ip_address = activity_info.get('ip_address', '0.0.0.0')  # nosec B104

    log_message = (
        f"用户活动 - 用户: {user_id}, "
        f"操作: {action}, "
        f"活动: {event_id if event_id else 'N/A'}, "
        f"IP: {ip_address}, "
        f"详情: {details}"
    )

    logger.info(log_message)


def log_system_event(logger: logging.Logger, event_info: dict):
    """
    记录系统事件日志

    Args:
        logger: 日志记录器
        event_info: 事件信息字典，包含：
            - event_type: 事件类型 (startup/shutdown/error/backup/...)
            - component: 组件名称
            - severity: 严重级别 (info/warning/error/critical)
            - message: 事件消息
            - details: 详细信息
    """
    event_type = event_info.get('event_type', 'unknown')
    component = event_info.get('component', 'system')
    severity = event_info.get('severity', 'info')
    message = event_info.get('message', '')
    details = event_info.get('details', {})

    log_message = (
        f"系统事件 - 类型: {event_type}, "
        f"组件: {component}, "
        f"消息: {message}, "
        f"详情: {details}"
    )

    severity_method = getattr(logger, severity.lower(), logger.info)
    severity_method(log_message)


def create_structured_logger(
        name: str,
        extra_fields: Optional[dict] = None
) -> logging.Logger:
    """
    创建结构化日志记录器

    Args:
        name: 日志记录器名称
        extra_fields: 额外的日志字段

    Returns:
        结构化日志记录器
    """
    logger = logging.getLogger(name)

    # 如果存在旧的处理器，移除它们
    for handler in logger.handlers[:]:
        logger.removeHandler(handler)

    # 创建JSON格式化器（需要安装python-json-logger）
    try:
        from pythonjsonlogger import jsonlogger

        formatter = jsonlogger.JsonFormatter(
            '%(asctime)s %(name)s %(levelname)s %(message)s',
            datefmt='%Y-%m-%d %H:%M:%S',
            rename_fields={
                'asctime': 'timestamp',
                'levelname': 'level',
                'name': 'logger'
            },
            static_fields=extra_fields or {}
        )

        # 添加控制台处理器
        console_handler = logging.StreamHandler()
        console_handler.setFormatter(formatter)
        logger.addHandler(console_handler)

        logger.propagate = False

    except ImportError:
        # 如果未安装python-json-logger，使用普通格式化器
        formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
            datefmt='%Y-%m-%d %H:%M:%S'
        )

        console_handler = logging.StreamHandler()
        console_handler.setFormatter(formatter)
        logger.addHandler(console_handler)

        logger.warning("python-json-logger未安装，使用普通日志格式")

    return logger


def configure_uvicorn_logging():
    """
    配置Uvicorn的日志记录
    """
    import uvicorn

    # 配置Uvicorn日志格式
    uvicorn_log_config = {
        "version": 1,
        "disable_existing_loggers": False,
        "formatters": {
            "default": {
                "()": "uvicorn.logging.DefaultFormatter",
                "fmt": "%(asctime)s - %(name)s - %(levelname)s - %(message)s",
                "datefmt": "%Y-%m-%d %H:%M:%S",
            },
            "access": {
                "()": "uvicorn.logging.AccessFormatter",
                "fmt": '%(asctime)s - %(name)s - %(levelname)s - %(client_addr)s - "%(request_line)s" %(status_code)s',
                "datefmt": "%Y-%m-%d %H:%M:%S",
            },
        },
        "handlers": {
            "default": {
                "formatter": "default",
                "class": "logging.StreamHandler",
                "stream": "ext://sys.stderr",
            },
            "access": {
                "formatter": "access",
                "class": "logging.StreamHandler",
                "stream": "ext://sys.stdout",
            },
        },
        "loggers": {
            "uvicorn": {"handlers": ["default"], "level": "INFO", "propagate": False},
            "uvicorn.error": {"level": "INFO", "handlers": ["default"], "propagate": False},
            "uvicorn.access": {"handlers": ["access"], "level": "INFO", "propagate": False},
        },
    }

    # 应用配置
    uvicorn.config.LOGGING_CONFIG = uvicorn_log_config


def setup_error_logging():
    """
    设置错误日志记录
    """
    import sys
    import traceback

    def handle_exception(exc_type, exc_value, exc_traceback):
        """
        全局异常处理函数
        """
        if issubclass(exc_type, KeyboardInterrupt):
            # 不处理键盘中断
            sys.__excepthook__(exc_type, exc_value, exc_traceback)
            return

        logger = logging.getLogger("error_handler")

        # 格式化异常信息
        error_msg = "".join(traceback.format_exception(exc_type, exc_value, exc_traceback))

        logger.critical(f"未捕获的异常:\n{error_msg}")

        # 也可以发送到监控系统
        # send_to_monitoring_system(error_msg)

    # 设置全局异常处理器
    sys.excepthook = handle_exception


def get_log_files(log_dir: str = "./logs") -> list:
    """
    获取日志文件列表

    Args:
        log_dir: 日志目录

    Returns:
        日志文件列表
    """
    try:
        if not os.path.exists(log_dir):
            return []

        log_files = []
        for file in os.listdir(log_dir):
            if file.endswith('.log'):
                file_path = os.path.join(log_dir, file)
                stat = os.stat(file_path)
                log_files.append({
                    'name': file,
                    'path': file_path,
                    'size': stat.st_size,
                    'modified': stat.st_mtime
                })

        # 按修改时间排序
        log_files.sort(key=lambda x: x['modified'], reverse=True)
        return log_files

    except Exception as e:
        logging.error(f"获取日志文件列表失败: {e}")
        return []


def clear_old_logs(log_dir: str = "./logs", keep_days: int = 30):
    """
    清理旧的日志文件

    Args:
        log_dir: 日志目录
        keep_days: 保留天数
    """
    import time
    from datetime import datetime, timedelta

    try:
        if not os.path.exists(log_dir):
            return

        cutoff_time = time.time() - (keep_days * 24 * 60 * 60)

        for file in os.listdir(log_dir):
            if file.endswith('.log'):
                file_path = os.path.join(log_dir, file)
                stat = os.stat(file_path)

                if stat.st_mtime < cutoff_time:
                    os.remove(file_path)
                    logging.info(f"删除旧日志文件: {file}")

    except Exception as e:
        logging.error(f"清理旧日志失败: {e}")