## 中文简介

团队致力于开发一个轻量级的校园活动管理系统——**活动快传**。由于传统活动管理存在通知遗漏、签到缓慢、统计繁琐等痛点，我们选择基于高效的 MQTT 通信协议构建项目。目前已经实现了完整的小程序界面、Web管理后台以及后端逻辑。对于活动相关的实时通信，我们开发了基于 MQTT 的消息推送层，确保所有客户端能够即时收到更新。

### 架构设计

在这个项目中，我们采用经典的前后端分离方式，并结合 MQTT 实时消息架构。前端界面（微信小程序和 Web 管理端）在启动或页面展示时通过 RESTful API 从后端数据库获取数据。对于需要实时更新的操作——如新活动创建、用户签到或状态变更——我们利用 MQTT 进行即时推送。

架构包含三个主要组件：

- **后端 API (FastAPI)**：处理数据检索和操作的标准 RESTful 请求
- **MQTT 代理 (EMQX)**：管理向订阅客户端分发的实时消息
- **MQTT 客户端 (Python/paho-mqtt)**：集成在后端，用于发布事件消息

这种设计确保所有用户无需轮询即可获得实时更新，显著降低服务器负载并提升响应速度。后端与 MQTT 代理之间的通信采用 MQTT 的发布/订阅模型，轻量且安全。

### 数据库

我们设计了以下四个表来存储业务数据：

1. **活动表**：存储活动的基本信息，如标题、时间、地点、组织者、人数限制等
2. **用户表**：存储用户的登录信息、个人资料和角色权限
3. **报名表**：记录用户对活动的报名情况
4. **签到表**：记录用户的签到时间和方式

### MQTT通信

在物联网通信中，MQTT 是大部分人的首选。该协议采用发布/订阅模式，只有订阅了特定主题的客户端才能收到相应消息，所有通信都通过 MQTT 服务器进行中转，这提高了安全性和传输效率。基于此，我们将 MQTT 集成到活动管理系统中，为活动创建、签到和通知提供实时更新能力。

我们的 MQTT 主题结构如下：

- `event/{event_id}/notice`：用于活动相关通知（创建、更新、提醒）
- `event/{event_id}/sign_in`：用于实时签到数据同步
- `system/broadcast`：用于系统级广播

当组织者创建新活动时，后端向相应主题发布消息，所有订阅的用户会立即收到通知。同样，当用户签到时，组织者的看板上的签到人数会实时更新。

### 小程序设计

我们为微信小程序设计了五个主要页面：

- `首页`：展示即将开始的活动和快捷操作入口
- `登录页`：用户认证（登录/注册）
- `活动列表页`：浏览所有活动，支持筛选
- `活动详情页`：查看特定活动的详细信息
- `签到页`：二维码扫码和手动签到界面
- `个人中心`：用户资料、统计数据和设置

### Web管理端设计

针对组织者和管理员，我们提供了一个基于 Web 的管理后台，包含以下部分：

- `数据看板`：实时统计数据和图表（总活动数、签到数、趋势）
- `活动管理`：创建、编辑、删除和查看所有活动
- `详细统计`：深入分析签到模式和热门活动
- `签到二维码`：为活动生成动态二维码

## 快速开始

1. 首先安装以下依赖

   - [MongoDB](https://www.mongodb.com/) 作为项目数据库
   - [EMQX](https://www.emqx.io/zh) 帮助我们搭建 MQTT 服务器
   - [Python 3.9+](https://www.python.org/) 运行后端服务
   - [微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html) 加载小程序项目

2. 克隆我们的仓库或下载发布的代码

   bash

   ```
   
   git clone https://github.com/fhgukhykgf/eventcast-mqtt.git

   ```
   

3. 安装 Python 依赖并配置环境

   bash

   ```
   pip install -r requirements.txt
   cp .env.example .env
   # 编辑 .env 文件，配置数据库和 MQTT 连接信息
   ```

   

4. 初始化数据库

   bash

   ```
   python scripts/init_database.py
   python scripts/create_admin.py
   ```

   

5. 启动后端服务

   bash

   ```
   cd backend
   python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
   ```
   

6. 使用微信开发者工具加载小程序项目（`/frontend` 目录），修改 `app.js` 中的 `baseUrl` 为你的服务器地址

7. 通过浏览器访问 Web 管理端（需配置 Nginx 或直接打开 HTML 文件）

Nginx配置 (Web管理端)
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

👥 默认账号
角色	用户名	密码	说明
学生	20230001	123456	普通用户
学生	20230002	123456	普通用户
组织者	O2023001	123456	可创建活动
管理员	admin	admin123	系统管理


## 许可证

This project is licensed under the [MIT License](https://opensource.org/license/MIT) - see the [LICENSE](https://license/) file for details.









