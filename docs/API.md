# EventCast-MQTT API 接口文档

## 基础信息

- **基础URL**: `http://your-domain.com/api` 或 `http://localhost:8000/api`
- **响应格式**: JSON
- **字符编码**: UTF-8
- **认证方式**: Bearer Token（JWT），登录后在请求头中携带：
  ```
  Authorization: Bearer <token>
  ```

### 通用响应格式

```json
{
    "code": 200,
    "msg": "success",
    "data": {}
}
```

### 状态码说明

| 状态码 | 说明 |
|--------|------|
| 200 | 成功 |
| 400 | 请求参数错误 |
| 401 | 未授权/登录过期 |
| 403 | 禁止访问/权限不足 |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |

---

## 1. 用户管理接口

前缀：`/api/users`

### 1.1 获取验证码

- **URL**: `/users/captcha`
- **方法**: `GET`
- **权限**: 公开

**响应示例**:

```json
{
    "code": 200,
    "data": {
        "captcha_id": "uuid-string",
        "captcha_image": "data:image/png;base64,..."
    }
}
```

---

### 1.2 用户注册

- **URL**: `/users/register`
- **方法**: `POST`
- **权限**: 公开
- **说明**: 注册后角色固定为 `student`，忽略请求中的 role 字段

**请求参数**:

```json
{
    "user_id": "20230001",
    "username": "zhangsan",
    "password": "123456",
    "confirmPassword": "123456",
    "real_name": "张三",
    "email": "zhangsan@example.com",
    "phone": "13800138001"
}
```

**响应示例**:

```json
{
    "code": 200,
    "msg": "注册成功",
    "data": {
        "user_info": {
            "user_id": "20230001",
            "username": "zhangsan",
            "real_name": "张三",
            "email": "zhangsan@example.com",
            "phone": "13800138001",
            "role": "student"
        },
        "token": "eyJhbGciOiJIUzI1NiIs..."
    }
}
```

---

### 1.3 用户登录

- **URL**: `/users/login`
- **方法**: `POST`
- **权限**: 公开
- **说明**: Web管理后台登录需携带 `captcha_id` 和 `captcha_code`；微信小程序登录无需验证码

**请求参数**:

```json
{
    "identifier": "20230001",
    "password": "123456",
    "captcha_id": "uuid-string",
    "captcha_code": "ab3d"
}
```

**响应示例**:

```json
{
    "code": 200,
    "msg": "登录成功",
    "data": {
        "user_info": {
            "user_id": "20230001",
            "username": "zhangsan",
            "real_name": "张三",
            "email": "zhangsan@example.com",
            "phone": "13800138001",
            "role": "student"
        },
        "token": "eyJhbGciOiJIUzI1NiIs..."
    }
}
```

---

### 1.4 获取当前登录用户信息

- **URL**: `/users/me`
- **方法**: `GET`
- **权限**: 已登录用户

**响应示例**:

```json
{
    "code": 200,
    "data": {
        "user_id": "20230001",
        "username": "zhangsan",
        "real_name": "张三",
        "email": "zhangsan@example.com",
        "phone": "13800138001",
        "role": "student",
        "status": "active"
    }
}
```

---

### 1.5 获取用户信息

- **URL**: `/users/info/{user_id}`
- **方法**: `GET`
- **权限**: 本人、组织者或管理员

**响应示例**:

```json
{
    "code": 200,
    "data": {
        "user_id": "20230001",
        "username": "zhangsan",
        "real_name": "张三",
        "email": "zhangsan@example.com",
        "phone": "13800138001",
        "role": "student",
        "status": "active",
        "created_at": "2024-03-10T09:00:00",
        "last_login": "2024-03-15T13:00:00"
    }
}
```

---

### 1.6 获取用户统计

- **URL**: `/users/statistics/{user_id}`
- **方法**: `GET`
- **权限**: 本人、组织者或管理员

**响应示例**:

```json
{
    "code": 200,
    "data": {
        "apply_count": 15,
        "sign_count": 14,
        "sign_rate": "93.33%"
    }
}
```

---

### 1.7 获取用户列表

- **URL**: `/users/list`
- **方法**: `GET`
- **权限**: 管理员

**请求参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| skip | number | 否 | 跳过数量，默认0 |
| limit | number | 否 | 每页数量，默认50 |
| search | string | 否 | 搜索关键词（用户ID/用户名/真实姓名） |
| role | string | 否 | 角色筛选：student/organizer/admin |

