"use client";

import { useActionState, useEffect, useState } from "react";
import { loginAction, registerAction } from "@/app/actions";
import { useTurnstile } from "@/components/turnstile-field";

function TurnstileFeedback({ error, debugInfo }: { error: string; debugInfo: string }) {
  return (
    <>
      <p className="error-text">{error}</p>
      {debugInfo ? <p className="muted captcha-debug">调试信息：{debugInfo}</p> : null}
    </>
  );
}

export function RegisterForm() {
  const [state, action, pending] = useActionState(registerAction, undefined);
  const submitLabel = pending ? "注册中..." : "创建账号";

  return (
    <form action={action} className="panel form-stack">
      <h1>注册账号</h1>
      <p className="muted">注册后即可投稿资讯、资源帖和论坛讨论。</p>
      <label>
        邮箱
        <input name="email" type="email" required />
      </label>
      <label>
        昵称
        <input name="nickname" required />
      </label>
      <label>
        密码
        <input name="password" type="password" minLength={8} required />
      </label>
      {state?.error ? <p className="error-text">{state.error}</p> : null}
      <button type="submit" disabled={pending}>
        {submitLabel}
      </button>
    </form>
  );
}

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, undefined);
  const [resetSignal, setResetSignal] = useState(0);
  const turnstile = useTurnstile({ action: "login", resetSignal });
  const submitLabel = pending ? "登录中..." : turnstile.isVerifying ? "验证中..." : "登录";

  useEffect(() => {
    if (!pending) {
      setResetSignal((current) => current + 1);
    }
  }, [pending, state?.error]);

  return (
    <form action={action} className="panel form-stack" onSubmit={turnstile.handleSubmit}>
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
      {turnstile.field}
      {state?.error ? <p className="error-text">{state.error}</p> : null}
      {!state?.error && turnstile.loadError ? <TurnstileFeedback error={turnstile.loadError} debugInfo={turnstile.debugInfo} /> : null}
      {!turnstile.isConfigured ? <p className="muted">当前环境尚未配置 Cloudflare Turnstile，部署前请补充站点密钥。</p> : null}
      <button type="submit" disabled={pending || turnstile.isVerifying}>
        {submitLabel}
      </button>
    </form>
  );
}

