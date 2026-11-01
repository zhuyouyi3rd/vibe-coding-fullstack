# 拾语博客 · 数据库设计

> 对应项目一「个人博客系统」。数据库使用 MySQL 8 / MariaDB 11，字符集 `utf8mb4`。

## 1. 表关系

```text
users 1 ─── n posts
categories 1 ─── n posts
```

- 一个用户可以发布多篇文章。
- 一个分类下可以有多篇文章。
- 文章必须属于一个分类；作者被删除时，其文章级联删除。

## 2. users（用户表）

| 字段 | 类型 | 约束 | 说明 |
|---|---|---|---|
| id | INT UNSIGNED | PK, AUTO_INCREMENT | 用户 ID |
| username | VARCHAR(50) | NOT NULL, UNIQUE | 用户名，3–20 字符 |
| email | VARCHAR(255) | NOT NULL, UNIQUE | 登录邮箱 |
| password_hash | VARCHAR(255) | NOT NULL | bcrypt 加密后的密码 |
| avatar | VARCHAR(500) | NOT NULL, DEFAULT '' | 头像地址 |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | 注册时间 |

## 3. categories（分类表）

| 字段 | 类型 | 约束 | 说明 |
|---|---|---|---|
| id | INT UNSIGNED | PK, AUTO_INCREMENT | 分类 ID |
| name | VARCHAR(50) | NOT NULL, UNIQUE | 分类名称 |
| slug | VARCHAR(50) | NOT NULL, UNIQUE | 用于 URL 查询的英文标识 |
| description | VARCHAR(255) | NOT NULL, DEFAULT '' | 分类描述 |

初始化分类：技术手记 `tech`、产品思考 `product`、生活随笔 `life`、阅读笔记 `reading`。

## 4. posts（文章表）

| 字段 | 类型 | 约束 | 说明 |
|---|---|---|---|
| id | INT UNSIGNED | PK, AUTO_INCREMENT | 文章 ID |
| title | VARCHAR(200) | NOT NULL | 标题 |
| content | MEDIUMTEXT | NOT NULL | Markdown 正文 |
| cover | VARCHAR(500) | NOT NULL, DEFAULT '' | 封面地址 |
| category_id | INT UNSIGNED | NOT NULL, FK → categories.id | 分类 |
| tags | JSON | NOT NULL | 标签数组，如 `["写作","设计"]` |
| author_id | INT UNSIGNED | NOT NULL, FK → users.id | 作者 |
| views | INT UNSIGNED | NOT NULL, DEFAULT 0 | 浏览次数 |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | 创建时间 |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT NOW(), ON UPDATE NOW() | 更新时间 |

索引：
- `idx_posts_created (created_at)`：首页按时间倒序。
- `idx_posts_category (category_id)`：分类筛选。
- `idx_posts_author (author_id)`：作者文章列表。

## 5. 设计说明

1. **分类规范化**：原文写的是 `posts.category`，实现时拆成 `category_id` 外键，避免分类名重复、改名字时漏改。
2. **标签用 JSON**：标签数量少、无需单独统计，JSON 数组比多一张关联表更轻。
3. **密码不存明文**：使用 bcrypt（cost 12），字段名为 `password_hash`。
4. **删除策略**：删除用户级联删除其文章；分类设 `RESTRICT`，避免文章变成无分类状态。
5. **列表不返回全文**：列表接口返回摘要，详情接口才返回 `content`，减少传输量。
