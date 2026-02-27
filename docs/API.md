# EventCast-MQTT API 接口文档

## 基础信息

- **基础URL**: `http://your-domain.com/api` 或 `http://localhost:8000/api`
- **响应格式**: JSON
- **字符编码**: UTF-8

### 通用响应格式

```json
{
    "code": 200,        // 状态码：200成功，其他失败
    "msg": "success",    // 提示信息
    "data": {}           // 返回数据
}
状态码说明
状态码	说明
200	成功
400	请求参数错误
401	未授权/登录过期
403	禁止访问/权限不足
404	资源不存在
500	服务器内部错误
1. 活动管理接口
1.1 创建活动
URL: /events/create

方法: POST

权限: 组织者/管理员

请求参数:
{
    "event_id": "lecture_001",        // 活动ID，唯一标识
    "title": "Python编程入门讲座",      // 活动标题
    "time": "2024-03-15 14:00",       // 活动时间
    "location": "教学楼301",           // 活动地点
    "limit_num": 100,                  // 人数限制（可选）
    "description": "活动描述",          // 活动描述（可选）
    "organizer": "计算机学院",          // 组织单位（可选）
    "category": "lecture"              // 分类：lecture/recruitment/sports/other
}
响应示例:
{
    "code": 200,
    "msg": "活动创建成功",
    "event_id": "lecture_001"
}
1.2 获取活动列表
URL: /events/list

方法: GET

权限: 所有用户

请求参数:

参数	类型	必填	说明
status	string	否	活动状态：active/ended
category	string	否	活动分类
search	string	否	搜索关键词
skip	number	否	跳过数量，默认0
limit	number	否	每页数量，默认20
sort	string	否	排序字段，默认-time
响应示例:

json
{
    "code": 200,
    "data": [
        {
            "event_id": "lecture_001",
            "title": "Python编程入门讲座",
            "time": "2024-03-15 14:00",
            "location": "教学楼301",
            "status": "active",
            "apply_count": 85,
            "sign_count": 78,
            "sign_rate": "91.76%",
            "limit_num": 100,
            "category": "lecture",
            "organizer": "计算机学院",
            "created_at": "2024-03-10T09:00:00"
        }
    ],
    "total": 50,
    "skip": 0,
    "limit": 20
}
1.3 获取活动详情
URL: /events/detail/{event_id}

方法: GET

权限: 所有用户

响应示例:

json
{
    "code": 200,
    "data": {
        "event_id": "lecture_001",
        "title": "Python编程入门讲座",
        "time": "2024-03-15 14:00",
        "location": "教学楼301",
        "status": "active",
        "apply_count": 85,
        "sign_count": 78,
        "sign_rate": "91.76%",
        "limit_num": 100,
        "description": "面向初学者的Python入门讲座",
        "organizer": "计算机学院",
        "category": "lecture",
        "created_at": "2024-03-10T09:00:00",
        "updated_at": "2024-03-10T09:00:00"
    }
}
1.4 更新活动
URL: /events/update/{event_id}

方法: PUT

权限: 组织者/管理员

请求参数:

json
{
    "title": "更新后的标题",
    "time": "2024-03-16 15:00",
    "location": "教学楼302",
    "description": "更新后的描述"
}
1.5 删除活动
URL: /events/delete/{event_id}

方法: DELETE

权限: 组织者/管理员

1.6 获取活动统计
URL: /events/statistics/{event_id}

方法: GET

权限: 组织者/管理员

响应示例:

json
{
    "code": 200,
    "data": {
        "event_id": "lecture_001",
        "apply_count": 85,
        "sign_count": 78,
        "sign_rate": "91.76%",
        "time_distribution": {
            "14": 45,
            "15": 33
        }
    }
}
2. 签到管理接口
2.1 报名活动
URL: /sign/apply

方法: POST

权限: 已登录用户

请求参数:

json
{
    "event_id": "lecture_001",
    "user_id": "20230001",
    "user_name": "张三"
}
2.2 取消报名
URL: /sign/cancel

方法: POST

权限: 已登录用户

请求参数:

json
{
    "event_id": "lecture_001",
    "user_id": "20230001"
}
2.3 签到
URL: /sign/in

方法: POST

权限: 已报名用户

请求参数:

json
{
    "event_id": "lecture_001",
    "user_id": "20230001",
    "user_name": "张三",
    "sign_method": "scan",        // scan/manual/late
    "sign_location": "教学楼301"   // 可选
}
响应示例:

json
{
    "code": 200,
    "msg": "签到成功",
    "data": {
        "event_id": "lecture_001",
        "event_title": "Python编程入门讲座",
        "user_name": "张三",
        "sign_time": "2024-03-15T13:45:00",
        "sign_count": 79,
        "apply_count": 85,
        "sign_rate": "92.94%"
    }
}
2.4 获取签到状态
URL: /sign/status/{event_id}/{user_id}

方法: GET

权限: 相关用户

响应示例:

json
{
    "code": 200,
    "data": {
        "event_id": "lecture_001",
        "user_id": "20230001",
        "has_applied": true,
        "has_signed": true,
        "apply_time": "2024-03-12T10:30:00",
        "sign_time": "2024-03-15T13:45:00"
    }
}
2.5 获取签到记录
URL: /sign/records/{event_id}

方法: GET

权限: 组织者/管理员

请求参数:

参数	类型	必填	说明
skip	number	否	跳过数量，默认0
limit	number	否	每页数量，默认50
响应示例:

json
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
    "total": 78,
    "skip": 0,
    "limit": 50
}
2.6 获取用户签到记录
URL: /sign/user/{user_id}

方法: GET

权限: 本人或管理员

请求参数:

参数	类型	必填	说明
skip	number	否	跳过数量，默认0
limit	number	否	每页数量，默认20
响应示例:

json
{
    "code": 200,
    "data": [
        {
            "event_id": "lecture_001",
            "event_title": "Python编程入门讲座",
            "sign_time": "2024-03-15T13:45:00",
            "sign_method": "scan"
        }
    ],
    "total": 5
}
2.7 获取签到计数
URL: /sign/count/{event_id}

方法: GET

权限: 所有用户

响应示例:

json
{
    "code": 200,
    "data": {
        "apply_count": 85,
        "sign_count": 78,
        "sign_rate": "91.76%"
    }
}
3. 通知管理接口
3.1 发送通知
URL: /notifications/send

方法: POST

权限: 组织者/管理员

请求参数:

json
{
    "event_id": "lecture_001",
    "type": "event_create",        // event_create/apply_success/sign_in/reminder
    "content": "活动即将开始",       // 通知内容
    "priority": "normal",           // low/normal/high/urgent
    "target_users": ["20230001"]    // 指定用户，可选
}
3.2 获取活动通知
URL: /notifications/list/{event_id}

方法: GET

权限: 相关用户

请求参数:

参数	类型	必填	说明
skip	number	否	跳过数量，默认0
limit	number	否	每页数量，默认20
type	string	否	通知类型筛选
3.3 获取用户通知
URL: /notifications/user/{user_id}

方法: GET

权限: 本人

请求参数:

参数	类型	必填	说明
skip	number	否	跳过数量，默认0
limit	number	否	每页数量，默认20
unread_only	boolean	否	只显示未读，默认false
3.4 标记通知已读
URL: /notifications/mark-read

方法: POST

权限: 本人

请求参数:

json
{
    "user_id": "20230001",
    "notification_id": "notify_001"
}
3.5 广播通知
URL: /notifications/broadcast

方法: POST

权限: 管理员

请求参数:

json
{
    "message": "系统维护通知",
    "target_event": "lecture_001"    // 可选，指定活动
}
4. 用户管理接口
4.1 用户注册
URL: /users/register

方法: POST

权限: 公开

请求参数:

json
{
    "user_id": "20230001",           // 学号/工号
    "username": "zhangsan",          // 用户名
    "password": "123456",             // 密码
    "real_name": "张三",              // 真实姓名
    "email": "zhangsan@example.com",  // 邮箱（可选）
    "phone": "13800138001",           // 手机号（可选）
    "role": "student"                 // 角色：student/teacher/organizer
}
4.2 用户登录
URL: /users/login

方法: POST

权限: 公开

请求参数:

json
{
    "identifier": "20230001",    // 学号/工号 或 用户名
    "password": "123456"
}
响应示例:

json
{
    "code": 200,
    "msg": "登录成功",
    "data": {
        "user_info": {
            "user_id": "20230001",
            "username": "zhangsan",
            "real_name": "张三",
            "email": "zhangsan@example.com",
            "role": "student"
        },
        "token": "eyJhbGciOiJIUzI1NiIs..."
    }
}
4.3 获取用户信息
URL: /users/info/{user_id}

方法: GET

权限: 本人或管理员

4.4 更新用户信息
URL: /users/update/{user_id}

方法: PUT

权限: 本人或管理员

请求参数:

json
{
    "real_name": "张三丰",
    "email": "new@example.com",
    "phone": "13800138002",
    "password": "newpassword"    // 修改密码时提供
}
4.5 获取用户列表
URL: /users/list

方法: GET

权限: 管理员

请求参数:

参数	类型	必填	说明
role	string	否	角色筛选
status	string	否	状态筛选
search	string	否	搜索关键词
skip	number	否	跳过数量，默认0
limit	number	否	每页数量，默认20
4.6 获取用户统计
URL: /users/statistics/{user_id}

方法: GET

权限: 本人或管理员

响应示例:

json
{
    "code": 200,
    "data": {
        "user_id": "20230001",
        "apply_count": 15,
        "sign_count": 14,
        "sign_rate": "93.33%",
        "recent_activities": [
            {
                "event_id": "lecture_001",
                "sign_time": "2024-03-15T13:45:00"
            }
        ]
    }
}
4.7 禁用用户
URL: /users/disable/{user_id}

方法: PUT

权限: 管理员

4.8 启用用户
URL: /users/enable/{user_id}

方法: PUT

权限: 管理员

4.9 搜索用户
URL: /users/search

方法: GET

权限: 管理员

请求参数:

参数	类型	必填	说明
keyword	string	是	搜索关键词
limit	number	否	返回数量，默认10
5. 健康检查
5.1 服务健康检查
URL: /health

方法: GET

权限: 公开

响应示例:

json
{
    "status": "healthy",
    "database": "connected",
    "mqtt": "connected",
    "timestamp": "2024-03-15T10:30:00"
}
错误码说明
错误码	说明
40001	参数验证失败
40002	活动ID已存在
40003	用户已报名
40004	报名人数已满
40005	活动不存在
40006	用户未报名
40007	重复签到
40101	未授权，请先登录
40102	登录凭证已过期
40301	权限不足
40401	资源不存在
50001	服务器内部错误
50002	数据库操作失败
50003	MQTT消息发送失败


