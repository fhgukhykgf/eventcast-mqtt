# EventCast-MQTT · 活动快传

🎯 **轻量化校园活动管理系统** - 解决活动管理中"通知漏、签到慢、统计繁"的核心痛点

[![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com)
[![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb)](https://www.mongodb.com)
[![EMQX](https://img.shields.io/badge/EMQX-009688?style=for-the-badge&logo=eclipse-mosquitto)](https://www.emqx.io)
[![微信小程序](https://img.shields.io/badge/微信小程序-07C160?style=for-the-badge&logo=wechat)](https://developers.weixin.qq.com/miniprogram/dev/framework/)

---

## 📋 项目简介

EventCast-MQTT 是一款面向校园活动的轻量化管理系统，专注于讲座、社团招新、小型运动会等场景，提供"简易通知+扫码签到+基础统计"一体化功能。

### ✨ 核心功能

| 模块 | 功能 | 说明 |
|------|------|------|
| **用户管理** | 登录/注册 | 支持学生、教师、组织者多角色 |
| | 个人信息 | 查看个人资料和统计数据 |
| **活动管理** | 创建活动 | 组织者可创建活动（Web端） |
| | 活动列表 | 查看所有活动及状态 |
| | 活动详情 | 查看活动详细信息 |
| **签到系统** | 扫码签到 | 动态二维码，30秒刷新 |
| | 报名功能 | 一键报名/取消报名 |
| | 签到状态 | 实时查看签到状态 |
| **数据统计** | 实时看板 | 报名人数、签到人数、签到率 |
| | 数据导出 | Excel格式导出签到记录 |
| **消息通知** | MQTT推送 | 基于MQTT的实时通知 |

---

## 🚀 快速开始

### 环境要求

- Python 3.9+
- MongoDB 5.0+
- EMQ X 4.4+ (可选，用于MQTT通知)
- Node.js 16+ (用于小程序开发)

### 一键部署

```bash
# 1. 克隆项目
git clone https://github.com/your-repo/eventcast-mqtt.git
cd eventcast-mqtt

# 2. 安装依赖
pip install -r requirements.txt

# 3. 配置环境变量
cp .env.example .env
# 编辑 .env 文件，修改数据库连接等配置

# 4. 初始化数据库
python scripts/init_database.py
python scripts/create_admin.py

# 5. 启动服务
./run.sh

📁 目录结构
eventcast-mqtt/
├── backend/                          # 后端服务
│   ├── main.py                       # 主程序入口
│   ├── api/                          # API接口
│   │   ├── events.py                  # 活动管理
│   │   ├── signin.py                   # 签到管理
│   │   └── users.py                    # 用户管理
│   ├── models/                        # 数据模型
│   │   ├── event.py                    # 活动模型
│   │   ├── signin.py                   # 签到模型
│   │   └── user.py                     # 用户模型
│   └── utils/                         # 工具函数
│       ├── database.py                 # 数据库连接
│       └── mqtt_client.py              # MQTT客户端
│
├── frontend/                          # 微信小程序
│   ├── pages/                          # 页面
│   │   ├── index/                       # 首页
│   │   ├── login/                       # 登录页
│   │   ├── events/                      # 活动列表
│   │   ├── event-detail/                # 活动详情
│   │   ├── signin/                      # 签到页
│   │   └── profile/                     # 个人中心
│   ├── utils/                          # 工具函数
│   └── app.js                          # 小程序入口
│
├── webadmin/                          # Web管理端
│   ├── dashboard.html                   # 数据看板
│   ├── events.html                       # 活动管理
│   └── stats.html                        # 详细统计
│
├── scripts/                           # 运维脚本
│   ├── init_database.py                 # 数据库初始化
│   └── create_admin.py                  # 创建管理员
│
├── requirements.txt                   # Python依赖
├── .env.example                       # 环境变量示例
└── run.sh                             # 一键启动脚本

🔧 配置说明
环境变量 (.env)
# MongoDB配置
MONGODB_URI=mongodb://localhost:27017/eventcast

# MQTT配置
MQTT_BROKER=localhost
MQTT_PORT=1883
MQTT_USERNAME=admin
MQTT_PASSWORD=public

# 后端配置
BACKEND_HOST=0.0.0.0
BACKEND_PORT=8000
DEBUG=true

Nginx配置 (Web管理端)
# /etc/nginx/conf.d/eventcast.conf
server {
    listen 80;
    server_name your-domain.com;
    
    location /admin {
        alias /path/to/eventcast-mqtt/webadmin;
        index dashboard.html;
        try_files $uri $uri/ /admin/dashboard.html;
    }
    
    location /api {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
📱 小程序使用
开发环境配置
打开微信开发者工具

导入项目：/path/to/eventcast-mqtt/frontend

修改 app.js 中的 baseUrl 为你的后端地址

点击「编译」预览
真机调试
// app.js
globalData: {
    baseUrl: 'http://你的电脑IP:8000/api',  // 手机和电脑在同一WiFi
    // ...
}

👥 默认账号
角色	用户名	密码	说明
学生	20230001	123456	普通用户
学生	20230002	123456	普通用户
组织者	O2023001	123456	可创建活动
管理员	admin	admin123	系统管理
📊 API概览
用户相关
方法	路径	说明
POST	/api/users/register	用户注册
POST	/api/users/login	用户登录
GET	/api/users/info/{user_id}	获取用户信息
GET	/api/users/statistics/{user_id}	获取用户统计
活动相关
方法	路径	说明
POST	/api/events/create	创建活动
GET	/api/events/list	获取活动列表
GET	/api/events/detail/{event_id}	获取活动详情
PUT	/api/events/update/{event_id}	更新活动
DELETE	/api/events/delete/{event_id}	删除活动
签到相关
方法	路径	说明
POST	/api/sign/apply	报名活动
POST	/api/sign/cancel	取消报名
POST	/api/sign/in	签到
GET	/api/sign/status/{event_id}/{user_id}	获取签到状态
GET	/api/sign/records/{event_id}	获取签到记录
GET	/api/sign/count/{event_id}	获取签到计数

🛠️ 运维管理
健康检查
bash
# 检查服务状态
curl http://localhost:8000/api/health
查看日志
bash
# 后端日志
tail -f backend/logs/app.log

# MongoDB日志
tail -f /var/log/mongodb/mongod.log

数据备份
bash
# 手动备份MongoDB
mongodump --db eventcast --out ./backups/$(date +%Y%m%d)

❓ 常见问题
1. 无法连接后端
检查后端是否运行：ps aux | grep uvicorn

python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
检查端口：netstat -tlnp | grep 8000

检查防火墙：systemctl status firewalld

2. 小程序预览失败
确认 baseUrl 配置正确

开发者工具中勾选「不校验合法域名」

手机和电脑在同一网络

3. 登录提示密码错误
使用默认账号：20230001 / 123456

重新初始化数据库：python scripts/init_database.py

4. MQTT消息不推送
检查EMQX服务：systemctl status emqx

检查配置：.env 中的MQTT配置

📄 许可证
本项目采用 MIT 许可证，仅供学习交流使用。

🤝 贡献指南
Fork 项目

创建功能分支 (git checkout -b feature/amazing)

提交更改 (git commit -m 'feat: add amazing feature')

推送到分支 (git push origin feature/amazing)

创建 Pull Request

📞 联系我们
问题反馈：issues@eventcast.com

技术支持：support@eventcast.com

项目主页：https://github.com/your-repo/eventcast-mqtt

⭐ 如果这个项目对你有帮助，欢迎 Star！

text
