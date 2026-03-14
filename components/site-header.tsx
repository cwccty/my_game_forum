import Link from "next/link";
import { auth } from "@/lib/auth";
import { logoutAction } from "@/app/actions";

export async function SiteHeader() {
  const session = await auth();

  return (
    <header className="site-header">
      <div className="shell nav-row">
        <Link href="/" className="brand">
          GameHub
        </Link>
        <nav className="nav-links">
          <Link href="/resources">MOD 资源</Link>
          <Link href="/news">资讯</Link>
          <Link href="/forum">论坛</Link>
          <Link href="/search">搜索</Link>
        </nav>
        <div className="nav-links auth-links">
          {session?.user ? (
            <>
              <Link href="/submit">投稿</Link>
              <Link href="/me">个人中心</Link>
              {session.user.role === "ADMIN" ? <Link href="/admin">后台</Link> : null}
              <form action={logoutAction}>
                <button type="submit" className="link-button">
                  退出
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login">登录</Link>
              <Link href="/register">注册</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