**响应示例**:

```json
{
    "code": 200,
    "data": [
        {
            "user_id": "20230001",
            "username": "zhangsan",
            "real_name": "张三",
            "role": "student",
            "status": "active",
            "created_at": "2024-03-10T09:00:00",
            "last_login": "2024-03-15T13:00:00"
        }
    ],
    "total": 100
}
```

---

### 1.8 管理员创建用户

- **URL**: `/users/create`
- **方法**: `POST`
- **权限**: 管理员

**请求参数**:

```json
{
    "user_id": "20230002",
    "username": "lisi",
    "password": "123456",
    "real_name": "李四",
    "email": "lisi@example.com",
    "phone": "13800138002",
    "role": "student"
}
```

---

### 1.9 管理员更新用户

- **URL**: `/users/update/{user_id}`
- **方法**: `PUT`
- **权限**: 管理员

**请求参数**:

```json
{
    "real_name": "张三丰",
    "email": "new@example.com",
    "phone": "13800138002",
    "role": "organizer",
    "status": "active",
    "password": "newpassword"
}
```

---

### 1.10 切换用户状态（启用/禁用）

- **URL**: `/users/toggle-status/{user_id}`
- **方法**: `PUT`
- **权限**: 管理员
- **说明**: 自动在 `active` / `inactive` 之间切换，不能禁用自己

**响应示例**:

```json
{
    "code": 200,
    "msg": "状态已更新",
    "data": {"status": "inactive"}
}
```

---

### 1.11 管理员删除用户

- **URL**: `/users/delete/{user_id}`
- **方法**: `DELETE`
- **权限**: 管理员
- **说明**: 不能删除自己的账号

---

## 2. 活动管理接口

前缀：`/api/events`

### 2.1 创建活动

- **URL**: `/events/create`
- **方法**: `POST`
- **权限**: 组织者/管理员

**请求参数**:

```json
{
    "event_id": "lecture_001",
    "title": "Python编程入门讲座",
    "start_time": "2024-03-15 14:00",
    "end_time": "2024-03-15 16:00",
    "location": "教学楼301",
    "limit_num": 100,
    "description": "活动描述",
    "organizer": "计算机学院"
}
```

**响应示例**:

```json
{
    "code": 200,
    "msg": "活动创建成功",
    "event_id": "lecture_001"
}
```

---

### 2.2 获取活动列表

- **URL**: `/events/list`
- **方法**: `GET`
- **权限**: 公开（无需登录）
- **说明**: 学生仅返回基本字段；组织者/管理员额外返回 `apply_count`、`sign_count`、`sign_rate`

**请求参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| status | string | 否 | 活动状态：active/ended/cancelled |
| search | string | 否 | 搜索关键词（标题/地点） |
| skip | number | 否 | 跳过数量，默认0 |
| limit | number | 否 | 每页数量，默认20 |

**响应示例**:

```json
{
    "code": 200,
    "data": [
        {
            "event_id": "lecture_001",
            "title": "Python编程入门讲座",
            "time": "2024-03-15 14:00",
            "start_time": "2024-03-15 14:00",
            "end_time": "2024-03-15 16:00",
            "location": "教学楼301",
            "status": "active",
            "organizer": "计算机学院",
            "description": "活动描述"
        }
    ],
    "total": 50
}
```

---

### 2.3 获取活动详情

- **URL**: `/events/detail/{event_id}`
- **方法**: `GET`
- **权限**: 公开（无需登录）
- **说明**: 学生不返回签到统计；组织者/管理员返回完整数据

**响应示例**:

```json
{
    "code": 200,
    "data": {
        "event_id": "lecture_001",
        "title": "Python编程入门讲座",
        "time": "2024-03-15 14:00",
        "start_time": "2024-03-15 14:00",
        "end_time": "2024-03-15 16:00",
        "location": "教学楼301",
        "status": "active",
        "organizer": "计算机学院",
        "description": "活动描述",
        "limit_num": 100,
        "created_at": "2024-03-10T09:00:00",
        "updated_at": "2024-03-10T09:00:00"
    }
}
```

---

### 2.4 更新活动

- **URL**: `/events/update/{event_id}`
- **方法**: `PUT`
- **权限**: 组织者/管理员

**请求参数**:

```json
{
    "title": "更新后的标题",
    "start_time": "2024-03-16 15:00",
    "end_time": "2024-03-16 17:00",
    "location": "教学楼302",
    "description": "更新后的描述"
}
```

