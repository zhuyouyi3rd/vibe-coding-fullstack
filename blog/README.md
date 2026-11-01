# 拾语 · 个人博客系统

项目一「个人博客系统」的实现。React + TypeScript + Vite + Tailwind CSS 前端，Node.js + Express + MySQL 后端，JWT 认证。

## 功能

- 注册 / 登录 / 退出，JWT 7 天有效
- 文章发布、编辑、删除、详情
- Markdown 编辑与实时预览
- 分类筛选、关键词搜索、分页
- 封面选择、标签管理
- 个人中心：文章管理、资料编辑、修改密码
- 作者主页、相关文章、文章目录
- 响应式布局

## 目录

```text
blog/
├─ server/                 Express API
│  ├─ db/schema.sql        建表 SQL
│  ├─ scripts/init-db.js   建表 + 种子数据
│  ├─ src/
│  │  ├─ config/           环境变量、数据库连接
│  │  ├─ controllers/      控制器
│  │  ├─ middleware/       认证、错误处理
│  │  ├─ models/           SQL 数据访问
│  │  ├─ routes/           路由
│  │  └─ utils/            响应与分页工具
│  └─ tests/               API 集成测试
├─ web/                    React 前端
│  ├─ public/covers/       本地封面
│  ├─ public/avatars/      本地头像
│  └─ src/
│     ├─ components/       通用组件
│     ├─ context/          登录态、Toast
│     ├─ lib/              API 客户端、格式化
│     └─ pages/            页面
├─ database.md             数据库设计
├─ PRD.md                  需求文档
└─ package.json            npm workspaces
```

## 本地启动

### 0. 快速启动（本工作区自带 MariaDB）

当前工作区已带一份本地 MariaDB 和数据，重启后可以这样恢复：

```bash
npm run db:start
npm run dev
```

如果使用自己的 MySQL 8，跳过 `db:start`，按下面步骤配置即可。

### 1. 环境

- Node.js 20+
- MySQL 8 或 MariaDB 11
- npm 10+

### 2. 数据库

创建数据库和账号（或用你自己的账号）：

```sql
CREATE DATABASE shiyu_blog CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'blog'@'127.0.0.1' IDENTIFIED BY 'blogpass';
GRANT ALL PRIVILEGES ON shiyu_blog.* TO 'blog'@'127.0.0.1';
FLUSH PRIVILEGES;
```

复制并修改环境变量：

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

```bash
npm run dev
```

- 前端：http://127.0.0.1:5173
- API：http://127.0.0.1:4000/api

也可以分别启动：

```bash
npm run dev:server
npm run dev:web
```

### 5. 演示账号

| 用户名 | 密码 | 角色 |
|---|---|---|
| 林见山 | demo1234 | 站长，文章最多 |
| 周小满 | demo1234 | 作者 |
| 陈屿 | demo1234 | 作者 |

## 测试

```bash
npm test
```

测试覆盖：注册、登录、鉴权、文章 CRUD、分页、分类筛选、搜索、浏览量、所有权校验、个人资料、修改密码。

## API 一览

| 方法 | 路径 | 说明 | 鉴权 |
|---|---|---|---|
| POST | `/api/auth/register` | 注册 | 否 |
| POST | `/api/auth/login` | 登录 | 否 |
| GET | `/api/auth/me` | 当前用户 | 是 |
| GET | `/api/categories` | 分类及文章数 | 否 |
| GET | `/api/posts` | 文章列表（page/pageSize/category/keyword/authorId） | 否 |
| GET | `/api/posts/:id` | 文章详情，浏览量 +1 | 否 |
| POST | `/api/posts` | 发布文章 | 是 |
| PUT | `/api/posts/:id` | 编辑自己的文章 | 是 |
| DELETE | `/api/posts/:id` | 删除自己的文章 | 是 |
| GET | `/api/users/:id` | 作者公开主页 | 否 |
| PUT | `/api/users/me` | 更新个人资料 | 是 |
| PUT | `/api/users/me/password` | 修改密码 | 是 |
| GET | `/api/health` | 健康检查 | 否 |

## 设计说明

- 分类使用 `category_id` 外键；标签用 JSON 数组。
- 密码 bcrypt cost 12；JWT 密钥从环境变量读取。
- 列表接口只返回摘要，详情才返回 Markdown 全文。
- 所有权校验在服务端完成，前端隐藏按钮不作为安全边界。
