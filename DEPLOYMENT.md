# 部署说明

本文档用于把 `game-forum-mvp` 从本地开发环境发布到公网，推荐组合是 `GitHub + Vercel + Neon PostgreSQL`。

## 1. 推送到 GitHub

在项目目录执行：

```bash
git branch -M main
git remote add origin <你的 GitHub 仓库地址>
git push -u origin main
```

如果已经添加过远程仓库，可以改用：

```bash
git remote set-url origin <你的 GitHub 仓库地址>
git push -u origin main
```

## 2. 准备线上 PostgreSQL

推荐使用 Neon 托管 PostgreSQL：

1. 创建 Neon 项目
2. 新建一个生产数据库
3. 复制连接串
4. 确保数据库允许 Prisma 正常连接

当前项目 Prisma 数据源使用的是：

```env
DATABASE_URL="postgresql://..."
```

如果你使用其他托管 PostgreSQL，只要提供标准 PostgreSQL 连接串即可。

## 3. 在 Vercel 导入项目

1. 登录 Vercel
2. 点击 `Add New -> Project`
3. 导入 GitHub 仓库 `game-forum-mvp`
4. Framework Preset 选择 `Next.js`
5. Build Command 填：

```bash
npm run build:deploy
```

6. Install Command 可保持默认 `npm install`
7. Output Directory 保持默认

## 4. 在 Vercel 配置环境变量

至少配置以下变量：

```env
DATABASE_URL=postgresql://<线上数据库连接串>
AUTH_SECRET=<高强度随机字符串>
AUTH_TRUST_HOST=true
NEXT_PUBLIC_APP_URL=https://<你的正式域名>
ALLOW_PRODUCTION_DEMO_ACCOUNTS=false
ALLOW_DEMO_SEED=false
```

建议说明：

- `DATABASE_URL`：线上 PostgreSQL 连接串
- `AUTH_SECRET`：用于会话与认证签名，必须替换为高强度随机值
- `AUTH_TRUST_HOST`：当前项目使用 Auth.js，需要在代理环境下信任 host
- `NEXT_PUBLIC_APP_URL`：正式站点地址，用于 metadata、sitemap、robots 等
- `ALLOW_PRODUCTION_DEMO_ACCOUNTS`：生产环境是否允许演示账号登录，默认应保持 `false`
- `ALLOW_DEMO_SEED`：是否允许执行演示种子，生产环境默认应保持 `false`

## 5. 首次部署后的数据初始化

### 迁移

Vercel 构建时会执行：

```bash
npm run build:deploy
```

其中已经包含：

```bash
prisma migrate deploy
```

所以线上数据库会自动执行已提交的迁移。

### 种子数据

生产环境通常不建议直接注入演示账号和演示帖子。

当前项目在生产环境下默认会拒绝执行演示种子。只有显式设置：

```env
ALLOW_DEMO_SEED=true
```

才会允许继续执行。

## 6. 域名与收录

上线后建议继续完成：

1. 在 Vercel 绑定正式域名
2. 将 `NEXT_PUBLIC_APP_URL` 改为正式域名并重新部署
3. 提交 `https://<你的域名>/sitemap.xml` 到搜索引擎站长平台
4. 检查 `https://<你的域名>/robots.txt`

## 7. 上线前安全检查

### 必改项

- 不要提交 `.env`
- 修改默认管理员账号密码
- 修改默认普通用户密码或删除演示用户
- 将 PostgreSQL 的 `pg_hba.conf` 从 `trust` 改回 `scram-sha-256`
- 使用真实随机的 `AUTH_SECRET`
- 不要让预览环境和生产环境共用同一个数据库
- 保持 `ALLOW_PRODUCTION_DEMO_ACCOUNTS=false`
- 保持 `ALLOW_DEMO_SEED=false`

### 建议补强项

- 当前限流是应用内存版，多实例部署时换成 Redis/Upstash 等共享限流
- 增加操作日志与异常告警
- 增加图床或对象存储，而不是长期把图片走临时方案
- 增加邮件验证、重置密码、管理员初始化脚本
- 准备隐私政策、服务条款和内容投诉处理说明

## 8. 当前项目适合部署前的命令

```bash
npm install
npm run prisma:generate
npm run build:deploy
```

## 9. 当前已补到仓库内的部署相关文件

- `app/sitemap.ts`
- `app/robots.ts`
- `README.md`
- `.env.example`
- `package.json` 中的 `build:deploy` 和 `prisma:deploy`
