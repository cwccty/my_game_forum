"use client";

import { FormEvent, ReactElement, useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement, options: TurnstileRenderOptions) => string;
      execute: (widgetId: string) => void;
      remove: (widgetId: string) => void;
      reset: (widgetId: string) => void;
    };
    __turnstileScriptPromise?: Promise<void>;
  }
}

type TurnstileRenderOptions = {
  sitekey: string;
  action?: string;
  appearance?: "always" | "execute" | "interaction-only";
  execution?: "render" | "execute";
  callback?: (token: string) => void;
  "error-callback"?: (errorCode?: string) => void;
  "expired-callback"?: () => void;
  "timeout-callback"?: () => void;
  "response-field"?: boolean;
};

const TURNSTILE_TIMEOUT_MS = 8000;

type TurnstileUiError = {
  message: string;
  debugInfo: string;
};

function loadTurnstileScript() {
  if (typeof window === "undefined") {
    return Promise.resolve();
  }

  if (window.turnstile) {
    return Promise.resolve();
  }

  if (window.__turnstileScriptPromise) {
    return window.__turnstileScriptPromise;
  }

  window.__turnstileScriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-turnstile-script="true"]');

    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("turnstile-script-load-failed")), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    script.async = true;
    script.defer = true;
    script.dataset.turnstileScript = "true";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("turnstile-script-load-failed"));
    document.head.appendChild(script);
  });

  return window.__turnstileScriptPromise;
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, errorMessage: string) {
  return new Promise<T>((resolve, reject) => {
    const timer = window.setTimeout(() => reject(new Error(errorMessage)), timeoutMs);

    promise
      .then((value) => {
        window.clearTimeout(timer);
        resolve(value);
      })
      .catch((error) => {
        window.clearTimeout(timer);
        reject(error);
      });
  });
}

function mapTurnstileError(error: unknown): TurnstileUiError {
  const raw = error instanceof Error ? error.message : "turnstile-unknown-error";

  if (raw === "turnstile-script-load-failed" || raw === "turnstile-script-load-timeout") {
    return {
      message: "人机验证脚本加载失败，请检查当前网络后刷新页面。",
      debugInfo: raw
    };
  }

  if (raw === "turnstile-widget-unavailable") {
    return {
      message: "人机验证组件初始化失败，请刷新页面后重试。",
      debugInfo: raw
    };
  }

  if (raw === "turnstile-execute-timeout") {
    return {
      message: "人机验证执行超时，请稍后再试。",
      debugInfo: raw
    };
  }

  if (raw === "turnstile-token-expired") {
    return {
      message: "人机验证令牌已过期，请重新提交。",
      debugInfo: raw
    };
  }

  if (raw === "turnstile-widget-removed") {
    return {
      message: "人机验证组件状态已重置，请重新提交。",
      debugInfo: raw
    };
  }

  if (raw.startsWith("turnstile-error-code:")) {
    return {
      message: "人机验证服务返回错误，请检查站点密钥和域名配置。",
      debugInfo: raw
    };
  }

  return {
    message: "人机验证失败，请稍后再试。",
    debugInfo: raw
  };
}

type UseTurnstileOptions = {
  action: string;
  resetSignal?: number;
  inputName?: string;
};

type PendingTokenRequest = {
  resolve: (token: string) => void;
  reject: (error: Error) => void;
};

type UseTurnstileResult = {
  handleSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  field: ReactElement;
  loadError: string;
  debugInfo: string;
  isConfigured: boolean;
  isVerifying: boolean;
};

