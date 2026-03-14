# Game Forum MVP

一个基于 `Next.js App Router + Prisma + NextAuth + PostgreSQL` 的游戏社区 MVP，定位为“资源站优先”的游戏论坛网站。

## 功能概览

- 首页聚合推荐资源、最新资讯、热门讨论
- 资讯区、MOD 资源区、论坛区、个人中心、管理员后台
- 邮箱 + 密码注册登录
- 投稿后进入审核流
- 管理员审核、驳回、下架、推荐资源
- 评论、收藏、举报
- PostgreSQL + Prisma 数据模型

## 技术栈

- `Next.js 15`
- `React 19`
- `Prisma`
- `NextAuth` Credentials
- `PostgreSQL`

## 本地开发

### 1. 安装依赖

```bash
npm install
```

如果你的 Windows 环境存在全局 npm 缓存权限问题，可以使用：

```bash
npm install --cache .npm-cache
```

### 2. 配置环境变量

复制环境变量模板：

```bash
copy .env.example .env
```

然后根据你自己的数据库修改 `.env`：

```env
DATABASE_URL="postgresql://postgres:your_password@localhost:5432/game_forum_mvp?schema=public"
AUTH_SECRET="replace-with-a-long-random-string"
AUTH_TRUST_HOST="true"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 3. 执行迁移与种子数据

```bash
npm run prisma:migrate
npm run db:seed
```

### 4. 启动开发环境

```bash
npm run dev
```

Windows PowerShell 如果拦截 `npm`，请改用：

```bash
npm.cmd run dev
```

## 默认演示账号

运行种子数据后会生成两个站内账号：

- 管理员：`admin@example.com` / `Admin123456`
- 普通用户：`player@example.com` / `Player123456`

建议在正式部署前修改默认账号密码。

## 部署建议

推荐部署方式：

- 前端：`Vercel`
- 数据库：`Neon` 或其他托管 PostgreSQL

部署前需要完成：

1. 准备公网 PostgreSQL
2. 在部署平台配置环境变量
3. 运行 Prisma 迁移
4. 修改默认密码
5. 确认 `.env`、本地缓存、构建产物不会提交到仓库

## 上传 GitHub 前注意事项

- 不要提交 `.env`
- 不要提交数据库密码、生产连接串、管理员真实密码
- 不要提交 `.next`、`node_modules`、`.npm-cache`、`.localappdata`
- 如果本地有仅供自己参考的密码记录，请单独保存在不入库的文件里

## 当前已知事项

- 当前机器上原生 Next SWC 不稳定，开发环境可能出现 SWC 警告，但服务仍可启动
- 查询层已经加了安全兜底，数据库临时不可用时，部分页面会返回空数据而不是直接崩溃
- 种子脚本已调整为可重复执行

## 后续建议

- 做一轮完整功能验收：注册、登录、投稿、审核、评论、收藏、举报
- 修正运行时问题和交互细节
- 增加 SEO 文件：`sitemap`、`robots`
- 完善后台和发布体验
