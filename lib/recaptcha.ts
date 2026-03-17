const TURNSTILE_VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

type TurnstileValidationResult =
  | { ok: true }
  | { ok: false; message: string };

type TurnstileVerifyPayload = {
  success?: boolean;
  action?: string;
  hostname?: string;
  "error-codes"?: string[];
  [key: string]: unknown;
};

function mapServerErrorCodes(errorCodes: string[] | undefined) {
  const joined = errorCodes?.join(",") || "unknown";

  if (!errorCodes || errorCodes.length === 0) {
    return {
      message: "人机验证未通过，请重试。",
      debugInfo: joined
    };
  }

  if (errorCodes.includes("invalid-input-secret") || errorCodes.includes("missing-input-secret")) {
    return {
      message: "站点的人机验证密钥配置有误，请联系管理员。",
      debugInfo: joined
    };
  }

  if (errorCodes.includes("invalid-input-response") || errorCodes.includes("missing-input-response")) {
    return {
      message: "人机验证令牌无效，请刷新页面后重试。",
      debugInfo: joined
    };
  }

  if (errorCodes.includes("timeout-or-duplicate")) {
    return {
      message: "人机验证令牌已超时或已失效，请重新提交。",
      debugInfo: joined
    };
  }

  return {
    message: "人机验证未通过，请重试。",
    debugInfo: joined
  };
}

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
    return { ok: false, message: "人机验证失败，请刷新页面后重试。调试信息：missing-turnstile-token" };
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
      return { ok: false, message: "人机验证服务暂时不可用，请稍后再试。调试信息：turnstile-siteverify-http-failed" };
    }

    const payload = (await response.json()) as TurnstileVerifyPayload;

    if (!payload.success) {
      const mapped = mapServerErrorCodes(payload["error-codes"]);
      return { ok: false, message: `${mapped.message} 调试信息：${mapped.debugInfo}` };
    }

    if (payload.action && payload.action !== expectedAction) {
      return { ok: false, message: `人机验证动作不匹配，请刷新页面后重试。调试信息：action-mismatch:${payload.action}` };
    }

    return { ok: true };
  } catch {
    return { ok: false, message: "人机验证服务连接失败，请稍后再试。调试信息：turnstile-siteverify-network-failed" };
  }
}