---

### 2.5 取消活动

- **URL**: `/events/cancel/{event_id}`
- **方法**: `PUT`
- **权限**: 组织者/管理员
- **说明**: 将活动状态改为 `cancelled`

---

### 2.6 删除活动

- **URL**: `/events/delete/{event_id}`
- **方法**: `DELETE`
- **权限**: 组织者/管理员
- **说明**: 软删除，设置 `is_deleted=true`

---

### 2.7 获取活动统计

- **URL**: `/events/statistics/{event_id}`
- **方法**: `GET`
- **权限**: 已登录用户

**响应示例**:

```json
{
    "code": 200,
    "data": {
        "event_id": "lecture_001",
        "title": "Python编程入门讲座",
        "apply_count": 85,
        "sign_count": 78,
        "sign_rate": "91.76%",
        "time_distribution": {
            "14": 45,
            "15": 33
        },
        "sign_records_count": 78
    }
}
```

---

## 3. 签到管理接口

前缀：`/api/sign`

### 3.1 报名活动

- **URL**: `/sign/apply`
- **方法**: `POST`
- **权限**: 已登录用户
- **说明**: 用户身份从 Token 获取，请求体中的 `user_id` 和 `user_name` 仅作参考，以 Token 为准

**请求参数**:

```json
{
    "event_id": "lecture_001",
    "user_id": "20230001",
    "user_name": "张三"
}
```

**响应示例**:

```json
{
    "code": 200,
    "msg": "报名成功"
}
```

---

### 3.2 取消报名

- **URL**: `/sign/cancel`
- **方法**: `POST`
- **权限**: 已登录用户

**请求参数**:

```json
{
    "event_id": "lecture_001",
    "user_id": "20230001",
    "user_name": "张三"
}
```

---

### 3.3 签到

- **URL**: `/sign/in`
- **方法**: `POST`
- **权限**: 已登录且已报名用户
- **说明**: 用户身份从 Token 获取；`sign_method` 默认为 `scan`

**请求参数**:

```json
{
    "event_id": "lecture_001",
    "user_id": "20230001",
    "user_name": "张三",
    "sign_method": "scan"
}
```

**响应示例**:

```json
{
    "code": 200,
    "msg": "签到成功",
    "data": {
        "sign_time": "2024-03-15T13:45:00",
        "sign_rate": "92.94%"
    }
}
```

---

### 3.4 获取签到状态

- **URL**: `/sign/status/{event_id}/{user_id}`
- **方法**: `GET`
- **权限**: 本人、组织者或管理员

**响应示例**:

```json
{
    "code": 200,
    "data": {
        "has_applied": true,
        "has_signed": true,
        "apply_time": "2024-03-12T10:30:00",
        "sign_time": "2024-03-15T13:45:00"
    }
}
```

---

### 3.5 获取活动签到记录

- **URL**: `/sign/records/{event_id}`
- **方法**: `GET`
- **权限**: 组织者/管理员

**请求参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| skip | number | 否 | 跳过数量，默认0 |
| limit | number | 否 | 每页数量，默认50 |

**响应示例**:

```json
{
    "code": 200,
    "data": [
        {
            "user_id": "20230001",
            "user_name": "张三",
            "sign_time": "2024-03-15T13:45:00",
            "sign_method": "scan"
        }
    ],
    "total": 78
}
```

---

### 3.6 获取签到计数

- **URL**: `/sign/count/{event_id}`
- **方法**: `GET`
- **权限**: 公开（无需登录）

**响应示例**:

```json
{
    "code": 200,
    "data": {
        "apply_count": 85,
        "sign_count": 78,
        "sign_rate": "91.76%"
    }
}
```

---

### 3.7 获取用户活动记录

- **URL**: `/sign/user/{user_id}`
- **方法**: `GET`
- **权限**: 已登录用户

**请求参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| skip | number | 否 | 跳过数量，默认0 |
| limit | number | 否 | 每页数量，默认20 |

**响应示例**:

```json
{
    "code": 200,
    "data": [
        {
            "event_id": "lecture_001",
            "event_title": "Python编程入门讲座",
            "event_time": "2024-03-15 14:00",
            "event_start_time": "2024-03-15 14:00",
            "event_end_time": "2024-03-15 16:00",
            "event_location": "教学楼301",
            "event_status": "ended",
            "apply_time": "2024-03-12T10:30:00",
            "sign_time": "2024-03-15T13:45:00",
            "status": "signed"
        }
    ],
    "total": 5
}
```

