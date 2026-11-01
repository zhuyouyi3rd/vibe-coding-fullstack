# 个人作品收集 · 三个全栈项目

> 根据 `12（03） 全栈应用开发.pdf` 的项目实战部分完成。三个项目都是独立可运行的全栈应用：
> React + TypeScript + Vite + Tailwind CSS / Node.js + Express / MySQL · JWT 认证。

## 项目一览

| 项目 | 内容 | 地址 | 文档 |
|---|---|---|---|
| 个人博客「拾语」 | 文章 CRUD、Markdown 编辑、分类/标签、搜索分页、个人中心 | http://127.0.0.1:4000 | [blog](blog/README.md) |
| 问答社区「问渠」 | 提问回答、点赞、采纳、积分、排序标签、个人主页 | http://127.0.0.1:4101 | [qa](qa/README.md) |
| 在线商城「云市」 | 商品、购物车、地址、订单、库存事务、取消恢复库存 | http://127.0.0.1:4201 | [shop](shop/README.md) |

演示账号统一为：**林见山 / demo1234**  
另有周小满、陈屿、苏晚、何川等账号，密码同为 `demo1234`（不同项目可用账号略有差异，详见各自 README）。

## 一键启动

当前工作区自带本地 MariaDB 数据，先确保三个项目都已构建：

```bash
cd blog && npm run build
cd ../qa && npm run build
cd ../shop && npm run build
cd ..
```

然后：

```bash
node start-all.mjs
```

脚本会检测 3307 数据库端口，并依次拉起三个 Express 服务（同时提供已构建的前端静态文件）。如果服务已在运行，会跳过。

## 单独开发

```bash
cd blog && npm run db:start && npm run dev
cd qa && npm run dev
cd shop && npm run dev
```

开发端口：博客 5173、问答 5184、商城 5284。

## 验收记录

- 项目一：[blog/ACCEPTANCE.md](blog/ACCEPTANCE.md) · 17/17 API 测试
- 项目二：[qa/ACCEPTANCE.md](qa/ACCEPTANCE.md) · 15/15 API 测试，axe-core 0 violations
- 项目三：[shop/ACCEPTANCE.md](shop/ACCEPTANCE.md) · 10/10 API 测试，axe-core 0 violations

项目一、项目二已确认通过；项目三已交付，等待最终验收。

## 技术说明

- 本地数据库使用 MariaDB 11.4.13（MySQL 协议兼容），生产环境换 MySQL 8 只需修改各项目 `server/.env`。
- 密码使用 bcryptjs（bcrypt cost 12）。
- 项目三不接支付，订单创建后为「待支付」，取消订单会恢复库存。
