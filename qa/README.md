# 问渠 · 简易问答社区

项目二「问答社区」的实现。React + TypeScript + Vite + Tailwind CSS，Node.js + Express + MySQL，JWT 认证。

## 功能

- 注册 / 登录，新用户 20 初始积分
- 提问（扣 5 分）、回答（加 10 分）
- 问题、回答点赞 / 取消点赞，返回当前用户点赞状态
- 提问者采纳最佳答案（回答者 +30 分，问题变为已解决）
- 问题列表：最新 / 热门 / 未解决排序
- 标签筛选、关键词搜索、分页
- 积分榜、热门标签、个人主页
- Markdown 提问 / 回答 / 预览
- 响应式布局

## 目录

```text
qa/
├─ server/                 Express API
│  ├─ db/schema.sql        建表 SQL
│  ├─ scripts/init-db.js   建表 + 种子数据
│  ├─ src/
│  │  ├─ config/           环境变量、数据库
│  │  ├─ controllers/      认证、问题、用户
│  │  ├─ middleware/       认证、错误处理
│  │  ├─ models/           问题/回答/投票/积分 SQL
│  │  ├─ routes/           路由
│  │  └─ utils/            积分规则、响应工具
│  └─ tests/               API 集成测试
├─ web/                    React 前端
│  ├─ public/avatars/      本地头像
│  └─ src/
│     ├─ components/       卡片、投票、回答、导航等
│     ├─ context/          登录态、Toast
│     ├─ lib/              API 客户端、格式化
│     └─ pages/            首页、详情、提问、登录、个人主页
├─ database.md             数据库设计
├─ PRD.md                  需求文档
└─ package.json            npm workspaces
```

## 本地启动

### 1. 环境

- Node.js 20+
- MySQL 8 或 MariaDB 11
- npm 10+

### 2. 数据库

```sql
CREATE DATABASE wenqu_qa CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'qa'@'127.0.0.1' IDENTIFIED BY 'qapass';
GRANT ALL PRIVILEGES ON wenqu_qa.* TO 'qa'@'127.0.0.1';
FLUSH PRIVILEGES;
```

复制环境变量：

```bash
cd server
cp .env.example .env
```

### 3. 安装与初始化

```bash
npm install
npm run db:init
```

### 4. 启动

当前工作区与项目一共用一份本地 MariaDB，可先启动数据库：

```bash
npm run db:start
npm run dev
```

- 前端：http://127.0.0.1:5184
- API：http://127.0.0.1:4101/api

也可以分别启动：

```bash
npm run dev:server
npm run dev:web
```

### 5. 演示账号

| 用户名 | 密码 | 说明 |
|---|---|---|
| 林见山 | demo1234 | 积分最高，有提问和回答 |
| 周小满 | demo1234 | 提问较多 |
| 陈屿 | demo1234 | 后端方向回答 |
| 苏晚 | demo1234 | 产品 / 职业方向 |
| 何川 | demo1234 | 后端 / 工程实践 |

## 测试

```bash
npm test
```

结果：**15 / 15 通过**。覆盖注册、提问扣分、回答加分、点赞开关、积分同步、防自赞、采纳权限、重复采纳、排序、标签筛选、关键词搜索、分页、浏览量、个人主页、资料更新。

## 积分规则

| 行为 | 积分 |
|---|---|
| 注册 | +20 |
| 发布问题 | -5 |
| 回答问题 | +10 |
| 回答被采纳 | +30 |
| 问题被点赞 | +5 |
| 回答被点赞 | +10 |

积分变化在数据库事务内完成；点赞表对 `(user_id, target_type, target_id)` 建唯一索引，防止重复点赞。不能给自己的内容点赞。

## API 一览

| 方法 | 路径 | 说明 | 鉴权 |
|---|---|---|---|
| POST | `/api/auth/register` | 注册 | 否 |
| POST | `/api/auth/login` | 登录 | 否 |
| GET | `/api/auth/me` | 当前用户 | 是 |
| GET | `/api/stats` | 站点统计 | 否 |
| GET | `/api/tags` | 标签及数量 | 否 |
| GET | `/api/leaderboard` | 积分榜 | 否 |
| GET | `/api/questions` | 问题列表（sort/tag/keyword/page） | 可选 |
| GET | `/api/questions/:id` | 问题详情 + 回答，浏览 +1 | 可选 |
| POST | `/api/questions` | 提问 | 是 |
| POST | `/api/questions/:id/answers` | 回答 | 是 |
| POST | `/api/questions/:id/vote` | 问题点赞开关 | 是 |
| POST | `/api/answers/:id/vote` | 回答点赞开关 | 是 |
| POST | `/api/questions/:id/accept` | 采纳答案 | 是 |
| GET | `/api/users/:id` | 用户主页 | 否 |
| PUT | `/api/users/me` | 更新资料 | 是 |
