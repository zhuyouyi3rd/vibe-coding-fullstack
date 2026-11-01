# 云市 · 数据库设计

> 对应项目三「在线商城 Mini」。数据库使用 MySQL 8 / MariaDB 11，字符集 `utf8mb4`。

## 1. 表关系

```text
users 1 ─── n addresses
users 1 ─── n cart_items
users 1 ─── n orders
products 1 ─── n cart_items
orders 1 ─── n order_items
addresses 1 ─── n orders（address_id，删除地址时置空）
products 1 ─── n order_items（删除商品时置空，保留快照）
```

## 2. users（用户表）

| 字段 | 类型 | 约束 | 说明 |
|---|---|---|---|
| id | INT UNSIGNED | PK | 用户 ID |
| username | VARCHAR(50) | UNIQUE | 用户名 |
| email | VARCHAR(255) | UNIQUE | 邮箱 |
| password_hash | VARCHAR(255) | NOT NULL | bcrypt 哈希 |
| avatar | VARCHAR(500) | DEFAULT '' | 头像 |
| created_at | TIMESTAMP | DEFAULT NOW() | 注册时间 |

## 3. products（商品表）

| 字段 | 类型 | 说明 |
|---|---|---|
| id | INT UNSIGNED PK | 商品 ID |
| name | VARCHAR(120) | 名称 |
| description | TEXT | 描述 |
| price | DECIMAL(10,2) | 价格 |
| stock | INT UNSIGNED | 库存 |
| images | JSON | 图片数组 |
| category | VARCHAR(40) | 分类 |
| created_at / updated_at | TIMESTAMP | 时间 |

## 4. cart_items（购物车表）

| 字段 | 类型 | 说明 |
|---|---|---|
| id | INT UNSIGNED PK | 购物车项 ID |
| user_id | INT UNSIGNED FK | 用户 |
| product_id | INT UNSIGNED FK | 商品 |
| quantity | INT UNSIGNED | 数量 |
| created_at | TIMESTAMP | 加入时间 |

唯一索引 `(user_id, product_id)`：同一用户同一商品只保留一行，重复加入时累加数量。

## 5. addresses（地址表）

| 字段 | 类型 | 说明 |
|---|---|---|
| id | INT UNSIGNED PK | 地址 ID |
| user_id | INT UNSIGNED FK | 用户 |
| name / phone | VARCHAR | 收货人、手机号 |
| province / city / district / detail | VARCHAR | 省市区、详细地址 |
| is_default | TINYINT(1) | 是否默认 |
| created_at | TIMESTAMP | 创建时间 |

## 6. orders（订单表）

| 字段 | 类型 | 说明 |
|---|---|---|
| id | INT UNSIGNED PK | 订单 ID |
| order_no | VARCHAR(32) UNIQUE | 订单号（时间戳 + 随机数） |
| user_id | INT UNSIGNED FK | 下单用户 |
| address_id | INT UNSIGNED FK NULL | 地址 ID，删除地址时置空 |
| address_snapshot | JSON | 下单时的收货信息快照 |
| total_price | DECIMAL(10,2) | 应付总额（商品 + 运费） |
| shipping_fee | DECIMAL(10,2) | 运费 |
| status | ENUM | pending / paid / shipped / completed / cancelled |
| created_at / updated_at | TIMESTAMP | 时间 |

## 7. order_items（订单商品表）

| 字段 | 类型 | 说明 |
|---|---|---|
| id | INT UNSIGNED PK | 订单项 ID |
| order_id | INT UNSIGNED FK | 订单 |
| product_id | INT UNSIGNED FK NULL | 商品，删除时置空 |
| product_name | VARCHAR(120) | 下单时商品名快照 |
| product_image | VARCHAR(500) | 下单时图片快照 |
| quantity | INT UNSIGNED | 数量 |
| price | DECIMAL(10,2) | 下单时单价快照 |

## 8. 关键事务

### 创建订单

1. 校验地址属于当前用户。
2. 锁定并读取购物车项与对应商品库存。
3. 校验每一项库存充足。
4. 计算商品金额与运费（满 299 免运费，否则 12 元）。
5. 生成唯一订单号。
6. 写入 `orders` 和 `order_items`（保存商品/价格/地址快照）。
7. 扣减 `products.stock`。
8. 删除已结算的 `cart_items`。
9. 提交事务；任一步失败全部回滚。

### 取消订单

1. `SELECT ... FOR UPDATE` 锁定订单。
2. 只允许 `pending`。
3. 按订单项恢复库存。
4. 状态改为 `cancelled`。

## 9. 设计说明

- **价格快照**：订单项保存下单时价格与商品名，商品后续改价不影响历史订单。
- **地址快照**：订单保存完整收货信息，地址删除后历史订单仍可查看。
- **库存兜底**：购物车阶段校验一次，下单事务内再次校验并扣减，避免超卖。
- **订单号**：`YS + 年月日时分秒 + 4 位随机数`，数据库唯一索引兜底。
