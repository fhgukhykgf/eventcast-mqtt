"""
健康检查脚本
检查系统各个组件的健康状态
"""

import asyncio
import logging
import sys
import requests
from pathlib import Path
from datetime import datetime

# 添加项目根目录到Python路径
project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))

from backend.utils.database import check_database_health, get_database_stats
from backend.utils.mqtt_client import get_mqtt_client, is_mqtt_connected
from backend.utils.logging_config import setup_logging

# 配置日志
setup_logging(log_level="INFO", console_output=True)
logger = logging.getLogger(__name__)


async def check_database():
    """
    检查数据库健康状态
    """
    try:
        logger.info("检查数据库连接...")

        # 检查连接
        db_healthy = await check_database_health()

        if db_healthy:
            logger.info("✓ 数据库连接正常")

            # 获取数据库统计信息
            stats = await get_database_stats()
            if stats:
                logger.info(f"  数据库: {stats.get('database', 'unknown')}")
                logger.info(f"  集合数: {stats.get('collections', 0)}")
                logger.info(f"  文档数: {stats.get('objects', 0):,}")
                logger.info(f"  数据大小: {stats.get('data_size', 0):,} bytes")
                logger.info(f"  存储大小: {stats.get('storage_size', 0):,} bytes")
                logger.info(f"  索引大小: {stats.get('index_size', 0):,} bytes")
                logger.info(f"  总大小: {stats.get('total_size', 0):,} bytes")

            return True
        else:
            logger.error("✗ 数据库连接失败")
            return False

    except Exception as e:
        logger.error(f"检查数据库时出错: {e}")
        return False


def check_mqtt():
    """
    检查MQTT服务状态
    """
    try:
        logger.info("检查MQTT服务...")

        # 获取MQTT客户端
        client = get_mqtt_client()

        if client:
            mqtt_connected = is_mqtt_connected()

            if mqtt_connected:
                logger.info("✓ MQTT连接正常")

                # 获取MQTT状态信息
                from backend.utils.mqtt_client import get_mqtt_status
                status = get_mqtt_status()

                logger.info(f"  代理: {status.get('broker', 'unknown')}:{status.get('port', 'unknown')}")
                logger.info(f"  客户端ID: {status.get('client_id', 'unknown')}")
                logger.info(f"  订阅主题数: {len(status.get('subscriptions', []))}")
                logger.info(f"  重连次数: {status.get('reconnect_attempts', 0)}")

                return True
            else:
                logger.error("✗ MQTT连接失败")
                return False
        else:
            logger.error("✗ MQTT客户端未初始化")
            return False

    except Exception as e:
        logger.error(f"检查MQTT时出错: {e}")
        return False


def check_backend_service(host="192.168.1.64", port=8000):
    """
    检查后端服务状态
    """
    try:
        logger.info(f"检查后端服务 (http://{host}:{port})...")

        # 健康检查端点
        health_url = f"http://{host}:{port}/api/health"

        try:
            response = requests.get(health_url, timeout=5)

            if response.status_code == 200:
                data = response.json()

                if data.get("status") == "healthy":
                    logger.info("✓ 后端服务正常")

                    # 显示详细信息
                    logger.info(f"  数据库: {data.get('database', 'unknown')}")
                    logger.info(f"  MQTT: {data.get('mqtt', 'unknown')}")
                    logger.info(f"  时间戳: {data.get('timestamp', 'unknown')}")

                    return True
                else:
                    logger.error(f"✗ 后端服务状态异常: {data}")
                    return False
            else:
                logger.error(f"✗ 后端服务响应异常: HTTP {response.status_code}")
                return False

        except requests.ConnectionError:
            logger.error("✗ 无法连接到后端服务")
            return False
        except requests.Timeout:
            logger.error("✗ 后端服务连接超时")
            return False

    except Exception as e:
        logger.error(f"检查后端服务时出错: {e}")
        return False


def check_emqx_console(host="localhost", port=18083):
    """
    检查EMQ X控制台
    """
    try:
        logger.info(f"检查EMQ X控制台 (http://{host}:{port})...")

        # 尝试访问EMQ X控制台
        console_url = f"http://{host}:{port}"

        try:
            response = requests.get(console_url, timeout=5)

            if response.status_code == 200:
                logger.info("✓ EMQ X控制台可访问")
                return True
            else:
                logger.error(f"✗ EMQ X控制台响应异常: HTTP {response.status_code}")
                return False

        except requests.ConnectionError:
            logger.error("✗ 无法连接到EMQ X控制台")
            return False
        except requests.Timeout:
            logger.error("✗ EMQ X控制台连接超时")
            return False

    except Exception as e:
        logger.error(f"检查EMQ X控制台时出错: {e}")
        return False


