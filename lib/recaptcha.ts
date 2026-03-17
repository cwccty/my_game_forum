const TURNSTILE_VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

type TurnstileValidationResult =
  | { ok: true }
  | { ok: false; message: string };

type TurnstileVerifyPayload = {
  success?: boolean;
  action?: string;
  hostname?: string;
  [key: string]: unknown;
};

export async function verifyTurnstileToken(token: string, expectedAction: string): Promise<TurnstileValidationResult> {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const secretKey = process.env.TURNSTILE_SECRET_KEY;

  if (!siteKey && !secretKey) {
    return { ok: true };
  }

  if (!siteKey || !secretKey) {
    return { ok: false, message: "站点的人机验证配置不完整，请联系管理员。" };
  }

  if (!token) {
    return { ok: false, message: "人机验证失败，请刷新页面后重试。" };
  }

  try {
    const response = await fetch(TURNSTILE_VERIFY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams({
        secret: secretKey,
        response: token
      }),
      cache: "no-store"
    });

    if (!response.ok) {
      return { ok: false, message: "人机验证服务暂时不可用，请稍后再试。" };
    }

    const payload = (await response.json()) as TurnstileVerifyPayload;

    if (!payload.success) {
      return { ok: false, message: "人机验证未通过，请重试。" };
    }

    if (payload.action && payload.action !== expectedAction) {
      return { ok: false, message: "人机验证动作不匹配，请刷新页面后重试。" };
    }

    return { ok: true };
  } catch {
    return { ok: false, message: "人机验证服务连接失败，请稍后再试。" };
  }
}
