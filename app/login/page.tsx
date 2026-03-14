import { loginAction } from "@/app/actions";

export default function LoginPage() {
  return (
    <div className="grid-2">
      <form action={loginAction} className="panel form-stack">
        <h1>登录</h1>
        <p className="muted">使用邮箱和密码登录，普通用户登录后可以投稿和评论。</p>
        <label>
          邮箱
          <input name="email" type="email" required />
        </label>
        <label>
          密码
          <input name="password" type="password" required />
        </label>
        <button type="submit">登录</button>
      </form>
      <div className="panel">
        <h2>演示账号</h2>
        <p>管理员：admin@example.com / Admin123456</p>
        <p>普通用户：player@example.com / Player123456</p>
        <p>如果你还没初始化数据库，先执行 README 里的 Prisma 迁移和种子命令。</p>
      </div>
    </div>
  );
}
