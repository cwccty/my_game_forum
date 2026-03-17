const RECAPTCHA_VERIFY_URL = "https://www.google.com/recaptcha/api/siteverify";
const RECAPTCHA_SCORE_THRESHOLD = Number(process.env.RECAPTCHA_MIN_SCORE ?? "0.5");

type RecaptchaValidationResult =
  | { ok: true }
  | { ok: false; message: string };

type RecaptchaVerifyPayload = {
  success?: boolean;
  score?: number;
  action?: string;
  hostname?: string;
  [key: string]: unknown;
};

export async function verifyRecaptchaToken(token: string, expectedAction: string): Promise<RecaptchaValidationResult> {
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
  const secretKey = process.env.RECAPTCHA_SECRET_KEY;

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
    const response = await fetch(RECAPTCHA_VERIFY_URL, {
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

    const payload = (await response.json()) as RecaptchaVerifyPayload;

    if (!payload.success) {
      return { ok: false, message: "人机验证未通过，请重试。" };
    }

    if (payload.action !== expectedAction) {
      return { ok: false, message: "人机验证动作不匹配，请刷新页面后重试。" };
    }

    if (typeof payload.score === "number" && payload.score < RECAPTCHA_SCORE_THRESHOLD) {
      return { ok: false, message: "系统判定当前请求风险较高，请稍后再试。" };
    }

    return { ok: true };
  } catch {
    return { ok: false, message: "人机验证服务连接失败，请稍后再试。" };
  }
}
