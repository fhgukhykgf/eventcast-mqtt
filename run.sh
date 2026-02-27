#!/bin/bash
# 一键启动脚本

echo "🚀 启动 EventCast-MQTT 服务..."

cd $(dirname $0)

# 检查Python
if ! command -v python3 &> /dev/null; then
    echo "❌ 未找到 Python3"
    exit 1
fi

# 检查MongoDB
if ! command -v mongod &> /dev/null; then
    echo "⚠️  MongoDB未安装，请先安装"
fi

# 检查EMQX
if ! command -v emqx &> /dev/null; then
    echo "⚠️  EMQX未安装，MQTT功能可能不可用"
fi

# 安装依赖
echo "📦 安装依赖..."
pip install -r requirements.txt

# 初始化数据库
echo "🗄️  初始化数据库..."
python scripts/init_database.py

# 启动后端
echo "🌐 启动后端服务..."
cd backend
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload