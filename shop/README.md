# 云市 · 在线商城 Mini

项目三「在线商城」的实现。React + TypeScript + Vite + Tailwind CSS，Node.js + Express + MySQL，JWT 认证。

## 功能

- 商品列表、分类筛选、关键词搜索、价格排序
- 商品详情、库存展示、数量选择
- 购物车：加入、数量累加、修改数量、删除、库存校验
- 收货地址：新增、编辑、删除、默认地址
- 订单：创建、列表、状态筛选、详情、取消
- 下单事务：校验地址与库存、计算商品金额与运费、生成订单号、写订单商品快照、扣库存、清购物车
- 取消待支付订单：恢复库存
- 响应式布局

## 目录

```text
shop/
├─ server/                 Express API
│  ├─ db/schema.sql        建表 SQL
│  ├─ scripts/init-db.js   建表 + 种子数据
│  ├─ src/
│  │  ├─ config/           环境变量、数据库
│  │  ├─ controllers/      认证、商品、购物车、地址、订单
│  │  ├─ middleware/       认证、错误处理
│  │  ├─ models/           SQL 与事务
│  │  └─ routes/           路由
│  └─ tests/               API 集成测试
├─ web/                    React 前端
│  ├─ public/products/     本地商品图
│  ├─ public/avatars/      本地头像
│  └─ src/
│     ├─ components/       导航、商品卡、登录布局
│     ├─ context/          登录态、购物车、Toast
│     ├─ lib/              API 客户端、格式化
│     └─ pages/            首页、商品、购物车、订单、地址、登录
├─ database.md             数据库设计
├─ PRD.md                  需求文档
└─ package.json            npm workspaces
```

## 本地启动

### 1. 环境

- Node.js 20+
- MySQL 8 或 MariaDB 11

### 2. 数据库

```sql
CREATE DATABASE yunshi_shop CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'shop'@'127.0.0.1' IDENTIFIED BY 'shoppass';
GRANT ALL PRIVILEGES ON yunshi_shop.* TO 'shop'@'127.0.0.1';
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

当前工作区与项目一、二共用一份本地 MariaDB：

```bash
npm run db:start
npm run dev
```

- 前端：http://127.0.0.1:5284
- API：http://127.0.0.1:4201/api

### 5. 演示账号

| 用户名 | 密码 | 说明 |
|---|---|---|
| 林见山 | demo1234 | 已有一个收货地址和一笔历史订单 |
| 周小满 | demo1234 | 空账号，可测试新用户流程 |

## 测试

```bash
npm test
```

结果：**10 / 10 通过**。覆盖商品、购物车合并、库存校验、地址默认逻辑、订单创建、库存扣减、购物车清空、订单越权、取消恢复库存、重复取消。

## 订单规则

- 订单创建后状态为 `pending`（待支付），本 Mini 版不实现支付。
- 商品金额满 299 元免运费，否则运费 12 元。
- 订单保存商品名称、图片、下单时价格快照，避免商品后续改动影响历史订单。
- 创建订单使用数据库事务：校验地址/库存 → 写订单与订单商品 → 扣库存 → 清购物车。
- 只有 `pending` 订单可以取消；取消后恢复库存。

## API 一览

| 方法 | 路径 | 说明 | 鉴权 |
|---|---|---|---|
| POST | `/api/auth/register` | 注册 | 否 |
| POST | `/api/auth/login` | 登录 | 否 |
| GET | `/api/auth/me` | 当前用户 | 是 |
| GET | `/api/products` | 商品列表（category/keyword/sort） | 否 |
| GET | `/api/products/:id` | 商品详情 | 否 |
| GET | `/api/categories` | 商品分类 | 否 |
| GET | `/api/cart` | 购物车 | 是 |
| POST | `/api/cart` | 加入购物车 | 是 |
| PUT | `/api/cart/:id` | 修改数量 | 是 |
| DELETE | `/api/cart/:id` | 删除商品 | 是 |
| GET | `/api/addresses` | 地址列表 | 是 |
| POST | `/api/addresses` | 新增地址 | 是 |
| PUT | `/api/addresses/:id` | 编辑地址 | 是 |
| DELETE | `/api/addresses/:id` | 删除地址 | 是 |
| GET | `/api/orders` | 订单列表（status/page） | 是 |
| POST | `/api/orders` | 创建订单 | 是 |
| GET | `/api/orders/:id` | 订单详情 | 是 |
| PUT | `/api/orders/:id/cancel` | 取消待支付订单 | 是 |
