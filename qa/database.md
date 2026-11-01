# 问渠 · 数据库设计

> 对应项目二「简易问答社区」。数据库使用 MySQL 8 / MariaDB 11，字符集 `utf8mb4`。

## 1. 表关系

```text
users 1 ─── n questions
users 1 ─── n answers
questions 1 ─── n answers
users 1 ─── n votes（多态：question / answer）
questions 1 ─── n votes（target_type = question）
answers 1 ─── n votes（target_type = answer）
```

- 问题的 `answers_count`、`votes` 是冗余统计字段，写入时同步维护。
- 回答的 `is_accepted` 与问题的 `is_solved` 一起维护。
- 点赞使用多态表，通过 `target_type + target_id` 指向问题或回答。

## 2. users（用户表）

| 字段 | 类型 | 约束 | 说明 |
|---|---|---|---|
| id | INT UNSIGNED | PK, AUTO_INCREMENT | 用户 ID |
| username | VARCHAR(50) | NOT NULL, UNIQUE | 用户名 |
| email | VARCHAR(255) | NOT NULL, UNIQUE | 邮箱 |
| password_hash | VARCHAR(255) | NOT NULL | bcrypt 密码哈希 |
| avatar | VARCHAR(500) | NOT NULL, DEFAULT '' | 头像 |
| points | INT | NOT NULL, DEFAULT 20 | 积分，允许为负 |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | 注册时间 |

## 3. questions（问题表）

| 字段 | 类型 | 约束 | 说明 |
|---|---|---|---|
| id | INT UNSIGNED | PK, AUTO_INCREMENT | 问题 ID |
| title | VARCHAR(160) | NOT NULL | 标题 |
| content | MEDIUMTEXT | NOT NULL | Markdown 描述 |
| tags | JSON | NOT NULL | 标签数组，最多 3 个 |
| author_id | INT UNSIGNED | NOT NULL, FK → users.id | 提问者 |
| views | INT UNSIGNED | NOT NULL, DEFAULT 0 | 浏览量 |
| answers_count | INT UNSIGNED | NOT NULL, DEFAULT 0 | 回答数 |
| votes | INT | NOT NULL, DEFAULT 0 | 点赞数 |
| is_solved | TINYINT(1) | NOT NULL, DEFAULT 0 | 是否已解决 |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | 创建时间 |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT NOW(), ON UPDATE NOW() | 更新时间 |

索引：`created_at`（最新）、`votes`（热门）、`author_id`（个人主页）。

## 4. answers（回答表）

| 字段 | 类型 | 约束 | 说明 |
|---|---|---|---|
| id | INT UNSIGNED | PK, AUTO_INCREMENT | 回答 ID |
| content | MEDIUMTEXT | NOT NULL | Markdown 回答 |
| question_id | INT UNSIGNED | NOT NULL, FK → questions.id | 所属问题 |
| author_id | INT UNSIGNED | NOT NULL, FK → users.id | 回答者 |
| votes | INT | NOT NULL, DEFAULT 0 | 点赞数 |
| is_accepted | TINYINT(1) | NOT NULL, DEFAULT 0 | 是否被采纳 |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | 创建时间 |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT NOW(), ON UPDATE NOW() | 更新时间 |

回答按「已采纳 → 点赞数 → 时间」排序。

## 5. votes（点赞表）

| 字段 | 类型 | 约束 | 说明 |
|---|---|---|---|
| id | INT UNSIGNED | PK, AUTO_INCREMENT | 点赞 ID |
| user_id | INT UNSIGNED | NOT NULL, FK → users.id | 点赞用户 |
| target_type | ENUM('question','answer') | NOT NULL | 目标类型 |
| target_id | INT UNSIGNED | NOT NULL | 目标 ID |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | 点赞时间 |

**唯一索引** `(user_id, target_type, target_id)`：同一用户对同一目标只能点赞一次。

## 6. 关键一致性设计

### 提问扣分

事务内：

1. `SELECT points FROM users WHERE id = ? FOR UPDATE`
2. 校验余额，插入问题
3. `UPDATE users SET points = points - 5`

### 回答加分

事务内插入回答 → `answers_count + 1` → 回答者 `points + 10`。

### 点赞开关

事务内锁定目标行，检查是否已点赞：

- 已点赞：删除记录 → 目标 `votes - 1`（不小于 0）→ 作者积分扣回
- 未点赞：插入记录（唯一索引兜底）→ 目标 `votes + 1` → 作者积分增加

不允许给自己的内容点赞。

### 采纳答案

事务内 `FOR UPDATE` 锁定问题：

1. 只有提问者可以操作
2. 问题必须未解决
3. 回答必须属于该问题，且不是提问者自己的回答
4. 回答 `is_accepted = 1`，问题 `is_solved = 1`
5. 回答者 `points + 30`

## 7. 设计说明

- **积分不单独建流水表**：本版是学习项目，直接存 `users.points`，所有变更在事务内完成。真实产品建议增加 `point_logs` 方便审计与回滚。
- **标签用 JSON**：标签数量少，筛选使用 `JSON_SEARCH`；等标签成为核心功能再拆多对多。
- **冗余计数**：`votes`、`answers_count` 避免列表页聚合查询，但必须在同一事务中维护。
- **删除策略**：用户删除级联删除问题/回答/点赞；删除问题级联删除回答。本版 API 不提供删除。
