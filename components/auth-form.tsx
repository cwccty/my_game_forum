"use client";

import { useActionState } from "react";
import { registerAction } from "@/app/actions";

export function RegisterForm() {
  const [state, action, pending] = useActionState(registerAction, undefined);

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
        {pending ? "注册中..." : "创建账号"}
      </button>
    </form>
  );
}