export function useTurnstile({ action, resetSignal = 0, inputName = "turnstileToken" }: UseTurnstileOptions): UseTurnstileResult {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const widgetContainerRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);
  const tokenInputRef = useRef<HTMLInputElement | null>(null);
  const allowNativeSubmitRef = useRef(false);
  const pendingRequestRef = useRef<PendingTokenRequest | null>(null);
  const [loadError, setLoadError] = useState("");
  const [debugInfo, setDebugInfo] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  function applyUiError(error: unknown) {
    const mapped = mapTurnstileError(error);
    console.warn("[turnstile]", mapped.debugInfo, error);
    setLoadError(mapped.message);
    setDebugInfo(mapped.debugInfo);
  }

  useEffect(() => {
    let disposed = false;

    async function initializeWidget() {
      if (!siteKey || !widgetContainerRef.current) {
        return;
      }

      try {
        await loadTurnstileScript();

        if (disposed || !widgetContainerRef.current || widgetIdRef.current || !window.turnstile) {
          return;
        }

        widgetIdRef.current = window.turnstile.render(widgetContainerRef.current, {
          sitekey: siteKey,
          action,
          appearance: "execute",
          execution: "execute",
          "response-field": false,
          callback: (token) => {
            pendingRequestRef.current?.resolve(token);
            pendingRequestRef.current = null;
          },
          "error-callback": (errorCode) => {
            pendingRequestRef.current?.reject(new Error(`turnstile-error-code:${errorCode ?? "unknown"}`));
            pendingRequestRef.current = null;
          },
          "expired-callback": () => {
            pendingRequestRef.current?.reject(new Error("turnstile-token-expired"));
            pendingRequestRef.current = null;
          },
          "timeout-callback": () => {
            pendingRequestRef.current?.reject(new Error("turnstile-execute-timeout"));
            pendingRequestRef.current = null;
          }
        });
      } catch (error) {
        if (!disposed) {
          applyUiError(error);
        }
      }
    }

    initializeWidget();

    return () => {
      disposed = true;

      if (pendingRequestRef.current) {
        pendingRequestRef.current.reject(new Error("turnstile-widget-removed"));
        pendingRequestRef.current = null;
      }

      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, [action, siteKey]);

  useEffect(() => {
    if (tokenInputRef.current) {
      tokenInputRef.current.value = "";
    }

    if (widgetIdRef.current && window.turnstile) {
      window.turnstile.reset(widgetIdRef.current);
    }

    setLoadError("");
    setDebugInfo("");
    setIsVerifying(false);
  }, [resetSignal]);

  async function requestTurnstileToken() {
    await withTimeout(loadTurnstileScript(), TURNSTILE_TIMEOUT_MS, "turnstile-script-load-timeout");

    if (!widgetIdRef.current || !window.turnstile) {
      throw new Error("turnstile-widget-unavailable");
    }

    return withTimeout(
      new Promise<string>((resolve, reject) => {
        pendingRequestRef.current = { resolve, reject };
        window.turnstile?.reset(widgetIdRef.current!);
        window.turnstile?.execute(widgetIdRef.current!);
      }),
      TURNSTILE_TIMEOUT_MS,
      "turnstile-execute-timeout"
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    if (!siteKey) {
      return;
    }

    if (allowNativeSubmitRef.current) {
      allowNativeSubmitRef.current = false;
      return;
    }

    event.preventDefault();
    setLoadError("");
    setDebugInfo("");
    setIsVerifying(true);

    try {
      const token = await requestTurnstileToken();

      if (!tokenInputRef.current) {
        throw new Error("turnstile-token-input-missing");
      }

      tokenInputRef.current.value = token;
      allowNativeSubmitRef.current = true;
      setIsVerifying(false);
      event.currentTarget.requestSubmit();
    } catch (error) {
      setIsVerifying(false);
      applyUiError(error);
    }
  }

  const field = (
    <>
      <div ref={widgetContainerRef} className="turnstile-anchor" aria-hidden="true" />
      <input ref={tokenInputRef} name={inputName} type="hidden" defaultValue="" />
    </>
  );

  return {
    handleSubmit,
    field,
    loadError,
    debugInfo,
    isConfigured: Boolean(siteKey),
    isVerifying
  };
}
