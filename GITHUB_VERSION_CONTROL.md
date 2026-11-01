# GitHub 版本管理实践

> 本文记录三个全栈项目从本地 Git 仓库到 GitHub 远程仓库、分支、提交、Pull Request 与合并的实际流程。

## 1. 本次实践完成的操作

1. 在工作区初始化本地 Git 仓库。
2. 按项目拆分提交：博客、问答、商城、文档与验收材料。
3. 在 GitHub 创建公开仓库 `zhuyouyi3rd/vibe-coding-fullstack`。
4. 将本地 `master` 推送到 `origin`，建立跟踪关系。
5. 新建分支 `docs/github-workflow`，补充本说明文档。
6. 提交并推送分支，创建 Pull Request。
7. 在 GitHub 上完成合并（Merge），删除已合并的远程分支。

仓库地址：https://github.com/zhuyouyi3rd/vibe-coding-fullstack

## 2. 本地 Git 命令

```bash
git init
git add blog
git commit -m "feat(blog): complete personal blog full-stack application"

git add qa
git commit -m "feat(qa): complete Q&A community with points and voting"

git add shop
git commit -m "feat(shop): complete mini mall with cart and orders"

git add README.md start-all.mjs deliverables
git commit -m "docs: add project overview, acceptance capture and PDF"

git remote add origin https://github.com/zhuyouyi3rd/vibe-coding-fullstack.git
git push -u origin master
```

## 3. 分支与 Pull Request

```bash
git checkout -b docs/github-workflow
# 编辑 GITHUB_VERSION_CONTROL.md
git add GITHUB_VERSION_CONTROL.md
git commit -m "docs: add GitHub version control practice"
git push -u origin docs/github-workflow

gh pr create \
  --base master \
  --head docs/github-workflow \
  --title "docs: add GitHub version control practice" \
  --body "记录本次 Git / GitHub 版本管理流程与常用命令。"

gh pr merge --merge --delete-branch
```

合并后，`master` 上会多出一个 merge commit，远程功能分支会被删除。

## 4. 在 IDE 中怎么做

以 VS Code 为例：

| 操作 | IDE 位置 | 说明 |
|---|---|---|
| 查看改动 | 左侧「源代码管理」 | 显示修改、新增、删除文件 |
| 暂存 | 文件右侧 `+` | 等价于 `git add` |
| 提交 | 顶部输入框 + 对勾 | 等价于 `git commit -m` |
| 拉取 / 推送 | 底部状态栏同步按钮 | 等价于 `git pull` / `git push` |
| 切换 / 新建分支 | 左下角分支名 | 等价于 `git checkout -b` |
| 解决冲突 | 编辑器内联提示 | 选择保留当前/传入/两者 |
| 查看历史 | 安装 GitLens 或 `git log` | 查看提交、作者、文件变更 |

推荐习惯：

1. 开始一个功能前先 `pull`，再从最新 `master` 建分支。
2. 一个提交只做一件事，提交信息写清楚「做了什么」。
3. 推送分支后在 GitHub 开 PR，至少自己通读一遍 diff 再合并。
4. 合并后删除功能分支，保持分支列表干净。
5. 不把 `.env`、数据库文件、`node_modules` 提交到仓库。

## 5. 提交信息规范

```text
feat(blog): 新功能
fix(qa): 修复问题
docs: 文档与截图
test(shop): 测试
chore: 构建 / 依赖 / 配置
```

## 6. 冲突处理

```bash
git pull origin master
# 编辑冲突文件，保留正确内容，删除 <<<<<<< ======= >>>>>>>
git add <冲突文件>
git commit
git push
```

冲突并不可怕，关键是**先理解两边的改动意图**，不要直接全选某一边。

## 7. 本次实践的截图

- GitHub 仓库首页
- 提交历史
- Pull Request 合并页面
- 分支列表

截图会加入验收 PDF 的「GitHub 版本管理」章节。
