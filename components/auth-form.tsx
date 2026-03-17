"use client";

import { useActionState, useEffect, useState } from "react";
import { loginAction, registerAction } from "@/app/actions";
import { GoogleRecaptchaField } from "@/components/google-recaptcha-field";

export function RegisterForm() {
  const [state, action, pending] = useActionState(registerAction, undefined);
  const [resetSignal, setResetSignal] = useState(0);

  useEffect(() => {
    if (!pending) {
      setResetSignal((current) => current + 1);
    }
  }, [pending, state?.error]);

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
      <GoogleRecaptchaField resetSignal={resetSignal} />
      {state?.error ? <p className="error-text">{state.error}</p> : null}
      <button type="submit" disabled={pending}>
        {pending ? "注册中..." : "创建账号"}
      </button>
    </form>
  );
}

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, undefined);
  const [resetSignal, setResetSignal] = useState(0);

  useEffect(() => {
    if (!pending) {
      setResetSignal((current) => current + 1);
    }
  }, [pending, state?.error]);

  return (
    <form action={action} className="panel form-stack">
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
      <GoogleRecaptchaField resetSignal={resetSignal} />
      {state?.error ? <p className="error-text">{state.error}</p> : null}
      <button type="submit" disabled={pending}>
        {pending ? "登录中..." : "登录"}
      </button>
    </form>
  );
}
