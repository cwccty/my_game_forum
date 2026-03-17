"use client";

import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    grecaptcha?: {
      ready: (callback: () => void) => void;
      render: (
        container: HTMLElement,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          "expired-callback"?: () => void;
          "error-callback"?: () => void;
        }
      ) => number;
      reset: (widgetId?: number) => void;
    };
    __googleRecaptchaScriptPromise?: Promise<void>;
  }
}

function loadRecaptchaScript() {
  if (typeof window === "undefined") {
    return Promise.resolve();
  }

  if (window.grecaptcha) {
    return Promise.resolve();
  }

  if (window.__googleRecaptchaScriptPromise) {
    return window.__googleRecaptchaScriptPromise;
  }

  window.__googleRecaptchaScriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-google-recaptcha="true"]');

    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("reCAPTCHA script failed to load")), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = "https://www.google.com/recaptcha/api.js?render=explicit";
    script.async = true;
    script.defer = true;
    script.dataset.googleRecaptcha = "true";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("reCAPTCHA script failed to load"));
    document.head.appendChild(script);
  });

  return window.__googleRecaptchaScriptPromise;
}

type GoogleRecaptchaFieldProps = {
  inputName?: string;
  resetSignal?: number;
};

export function GoogleRecaptchaField({ inputName = "recaptchaToken", resetSignal = 0 }: GoogleRecaptchaFieldProps) {
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
  const containerRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<number | null>(null);
  const [token, setToken] = useState("");
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    if (!siteKey || !containerRef.current || widgetIdRef.current !== null) {
      return;
    }

    let cancelled = false;

    loadRecaptchaScript()
      .then(() => {
        if (cancelled || !window.grecaptcha || !containerRef.current || widgetIdRef.current !== null) {
          return;
        }

        window.grecaptcha.ready(() => {
          if (!containerRef.current || widgetIdRef.current !== null) {
            return;
          }

          widgetIdRef.current = window.grecaptcha?.render(containerRef.current, {
            sitekey: siteKey,
            callback: (nextToken: string) => {
              setToken(nextToken);
              setLoadError("");
            },
            "expired-callback": () => setToken(""),
            "error-callback": () => {
              setToken("");
              setLoadError("人机验证加载失败，请刷新后重试。");
            }
          }) ?? null;
        });
      })
      .catch(() => {
        if (!cancelled) {
          setLoadError("人机验证脚本加载失败，请检查网络后刷新页面。");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [siteKey]);

  useEffect(() => {
    if (widgetIdRef.current !== null && window.grecaptcha) {
      window.grecaptcha.reset(widgetIdRef.current);
      setToken("");
    }
  }, [resetSignal]);

  if (!siteKey) {
    return (
      <div className="recaptcha-stack">
        <p className="muted">当前环境尚未配置 Google 人机验证，部署前请补充站点密钥。</p>
        <input name={inputName} type="hidden" value="" readOnly />
      </div>
    );
  }

  return (
    <div className="recaptcha-stack">
      <div ref={containerRef} className="recaptcha-box" />
      <input name={inputName} type="hidden" value={token} readOnly />
      {loadError ? <p className="error-text">{loadError}</p> : null}
      {!token && !loadError ? <p className="muted">请完成上方的人机验证后再提交。</p> : null}
    </div>
  );
}
