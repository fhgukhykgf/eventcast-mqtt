"""
数据备份脚本
备份MongoDB数据到文件
"""

import asyncio
import logging
import sys
import os
import json
import shutil
from pathlib import Path
from datetime import datetime
from typing import List, Dict, Any
import subprocess  # nosec B404

# 添加项目根目录到Python路径
project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))

from backend.utils.database import get_database, get_database_uri
from backend.utils.logging_config import setup_logging

# 配置日志
setup_logging(log_level="INFO", console_output=True)
logger = logging.getLogger(__name__)


class DataBackup:
    """
    数据备份类
    """

    def __init__(self, backup_dir: str = "./backups"):
        """
        初始化备份类

        Args:
            backup_dir: 备份目录
        """
        self.backup_dir = Path(backup_dir)
        self.backup_dir.mkdir(parents=True, exist_ok=True)

    async def backup_all_collections(self, backup_name: str = None):
        """
        备份所有集合

        Args:
            backup_name: 备份名称，如为None则自动生成

        Returns:
            tuple: (备份文件路径, 备份的集合数, 总文档数)
        """
        try:
            db = await get_database()

            # 获取所有集合
            collections = await db.list_collection_names()

            # 过滤系统集合
            user_collections = [col for col in collections if not col.startswith('system.')]

            if not user_collections:
                logger.warning("没有找到用户集合")
                return None, 0, 0

            # 创建备份目录
            if backup_name is None:
                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                backup_name = f"eventcast_backup_{timestamp}"

            backup_path = self.backup_dir / backup_name
            backup_path.mkdir(exist_ok=True)

            logger.info(f"开始备份数据到: {backup_path}")
            logger.info(f"需要备份的集合: {', '.join(user_collections)}")

            total_docs = 0
            backed_collections = []

            # 备份每个集合
            for collection_name in user_collections:
                try:
                    docs_count = await self._backup_collection(
                        db, collection_name, backup_path
                    )
                    if docs_count is not None:
                        total_docs += docs_count
                        backed_collections.append(collection_name)
                        logger.info(f"  集合 {collection_name}: {docs_count} 条记录")
                except Exception as e:
                    logger.error(f"备份集合 {collection_name} 失败: {e}")

            # 创建备份信息文件
            backup_info = {
                "backup_name": backup_name,
                "backup_time": datetime.now().isoformat(),
                "collections": backed_collections,
                "total_documents": total_docs,
                "database": "eventcast",
                "backup_version": "1.0"
            }

            info_file = backup_path / "backup_info.json"
            with open(info_file, 'w', encoding='utf-8') as f:
                json.dump(backup_info, f, ensure_ascii=False, indent=2)

            logger.info(f"备份完成: {len(backed_collections)} 个集合，{total_docs} 条记录")

            # 压缩备份目录
            compressed_file = await self._compress_backup(backup_path)

            # 清理原始备份目录
            shutil.rmtree(backup_path)

            return compressed_file, len(backed_collections), total_docs

        except Exception as e:
            logger.error(f"备份所有集合失败: {e}")
            raise

    async def _backup_collection(self, db, collection_name: str, backup_path: Path):
        """
        备份单个集合

        Args:
            db: 数据库实例
            collection_name: 集合名称
            backup_path: 备份目录

        Returns:
            int: 备份的文档数
        """
        try:
            collection = db[collection_name]

            # 查询所有文档
            cursor = collection.find({})
            documents = await cursor.to_list(None)

            if not documents:
                logger.debug(f"集合 {collection_name} 为空，跳过备份")
                return 0

            # 转换ObjectId为字符串
            for doc in documents:
                if '_id' in doc:
                    doc['_id'] = str(doc['_id'])

            # 保存为JSON文件
            backup_file = backup_path / f"{collection_name}.json"
            with open(backup_file, 'w', encoding='utf-8') as f:
                json.dump(documents, f, ensure_ascii=False, indent=2)

            return len(documents)

        except Exception as e:
            logger.error(f"备份集合 {collection_name} 时出错: {e}")
            raise

    async def _compress_backup(self, backup_path: Path):
        """
        压缩备份目录

        Args:
            backup_path: 备份目录

        Returns:
            str: 压缩文件路径
        """
        try:
            # 创建压缩文件名
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            zip_filename = f"{backup_path.name}.zip"
            zip_path = self.backup_dir / zip_filename

            # 使用shutil创建ZIP文件
            shutil.make_archive(
                str(zip_path).replace('.zip', ''),  # 去掉扩展名
                'zip',
                str(backup_path)
            )

            logger.info(f"备份已压缩为: {zip_path}")

            return str(zip_path)

        except Exception as e:
            logger.error(f"压缩备份失败: {e}")
            raise

    async def backup_using_mongodump(self, backup_name: str = None):
        """
        使用mongodump工具备份

        Args:
            backup_name: 备份名称

        Returns:
            str: 备份文件路径
        """
        try:
            # 获取数据库URI
            db_uri = get_database_uri()

            # 创建备份目录
            if backup_name is None:
                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                backup_name = f"mongodump_backup_{timestamp}"

            backup_path = self.backup_dir / backup_name

            # 构建mongodump命令
            # 从URI中提取数据库名称
            db_name = "eventcast"
            if "eventcast" in db_uri:
                # 从URI中解析数据库名
                import urllib.parse
                parsed = urllib.parse.urlparse(db_uri)
                if parsed.path:
                    db_name = parsed.path.strip('/')

            # 构建命令
            cmd = [
                "mongodump",
                f"--db={db_name}",
                f"--out={backup_path}"
            ]

            # 如果是远程MongoDB，添加URI
            if "localhost" not in db_uri and "127.0.0.1" not in db_uri:
                cmd.insert(1, f"--uri={db_uri}")

            logger.info(f"执行mongodump命令: {' '.join(cmd)}")

            # 执行命令
            result = subprocess.run(  # nosec B603
                cmd,
                capture_output=True,
                text=True,
                timeout=300  # 5分钟超时
            )

            if result.returncode == 0:
                logger.info("mongodump备份成功")

                # 压缩备份
                compressed_file = await self._compress_backup(backup_path)

                # 清理原始备份目录
                shutil.rmtree(backup_path)

                return compressed_file
            else:
                logger.error(f"mongodump备份失败: {result.stderr}")
                raise Exception(f"mongodump失败: {result.stderr}")

        except subprocess.TimeoutExpired:
            logger.error("mongodump执行超时")
            raise
        except FileNotFoundError:
            logger.error("mongodump命令未找到，请确保MongoDB工具已安装")
            raise
        except Exception as e:
            logger.error(f"使用mongodump备份失败: {e}")
            raise

    async def list_backups(self):
        """
        列出所有备份文件

        Returns:
            List[Dict]: 备份文件列表
        """
        try:
            backups = []

            for file in self.backup_dir.glob("*.zip"):
                stat = file.stat()
                backups.append({
                    'name': file.name,
                    'path': str(file),
                    'size': stat.st_size,
                    'modified': datetime.fromtimestamp(stat.st_mtime).isoformat(),
                    'size_human': self._format_size(stat.st_size)
                })

            # 按修改时间排序
            backups.sort(key=lambda x: x['modified'], reverse=True)

            return backups

        except Exception as e:
            logger.error(f"列出备份文件失败: {e}")
            return []

    def _format_size(self, size_bytes: int) -> str:
        """
        格式化文件大小

        Args:
            size_bytes: 字节数

        Returns:
            str: 格式化的大小
        """
        for unit in ['B', 'KB', 'MB', 'GB']:
            if size_bytes < 1024.0:
                return f"{size_bytes:.2f} {unit}"
            size_bytes /= 1024.0
        return f"{size_bytes:.2f} TB"

    async def restore_backup(self, backup_file: str, restore_method: str = "json"):
        """
        从备份恢复数据

        Args:
            backup_file: 备份文件路径
            restore_method: 恢复方法 (json/mongorestore)
        """
        try:
            backup_path = Path(backup_file)

            if not backup_path.exists():
                logger.error(f"备份文件不存在: {backup_file}")
                return False

            logger.warning(f"⚠️  警告：即将从备份恢复数据，这将会覆盖现有数据！")
            logger.warning(f"备份文件: {backup_file}")
            logger.warning(f"恢复方法: {restore_method}")

            # 确认操作
            confirmation = input("确认恢复数据？(输入 'yes' 继续): ")
            if confirmation.lower() != 'yes':
                logger.info("恢复操作已取消")
                return False

            if restore_method == "json":
                return await self._restore_from_json(backup_path)
            elif restore_method == "mongorestore":
                return await self._restore_with_mongorestore(backup_path)
            else:
                logger.error(f"不支持的恢复方法: {restore_method}")
                return False

        except Exception as e:
            logger.error(f"恢复备份失败: {e}")
            return False

    async def _restore_from_json(self, backup_path: Path):
        """
        从JSON文件恢复数据

        Args:
            backup_path: 备份文件路径
        """
        try:
            # 解压备份文件
            extract_dir = self.backup_dir / "temp_restore"
            extract_dir.mkdir(exist_ok=True)

            # 解压ZIP文件
            import zipfile
            with zipfile.ZipFile(backup_path, 'r') as zip_ref:
                zip_ref.extractall(extract_dir)

            db = await get_database()

            # 查找备份信息文件
            info_file = extract_dir / "backup_info.json"
            if info_file.exists():
                with open(info_file, 'r', encoding='utf-8') as f:
                    backup_info = json.load(f)

                collections = backup_info.get('collections', [])
                logger.info(f"从备份信息中找到 {len(collections)} 个集合")
            else:
                # 如果没有备份信息，查找所有JSON文件
                collections = []
                for json_file in extract_dir.glob("*.json"):
                    if json_file.name != "backup_info.json":
                        collections.append(json_file.stem)

            # 恢复每个集合
            restored_count = 0
            for collection_name in collections:
                json_file = extract_dir / f"{collection_name}.json"

                if json_file.exists():
                    try:
                        await self._restore_collection(db, collection_name, json_file)
                        restored_count += 1
                        logger.info(f"  恢复集合: {collection_name}")
                    except Exception as e:
                        logger.error(f"  恢复集合 {collection_name} 失败: {e}")
                else:
                    logger.warning(f"  集合 {collection_name} 的备份文件不存在")

            # 清理临时目录
            shutil.rmtree(extract_dir)

            logger.info(f"数据恢复完成，恢复了 {restored_count} 个集合")
            return True

        except Exception as e:
            logger.error(f"从JSON恢复数据失败: {e}")
            return False

    async def _restore_collection(self, db, collection_name: str, json_file: Path):
        """
        恢复单个集合

        Args:
            db: 数据库实例
            collection_name: 集合名称
            json_file: JSON文件路径
        """
        try:
            # 读取JSON文件
            with open(json_file, 'r', encoding='utf-8') as f:
                documents = json.load(f)

            if not documents:
                logger.debug(f"集合 {collection_name} 的备份为空")
                return

            # 清空现有集合
            collection = db[collection_name]
            await collection.delete_many({})

            # 插入备份数据
            if documents:
                await collection.insert_many(documents)

            logger.debug(f"集合 {collection_name} 恢复完成: {len(documents)} 条记录")

        except Exception as e:
            logger.error(f"恢复集合 {collection_name} 失败: {e}")
            raise

    async def _restore_with_mongorestore(self, backup_path: Path):
        """
        使用mongorestore工具恢复

        Args:
            backup_path: 备份文件路径
        """
        try:
            # 获取数据库URI
            db_uri = get_database_uri()

            # 提取数据库名称
            db_name = "eventcast"

            # 解压备份文件到临时目录
            extract_dir = self.backup_dir / "temp_mongorestore"
            extract_dir.mkdir(exist_ok=True)

            import zipfile
            with zipfile.ZipFile(backup_path, 'r') as zip_ref:
                zip_ref.extractall(extract_dir)

            # 查找bson备份目录
            bson_dir = None
            for item in extract_dir.iterdir():
                if item.is_dir() and (item / "eventcast").exists():
                    bson_dir = item / "eventcast"
                    break

            if not bson_dir:
                logger.error("未找到BSON备份目录")
                return False

            # 构建mongorestore命令
            cmd = [
                "mongorestore",
                f"--db={db_name}",
                str(bson_dir)
            ]

            # 如果是远程MongoDB，添加URI
            if "localhost" not in db_uri and "127.0.0.1" not in db_uri:
                cmd.insert(1, f"--uri={db_uri}")

            logger.info(f"执行mongorestore命令: {' '.join(cmd)}")

            # 执行命令
            result = subprocess.run(  # nosec B603
                cmd,
                capture_output=True,
                text=True,
                timeout=300  # 5分钟超时
            )

            # 清理临时目录
            shutil.rmtree(extract_dir)

            if result.returncode == 0:
                logger.info("mongorestore恢复成功")
                return True
            else:
                logger.error(f"mongorestore恢复失败: {result.stderr}")
                return False

        except subprocess.TimeoutExpired:
            logger.error("mongorestore执行超时")
            return False
        except FileNotFoundError:
            logger.error("mongorestore命令未找到，请确保MongoDB工具已安装")
            return False
        except Exception as e:
            logger.error(f"使用mongorestore恢复失败: {e}")
            return False

    async def cleanup_old_backups(self, keep_days: int = 30):
        """
        清理旧的备份文件

        Args:
            keep_days: 保留天数
        """
        try:
            import time

            cutoff_time = time.time() - (keep_days * 24 * 60 * 60)
            deleted_count = 0

            for file in self.backup_dir.glob("*.zip"):
                if file.stat().st_mtime < cutoff_time:
                    try:
                        file.unlink()
                        deleted_count += 1
                        logger.info(f"删除旧备份: {file.name}")
                    except Exception as e:
                        logger.error(f"删除备份文件 {file.name} 失败: {e}")

            logger.info(f"清理完成，删除了 {deleted_count} 个旧备份")
            return deleted_count

        except Exception as e:
            logger.error(f"清理旧备份失败: {e}")
            return 0


