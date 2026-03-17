"use client";

import { FormEvent, ReactElement, useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    grecaptcha?: {
      ready: (callback: () => void) => void;
      execute: (siteKey: string, options: { action: string }) => Promise<string>;
    };
    __googleRecaptchaScriptPromise?: Promise<void>;
  }
}

const RECAPTCHA_TIMEOUT_MS = 8000;

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

function loadRecaptchaScript(siteKey: string) {
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
    script.src = `https://www.google.com/recaptcha/api.js?render=${siteKey}`;
    script.async = true;
    script.defer = true;
    script.dataset.googleRecaptcha = "true";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("reCAPTCHA script failed to load"));
    document.head.appendChild(script);
  });

  return window.__googleRecaptchaScriptPromise;
}

async function executeRecaptcha(siteKey: string, action: string) {
  await withTimeout(loadRecaptchaScript(siteKey), RECAPTCHA_TIMEOUT_MS, "reCAPTCHA script load timeout");

  return withTimeout(
    new Promise<string>((resolve, reject) => {
      if (!window.grecaptcha) {
        reject(new Error("grecaptcha unavailable"));
        return;
      }

      window.grecaptcha.ready(() => {
        window.grecaptcha
          ?.execute(siteKey, { action })
          .then(resolve)
          .catch(reject);
      });
    }),
    RECAPTCHA_TIMEOUT_MS,
    "reCAPTCHA execute timeout"
  );
}

type UseRecaptchaV3Options = {
  action: string;
  resetSignal?: number;
  inputName?: string;
};

type UseRecaptchaV3Result = {
  handleSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  field: ReactElement;
  loadError: string;
  isConfigured: boolean;
  isVerifying: boolean;
};

export function useRecaptchaV3({ action, resetSignal = 0, inputName = "recaptchaToken" }: UseRecaptchaV3Options): UseRecaptchaV3Result {
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
  const tokenInputRef = useRef<HTMLInputElement | null>(null);
  const allowNativeSubmitRef = useRef(false);
  const [loadError, setLoadError] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    if (!siteKey) {
      return;
    }

    loadRecaptchaScript(siteKey).catch(() => {
      setLoadError("人机验证脚本加载失败，请检查网络后刷新页面。Google 服务在当前网络下可能不可用。");
    });
  }, [siteKey]);

  useEffect(() => {
    if (tokenInputRef.current) {
      tokenInputRef.current.value = "";
    }

    setLoadError("");
    setIsVerifying(false);
  }, [resetSignal]);

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
    setIsVerifying(true);

    try {
      const token = await executeRecaptcha(siteKey, action);

      if (!tokenInputRef.current) {
        throw new Error("recaptcha token input missing");
      }

      tokenInputRef.current.value = token;
      allowNativeSubmitRef.current = true;
      setIsVerifying(false);
      event.currentTarget.requestSubmit();
    } catch {
      setIsVerifying(false);
      setLoadError("人机验证失败或超时，请稍后再试。若你当前网络无法访问 Google，可考虑切换网络或改用 Cloudflare Turnstile。");
    }
  }

  const field = <input ref={tokenInputRef} name={inputName} type="hidden" defaultValue="" />;

  return {
    handleSubmit,
    field,
    loadError,
    isConfigured: Boolean(siteKey),
    isVerifying
  };
}