---

### 3.8 获取活动报名人员列表

- **URL**: `/sign/all/{event_id}`
- **方法**: `GET`
- **权限**: 组织者/管理员

**请求参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| skip | number | 否 | 跳过数量，默认0 |
| limit | number | 否 | 每页数量，默认50 |
| search | string | 否 | 搜索关键词（用户ID/用户名） |

**响应示例**:

```json
{
    "code": 200,
    "data": [
        {
            "user_id": "20230001",
            "user_name": "张三",
            "apply_time": "2024-03-12T10:30:00",
            "sign_time": "2024-03-15T13:45:00",
            "status": "signed"
        }
    ],
    "total": 85
}
```

---

## 4. 日志管理接口

前缀：`/api/logs`

### 4.1 获取操作日志

- **URL**: `/logs/operation`
- **方法**: `GET`
- **权限**: 管理员

**请求参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| skip | number | 否 | 跳过数量，默认0 |
| limit | number | 否 | 每页数量，默认50，最大100 |
| log_type | string | 否 | 日志类型：operation/login |
| user_id | string | 否 | 筛选用户ID |
| action | string | 否 | 操作类型：create/update/delete/cancel/login |
| target_type | string | 否 | 目标类型：event/user/sign |
| start_date | string | 否 | 开始日期，格式：YYYY-MM-DD |
| end_date | string | 否 | 结束日期，格式：YYYY-MM-DD |

**响应示例**:

```json
{
    "code": 200,
    "data": [
        {
            "_id": "...",
            "log_type": "operation",
            "user_id": "admin",
            "user_name": "admin",
            "action": "create",
            "target_type": "event",
            "target_id": "lecture_001",
            "target_name": "Python编程入门讲座",
            "detail": "创建活动: Python编程入门讲座",
            "ip_address": "127.0.0.1",
            "source": "webadmin",
            "created_at": "2024-03-10T09:00:00"
        }
    ],
    "total": 200
}
```

---

### 4.2 获取登录日志

- **URL**: `/logs/login`
- **方法**: `GET`
- **权限**: 管理员

**请求参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| skip | number | 否 | 跳过数量，默认0 |
| limit | number | 否 | 每页数量，默认50，最大100 |
| user_id | string | 否 | 筛选用户ID |
| source | string | 否 | 登录来源：webadmin/miniprogram |
| status | string | 否 | 登录状态：success/failed |
| start_date | string | 否 | 开始日期，格式：YYYY-MM-DD |
| end_date | string | 否 | 结束日期，格式：YYYY-MM-DD |

**响应示例**:

```json
{
    "code": 200,
    "data": [
        {
            "_id": "...",
            "user_id": "20230001",
            "user_name": "zhangsan",
            "login_time": "2024-03-15T13:00:00",
            "ip_address": "127.0.0.1",
            "source": "miniprogram",
            "status": "success"
        }
    ],
    "total": 50
}
```

---

## 5. 健康检查

### 5.1 服务健康检查

- **URL**: `/health`
- **方法**: `GET`
- **权限**: 公开

**响应示例**:

```json
{
    "status": "healthy",
    "timestamp": "2024-03-15T10:30:00"
}
```

---

### 5.2 MQTT 状态查询

- **URL**: `/mqtt/status`
- **方法**: `GET`
- **权限**: 管理员

**响应示例**:

```json
{
    "status": "ok",
    "mqtt": {
        "status": {
            "connected": true,
            "broker": "192.168.1.64",
            "port": 1883
        },
        "config": {
            "broker": "192.168.1.64",
            "port": 1883,
            "username": "admin",
            "keepalive": 60
        }
    }
}
```

---

## 错误码说明

| 错误码 | 说明 |
|--------|------|
| 40001 | 参数验证失败 |
| 40002 | 活动ID已存在 |
| 40003 | 用户已报名 |
| 40004 | 报名人数已满 |
| 40005 | 活动不存在 |
| 40006 | 用户未报名 |
| 40007 | 重复签到 |
| 40101 | 未授权，请先登录 |
| 40102 | 登录凭证已过期 |
| 40301 | 权限不足 |
| 40401 | 资源不存在 |
| 50001 | 服务器内部错误 |
| 50002 | 数据库操作失败 |
| 50003 | MQTT消息发送失败 |
