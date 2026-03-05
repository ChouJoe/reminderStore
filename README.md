# wxcloudrun-express - Calendar Reminder Backend

[![GitHub license](https://img.shields.io/github/license/WeixinCloud/wxcloudrun-express)](https://github.com/WeixinCloud/wxcloudrun-express)
![GitHub package.json dependency version (prod)](https://img.shields.io/github/package-json/dependency-version/WeixinCloud/wxcloudrun-express/express)
![GitHub package.json dependency version (prod)](https://img.shields.io/github/package-json/dependency-version/WeixinCloud/wxcloudrun-express/mongoose)

微信云托管 Node.js Express 框架模版 - 日历提醒系统后端，实现用户管理、提醒管理、定时提醒推送等功能，使用云托管 MongoDB 读写数据。

## 快速开始

前往 [微信云托管快速开始页面](https://cloud.weixin.qq.com/cloudrun/onekey)，选择相应语言的模板，根据引导完成部署。

## 本地调试
下载代码在本地调试，请参考[微信云托管本地调试指南](https://developers.weixin.qq.com/miniprogram/dev/wxcloudrun/src/guide/debug/)

## 实时开发
代码变动时，不需要重新构建和启动容器，即可查看变动后的效果。请参考[微信云托管实时开发指南](https://developers.weixin.qq.com/miniprogram/dev/wxcloudrun/src/guide/debug/dev.html)

## Dockerfile最佳实践
请参考[如何提高项目构建效率](https://developers.weixin.qq.com/miniprogram/dev/wxcloudrun/src/scene/build/speed.html)

## 项目结构说明

```
.
├── Dockerfile
├── README.md
├── container.config.json
├── index.js
├── index.html
├── package.json
├── .env.example
├── backend/
│   ├── src/
│   │   ├── models/
│   │   │   ├── User.js
│   │   │   └── Reminder.js
│   │   ├── routes/
│   │   │   ├── user.js
│   │   │   └── reminder.js
│   │   └── services/
│   │       ├── wechatService.js
│   │       ├── cronService.js
│   │       └── recurrenceService.js
```

- `index.js`：项目入口，实现主要的 API 路由和服务器启动
- `backend/src/models/`：数据模型定义
- `backend/src/routes/`：API 路由实现
- `backend/src/services/`：业务逻辑服务
- `index.html`：首页代码
- `package.json`：Node.js 项目定义文件
- `container.config.json`：模板部署「服务设置」初始化配置（二开请忽略）
- `Dockerfile`：容器配置文件

## 服务 API 文档

### `GET /health`

健康检查接口

#### 响应结果示例

```json
{
  "status": "ok",
  "message": "Calendar Reminder API is running"
}
```

### `GET /api/wx_openid`

获取微信 Open ID（小程序调用）

#### 调用示例

```
curl https://<云托管服务域名>/api/wx_openid
```

### `POST /api/users/login`

用户登录/注册

#### 请求参数

- `code`：微信小程序登录 code

##### 请求参数示例

```json
{
  "code": "wx_login_code"
}
```

#### 响应结果示例

```json
{
  "success": true,
  "user": {
    "id": "user_id",
    "openid": "openid",
    "nickname": "nickname",
    "avatarUrl": "avatar_url"
  }
}
```

### `GET /api/users/:userId`

获取用户信息

#### 响应结果示例

```json
{
  "success": true,
  "user": {
    "id": "user_id",
    "openid": "openid",
    "nickname": "nickname",
    "avatarUrl": "avatar_url",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### `PUT /api/users/:userId`

更新用户信息

#### 请求参数

- `nickname`：用户昵称
- `avatarUrl`：头像 URL

##### 请求参数示例

```json
{
  "nickname": "新昵称",
  "avatarUrl": "https://example.com/avatar.jpg"
}
```

### `POST /api/reminders`

创建提醒

#### 请求参数

- `userId`：用户 ID
- `title`：提醒标题
- `description`：提醒描述
- `reminderDate`：提醒日期
- `reminderTime`：提醒时间
- `advanceMinutes`：提前提醒分钟数
- `recurrenceType`：重复类型（none/daily/weekly/monthly/monthly_nth_weekday）
- `recurrenceValue`：重复间隔值
- `recurrenceNthWeekday`：每月第几周
- `recurrenceWeekday`：星期几
- `recurrenceDay`：每月几号
- `recurrenceEndDate`：重复结束日期
- `maxRecurrenceCount`：最大重复次数

##### 请求参数示例

```json
{
  "userId": "user_id",
  "title": "会议提醒",
  "description": "重要会议",
  "reminderDate": "2024-01-01",
  "reminderTime": "09:00",
  "advanceMinutes": 30,
  "recurrenceType": "weekly",
  "recurrenceValue": 1,
  "recurrenceWeekday": 1
}
```

#### 响应结果示例

```json
{
  "success": true,
  "reminder": {
    "_id": "reminder_id",
    "userId": "user_id",
    "title": "会议提醒",
    "reminderDate": "2024-01-01T00:00:00.000Z",
    "reminderTime": "09:00"
  }
}
```

### `GET /api/reminders/:userId`

获取用户提醒列表

#### 查询参数

- `startDate`：开始日期
- `endDate`：结束日期
- `status`：状态（completed/pending）

#### 响应结果示例

```json
{
  "success": true,
  "reminders": [
    {
      "_id": "reminder_id",
      "title": "会议提醒",
      "reminderDate": "2024-01-01T00:00:00.000Z",
      "reminderTime": "09:00"
    }
  ]
}
```

### `PUT /api/reminders/:userId/:reminderId`

更新提醒

#### 请求参数

同创建提醒

### `DELETE /api/reminders/:userId/:reminderId`

删除提醒

#### 响应结果示例

```json
{
  "success": true,
  "message": "Reminder deleted successfully"
}
```

### `POST /api/reminders/:userId/:reminderId/complete`

完成提醒（支持重复提醒自动创建下一次）

#### 响应结果示例

```json
{
  "success": true,
  "reminder": {
    "_id": "reminder_id",
    "title": "会议提醒",
    "reminderDate": "2024-01-08T00:00:00.000Z",
    "isCompleted": false
  }
}
```

## 使用注意
如果不是通过微信云托管控制台部署模板代码，而是自行复制/下载模板代码后，手动新建一个服务并部署，需要在「服务设置」中补全以下环境变量，才可正常使用，否则会引发无法连接数据库，进而导致部署失败。

### 必需环境变量

- `MONGODB_URI`：MongoDB 连接字符串
- `WECHAT_APPID`：微信小程序 AppID
- `WECHAT_SECRET`：微信小程序 Secret
- `WECHAT_ACCESS_TOKEN_URL`：微信 Access Token 接口地址
- `WECHAT_TEMPLATE_MESSAGE_URL`：微信模板消息接口地址

### 环境变量示例

```
MONGODB_URI=mongodb://username:password@host:port/database
WECHAT_APPID=wx1234567890abcdef
WECHAT_SECRET=your_wechat_secret
WECHAT_ACCESS_TOKEN_URL=https://api.weixin.qq.com/cgi-bin/token
WECHAT_TEMPLATE_MESSAGE_URL=https://api.weixin.qq.com/cgi-bin/message/subscribe/send
```

## 功能特性

- 用户登录/注册（基于微信小程序 code）
- 提醒的增删改查
- 支持多种重复提醒模式：
  - 每日重复
  - 每周重复
  - 每月重复
  - 每月第几周星期几重复
- 定时任务自动检查并发送提醒
- 微信订阅消息推送
- 提前提醒功能

## License

[MIT](./LICENSE)
