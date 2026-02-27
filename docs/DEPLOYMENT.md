
## 文件：docs/DEPLOYMENT.md
```markdown
# EventCast-MQTT 部署指南

## 系统要求

### 最低配置
- **CPU**: 1核
- **内存**: 2GB
- **磁盘**: 20GB
- **操作系统**: Ubuntu 20.04/CentOS 7+

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

2. 安装 MongoDB 5.0+
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
3. 安装 EMQ X 4.4+
# Ubuntu/Debian
curl -s https://assets.emqx.com/scripts/install-emqx-deb.sh | sudo bash
sudo apt-get install emqx

# 启动服务
sudo systemctl start emqx
sudo systemctl enable emqx

# 验证安装
emqx version

4. 安装 Nginx
# Ubuntu/Debian
sudo apt install nginx

# CentOS/RHEL
sudo yum install nginx

# 启动服务
sudo systemctl start nginx
sudo systemctl enable nginx

5. 安装 Node.js (用于Web管理端)
# 使用 nvm 安装
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 18
nvm use 18

# 验证安装
node --version
npm --version