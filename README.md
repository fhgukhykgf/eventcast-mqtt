# 活动快传 (EventCast MQTT)

<div align="center">
  <h3>🎯 轻量级校园活动管理系统</h3>
  <p>基于 MQTT 实现实时通信</p>
</div>

## 项目简介

**活动快传**是一个轻量级的校园活动管理系统，旨在解决传统活动管理中通知遗漏、签到缓慢、统计繁琐等痛点。系统基于 MQTT 通信协议构建，实现了实时消息推送，确保所有客户端能够即时收到更新。

### 核心功能

- 📱 **微信小程序**：活动浏览、报名、签到
- 🖥️ **Web管理后台**：活动管理、数据统计、签到管理
- 🔄 **实时通信**：基于 MQTT 的消息推送
- 📊 **数据统计**：活动报名、签到数据实时分析
- 🎯 **智能签到**：二维码扫码签到

## 技术栈

### 后端
- **FastAPI**：高性能异步Web框架
- **MongoDB**：NoSQL数据库
- **MQTT (EMQX)**：实时消息通信
- **Python 3.9+**：后端开发语言

### 前端
- **微信小程序**：用户端
- **HTML5 + CSS3 + JavaScript**：Web管理后台
- **Chart.js**：数据可视化

## 系统架构

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│  微信小程序       │       │  Web管理后台     │       │  MQTT客户端      │
└────────┬────────┘       └────────┬────────┘       └────────┬────────┘
         │                         │                         │
         ▼                         ▼                         ▼
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│  RESTful API    │◄──────┤  FastAPI后端     │──────►│  MQTT发布/订阅   │
└─────────────────┘       └─────────────────┘       └─────────────────┘
                                  │                         │
                                  ▼                         ▼
                         ┌─────────────────┐       ┌─────────────────┐
                         │  MongoDB数据库   │        │  EMQX MQTT代理   │
                         └─────────────────┘       └─────────────────┘
```

## 目录结构

```
eventcast-mqtt/
├── backend/              # 后端代码
│   ├── api/              # API路由
│   ├── models/           # 数据模型
│   ├── utils/            # 工具函数
│   ├── scripts/          # 初始化脚本
│   ├── main.py           # 主应用入口
│   └── requirements.txt  # 依赖包
├── webadmin/             # Web管理后台
│   ├── css/              # 样式文件
│   ├── dashboard.html    # 数据看板
│   ├── events.html       # 活动管理
│   ├── attendees.html    # 报名人员管理
│   ├── qrcode.html       # 签到二维码
│   └── config.js         # 配置文件
├── frontend/             # 微信小程序
├── .env.example          # 环境变量示例
├── LICENSE               # 许可证
└── README.md             # 项目说明
```

## 快速开始

### 1. 环境准备

- **MongoDB**：安装并启动MongoDB服务
- **EMQX**：安装并启动EMQX MQTT代理
- **Python 3.9+**：安装Python环境
- **微信开发者工具**：用于加载小程序项目

### 2. 安装部署

#### 克隆仓库

```bash
git clone https://github.com/fhgukhykgf/eventcast-mqtt.git
cd eventcast-mqtt
```

#### 安装依赖

```bash
pip install -r backend/requirements.txt
```

#### 配置环境变量

```bash
cp .env.example .env
# 编辑.env文件，配置数据库和MQTT连接信息
```

#### 初始化数据库

```bash
cd backend
python scripts/init_database.py
```

#### 启动后端服务

```bash
cd backend
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### 3. 访问系统

#### Web管理后台
- 直接打开 `webadmin/dashboard.html` 文件
- 或配置Nginx反向代理（推荐）

#### 微信小程序
- 使用微信开发者工具加载 `frontend` 目录
- 修改 `app.js` 中的 `baseUrl` 为你的服务器地址

## Nginx配置示例

```nginx
# /etc/nginx/conf.d/eventcast.conf
server {
    listen 80;
    server_name your-domain.com;
    
    location /admin {
        alias /path/to/eventcast-mqtt/webadmin;
        index dashboard.html;
        try_files $uri $uri/ /admin/index.html;
    }
    
    location /api {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 默认账号

| 角色 | 用户名 | 密码 | 说明 |
|------|--------|------|------|
| 学生 | student01 | 123456 | 测试学生账号 |
| 学生 | student02 | 123456 | 测试学生账号 |
| 组织者 | organizer01 | 123456 | 可创建管理活动 |
| 管理员 | admin | admin123 | 系统管理员 |

## MQTT主题结构

- `event/{event_id}/notice`：活动相关通知（创建、更新、提醒）
- `event/{event_id}/sign_in`：实时签到数据同步
- `system/broadcast`：系统级广播

## 数据库设计

### 活动表
- 存储活动的基本信息，如标题、时间、地点、组织者、人数限制等

### 用户表
- 存储用户的登录信息、个人资料和角色权限

### 报名表
- 记录用户对活动的报名情况

### 签到表
- 记录用户的签到时间和方式

## 项目截图

> 注：项目截图请自行替换为实际界面截图

| 模块 | 说明 |
|------|------|
| 数据看板 | 展示活动统计、报名数据、签到率等 |
| 活动管理 | 活动列表、创建、编辑、取消 |
| 报名管理 | 查看报名人员、签到状态 |
| 小程序端 | 活动浏览、报名、扫码签到 |

## 贡献指南

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件

## 联系方式

- 项目链接：https://github.com/fhgukhykgf/eventcast-mqtt

---

**活动快传** - 让校园活动管理更简单、更高效！ 🎯