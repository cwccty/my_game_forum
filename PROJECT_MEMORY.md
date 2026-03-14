# 项目记忆文档

## 当前状态

- 项目路径：`D:\code\game-forum-mvp`
- 技术栈：
  - `Next.js 15`
  - `React 19`
  - `Prisma`
  - `NextAuth` 账号密码登录
  - `PostgreSQL 17`
- 当前进度：
  - 已完成依赖安装
  - 已完成 `prisma generate`
  - 已完成 `prisma migrate dev`
  - 已完成 `db:seed`
  - 网站已可在浏览器正常打开
  - TypeScript 检查通过

## 常用命令

- 启动开发服务器：`npm.cmd run dev`
- 执行 Prisma 迁移：`npm.cmd run prisma:migrate`
- 写入种子数据：`npm.cmd run db:seed`
- 重新生成 Prisma Client：`npm.cmd run prisma:generate`

## 环境配置

- 环境文件：`D:\code\game-forum-mvp\.env`
- 当前使用 PostgreSQL
- 数据库连接串写在 `.env` 中，不应提交到 GitHub

## 数据库信息

- PostgreSQL 通过 `winget` 安装
- 已安装版本：`PostgreSQL 17`
- Windows 服务名：`postgresql-x64-17`
- 默认端口：`5432`
- `psql` 路径：`C:\Program Files\PostgreSQL\17\bin\psql.exe`
- 项目数据库名：`game_forum_mvp`

## 已知演示账号

- 网站管理员账号：
  - 邮箱：`admin@example.com`
  - 密码：见本地环境记录，不要提交到仓库
- 网站普通用户账号：
  - 邮箱：`player@example.com`
  - 密码：见本地环境记录，不要提交到仓库

## 当前网站结构

- 主要公开路由：
  - `/`
  - `/news`
  - `/resources`
  - `/forum`
  - `/search`
  - `/login`
  - `/register`
  - `/me`
  - `/admin`
- 投稿路由：
  - `/submit/news`
  - `/submit/resource`
  - `/submit/forum`

## 重要注意事项

- PowerShell 里 `npm` 可能被脚本策略拦截，优先使用 `npm.cmd`
- 如果 Windows 本机出现 npm 缓存权限问题，可使用 `--cache .npm-cache`
- 当前机器上的 Next 原生 SWC 不稳定，即使启动时有 SWC 警告，开发服务器仍可能正常运行
- 查询层已经加了安全兜底，数据库临时不可用时，部分页面会返回空数据而不是直接崩溃
- 当前 Prisma schema 使用 PostgreSQL，不是 SQLite
- 种子脚本已经调整为可重复执行

## 安全注意事项

- 不要把数据库密码、真实连接串、管理员真实密码写进会入库的文档
- 如需保留本地密码和敏感信息，请单独写入 `PROJECT_MEMORY.local.md` 并保持该文件不入库
- 如果此前为了重置 PostgreSQL 密码修改过 `pg_hba.conf`，项目稳定后应改回安全认证方式，例如 `scram-sha-256`

## 下一步建议

- 验证核心流程：
  - 登录
  - 注册
  - 投稿资讯 / 资源帖 / 论坛帖
  - 管理员审核
  - 评论
  - 收藏
  - 举报
- 修复功能验证过程中发现的运行时问题
- 优化前台界面和后台可用性
- 增加部署相关能力：SEO、sitemap、robots、域名配置说明
