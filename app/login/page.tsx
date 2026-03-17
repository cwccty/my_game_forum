import { LoginForm } from "@/components/auth-form";

export default function LoginPage() {
  return (
    <div className="grid-2">
      <LoginForm />
      <div className="panel">
        <h2>演示账号</h2>
        <p>管理员：admin@example.com / Admin123456</p>
        <p>普通用户：player@example.com / Player123456</p>
        <p>如果你还没初始化数据库，先执行 README 里的 Prisma 迁移和种子命令。</p>
      </div>
    </div>
  );
}
