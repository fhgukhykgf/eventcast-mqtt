# EventCast-MQTT 部署指南

## 系统要求

### 最低配置
- **CPU**: 1核
- **内存**: 2GB
- **磁盘**: 20GB
- **操作系统**: Ubuntu 20.04 / CentOS 7+

### 推荐配置
- **CPU**: 2核
- **内存**: 4GB
- **磁盘**: 50GB
- **操作系统**: Ubuntu 22.04 LTS

---

## 环境准备

### 1. 安装 Python 3.9+

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install python3.9 python3.9-dev python3-pip

# CentOS/RHEL
sudo yum install python39 python39-devel

# 验证安装
python3.9 --version
pip3 --version
```

### 2. 安装 MongoDB 5.0+

```bash
# Ubuntu 20.04
wget -qO - https://www.mongodb.org/static/pgp/server-5.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/5.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-5.0.list
sudo apt update
sudo apt install -y mongodb-org

# 启动服务
sudo systemctl start mongod
sudo systemctl enable mongod

# 验证安装
mongod --version
```

### 3. 安装 EMQX 4.4+

```bash
# Ubuntu/Debian
curl -s https://assets.emqx.com/scripts/install-emqx-deb.sh | sudo bash
sudo apt-get install emqx

# 启动服务
sudo systemctl start emqx
sudo systemctl enable emqx

# 验证安装
emqx version
```

### 4. 安装 Nginx

```bash
# Ubuntu/Debian
sudo apt install nginx

# CentOS/RHEL
sudo yum install nginx

# 启动服务
sudo systemctl start nginx
sudo systemctl enable nginx
```

---

## 部署步骤

### 1. 克隆仓库

```bash
git clone https://github.com/fhgukhykgf/eventcast-mqtt.git
cd eventcast-mqtt
```

### 2. 安装 Python 依赖

```bash
pip install -r requirements.txt
```

### 3. 配置环境变量

```bash
cp .env.example .env
# 编辑 .env 文件，按实际环境填写以下关键配置：
#   MONGODB_URI     - MongoDB 连接地址
#   MQTT_BROKER     - EMQX 服务器地址
#   MQTT_USERNAME   - EMQX 账号
#   MQTT_PASSWORD   - EMQX 密码
#   SECRET_KEY      - JWT 签名密钥（生产环境必须修改）
```

### 4. 初始化数据库

```bash
cd backend
python scripts/init_database.py
```

### 5. 启动后端服务

```bash
# 开发模式（热重载）
cd backend
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload

# 生产模式（多进程）
cd backend
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

也可以使用根目录的一键启动脚本：

```bash
bash run.sh
```

### 6. 配置 Nginx 反向代理

创建配置文件 `/etc/nginx/conf.d/eventcast.conf`：

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Web 管理后台
    location /admin {
        alias /path/to/eventcast-mqtt/webadmin;
        index dashboard.html;
        try_files $uri $uri/ /admin/dashboard.html;
    }

    # 后端 API
    location /api {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

重载 Nginx：

```bash
sudo nginx -t
sudo systemctl reload nginx
```

---

## 生产环境注意事项

- **修改默认密码**：`.env` 中的 `SECRET_KEY` 必须替换为随机强密钥
- **EMQX 认证**：建议在 EMQX 控制台启用 ACL 和客户端认证
- **HTTPS**：生产环境建议通过 Let's Encrypt 配置 SSL 证书
- **防火墙**：仅对外开放 80/443 端口，8000 端口仅限本机访问
- **日志目录**：确保 `backend/logs/` 目录有写权限

---

## 验证部署

```bash
# 检查后端健康状态
curl http://localhost:8000/api/health

# 访问 API 文档
# 浏览器打开 http://your-domain.com:8000/docs
```