def check_ports():
    """
    检查关键端口是否开放
    """
    import socket

    ports_to_check = [
        ("MongoDB", 27017),
        ("MQTT", 1883),
        ("Backend API", 8000),
        ("EMQ X Console", 18083)
    ]

    logger.info("检查网络端口...")

    all_ok = True
    for service_name, port in ports_to_check:
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(2)
            result = sock.connect_ex(('localhost', port))
            sock.close()

            if result == 0:
                logger.info(f"  ✓ {service_name} 端口 {port} 开放")
            else:
                logger.error(f"  ✗ {service_name} 端口 {port} 关闭")
                all_ok = False

        except Exception as e:
            logger.error(f"  ✗ 检查 {service_name} 端口 {port} 时出错: {e}")
            all_ok = False

    return all_ok


async def check_system_resources():
    """
    检查系统资源
    """
    try:
        logger.info("检查系统资源...")

        import psutil

        # CPU使用率
        cpu_percent = psutil.cpu_percent(interval=1)
        logger.info(f"  CPU使用率: {cpu_percent}%")

        # 内存使用情况
        memory = psutil.virtual_memory()
        logger.info(f"  内存使用: {memory.percent}% ({memory.used // (1024 ** 3)}GB / {memory.total // (1024 ** 3)}GB)")

        # 磁盘使用情况
        disk = psutil.disk_usage('/')
        logger.info(f"  磁盘使用: {disk.percent}% ({disk.used // (1024 ** 3)}GB / {disk.total // (1024 ** 3)}GB)")

        # 检查关键进程
        processes_to_check = ["mongod", "emqx", "python"]
        running_processes = []

        for proc in psutil.process_iter(['name', 'cmdline']):
            try:
                name = proc.info['name'].lower() if proc.info['name'] else ''
                cmdline = ' '.join(proc.info['cmdline']) if proc.info['cmdline'] else ''

                for check_proc in processes_to_check:
                    if check_proc in name or check_proc in cmdline:
                        running_processes.append(check_proc)

            except (psutil.NoSuchProcess, psutil.AccessDenied):
                pass

        logger.info(f"  运行中的关键进程: {list(set(running_processes))}")

        # 评估资源状态
        issues = []
        if cpu_percent > 80:
            issues.append("CPU使用率过高")
        if memory.percent > 80:
            issues.append("内存使用率过高")
        if disk.percent > 90:
            issues.append("磁盘空间不足")

        if issues:
            logger.warning(f"  资源警告: {', '.join(issues)}")
            return False
        else:
            logger.info("  系统资源正常")
            return True

    except ImportError:
        logger.warning("  psutil模块未安装，跳过系统资源检查")
        return True
    except Exception as e:
        logger.error(f"  检查系统资源时出错: {e}")
        return False


async def generate_health_report():
    """
    生成健康检查报告
    """
    logger.info("\n" + "=" * 60)
    logger.info("EventCast-MQTT 系统健康检查")
    logger.info("=" * 60)

    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    logger.info(f"检查时间: {timestamp}")

    # 执行各项检查
    checks = []

    # 1. 检查端口
    port_check = check_ports()
    checks.append(("网络端口", port_check))

    # 2. 检查数据库
    db_check = await check_database()
    checks.append(("数据库", db_check))

    # 3. 检查MQTT
    mqtt_check = check_mqtt()
    checks.append(("MQTT服务", mqtt_check))

    # 4. 检查EMQ X控制台
    emqx_check = check_emqx_console()
    checks.append(("EMQ X控制台", emqx_check))

    # 5. 检查后端服务
    backend_check = check_backend_service()
    checks.append(("后端服务", backend_check))

    # 6. 检查系统资源
    resource_check = await check_system_resources()
    checks.append(("系统资源", resource_check))

    # 生成报告
    logger.info("\n" + "=" * 60)
    logger.info("健康检查报告")
    logger.info("=" * 60)

    passed_checks = 0
    failed_checks = 0

    for check_name, check_result in checks:
        status = "✓ 通过" if check_result else "✗ 失败"
        logger.info(f"{check_name}: {status}")

        if check_result:
            passed_checks += 1
        else:
            failed_checks += 1

    logger.info("-" * 60)
    logger.info(f"总计: {len(checks)} 项检查")
    logger.info(f"通过: {passed_checks} 项")
    logger.info(f"失败: {failed_checks} 项")

    # 总体评估
    if failed_checks == 0:
        logger.info("\n🎉 所有检查通过，系统健康！")
        return True
    elif failed_checks <= 2:
        logger.warning(f"\n⚠️  系统基本正常，但有 {failed_checks} 个问题需要关注")
        return True
    else:
        logger.error(f"\n❌ 系统存在 {failed_checks} 个问题，需要立即处理！")
        return False


async def main():
    """
    主函数
    """
    try:
        # 生成健康检查报告
        system_healthy = await generate_health_report()

        if system_healthy:
            logger.info("\n系统健康检查完成，状态正常")
            sys.exit(0)
        else:
            logger.error("\n系统健康检查完成，发现严重问题")
            sys.exit(1)

    except KeyboardInterrupt:
        logger.info("\n用户中断健康检查")
        sys.exit(0)
    except Exception as e:
        logger.error(f"健康检查过程中出现错误: {e}")
        sys.exit(1)


if __name__ == "__main__":
    # 运行异步主函数
    asyncio.run(main())