async def main():
    """
    主函数
    """
    import argparse

    parser = argparse.ArgumentParser(description="EventCast-MQTT 数据备份工具")
    parser.add_argument("action", choices=["backup", "list", "restore", "cleanup"],
                        help="执行的操作")
    parser.add_argument("--method", choices=["json", "mongodump"], default="json",
                        help="备份方法 (默认: json)")
    parser.add_argument("--backup-dir", default="./backups",
                        help="备份目录 (默认: ./backups)")
    parser.add_argument("--backup-name",
                        help="备份名称 (默认自动生成)")
    parser.add_argument("--restore-file",
                        help="要恢复的备份文件")
    parser.add_argument("--restore-method", choices=["json", "mongorestore"], default="json",
                        help="恢复方法 (默认: json)")
    parser.add_argument("--keep-days", type=int, default=30,
                        help="保留备份的天数 (默认: 30)")

    args = parser.parse_args()

    # 配置日志
    setup_logging(log_level="INFO", console_output=True)

    logger.info("=== EventCast-MQTT 数据备份工具 ===")

    try:
        backup_tool = DataBackup(backup_dir=args.backup_dir)

        if args.action == "backup":
            logger.info(f"开始备份数据，方法: {args.method}")

            if args.method == "json":
                result = await backup_tool.backup_all_collections(args.backup_name)
                if result:
                    backup_file, collections, docs = result
                    logger.info(f"备份成功: {backup_file}")
                    logger.info(f"备份了 {collections} 个集合，{docs} 条记录")
            else:  # mongodump
                backup_file = await backup_tool.backup_using_mongodump(args.backup_name)
                logger.info(f"mongodump备份成功: {backup_file}")

        elif args.action == "list":
            logger.info("列出备份文件...")
            backups = await backup_tool.list_backups()

            if backups:
                logger.info(f"找到 {len(backups)} 个备份文件:")
                for i, backup in enumerate(backups, 1):
                    logger.info(f"{i:2d}. {backup['name']}")
                    logger.info(f"     大小: {backup['size_human']}, 修改时间: {backup['modified']}")
            else:
                logger.info("没有找到备份文件")

        elif args.action == "restore":
            if not args.restore_file:
                logger.error("恢复操作需要指定 --restore-file 参数")
                sys.exit(1)

            logger.info(f"开始恢复备份: {args.restore_file}")
            success = await backup_tool.restore_backup(
                args.restore_file,
                args.restore_method
            )

            if success:
                logger.info("恢复成功")
            else:
                logger.error("恢复失败")
                sys.exit(1)

        elif args.action == "cleanup":
            logger.info(f"清理超过 {args.keep_days} 天的旧备份...")
            deleted = await backup_tool.cleanup_old_backups(args.keep_days)
            logger.info(f"清理完成，删除了 {deleted} 个旧备份")

        logger.info("操作完成")

    except KeyboardInterrupt:
        logger.info("\n用户中断操作")
        sys.exit(0)
    except Exception as e:
        logger.error(f"操作失败: {e}")
        sys.exit(1)


if __name__ == "__main__":
    # 运行异步主函数
    asyncio.run(main())