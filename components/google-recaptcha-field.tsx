"use client";

import { FormEvent, useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    grecaptcha?: {
      ready: (callback: () => void) => void;
      execute: (siteKey: string, options: { action: string }) => Promise<string>;
    };
    __googleRecaptchaScriptPromise?: Promise<void>;
  }
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
  await loadRecaptchaScript(siteKey);

  return new Promise<string>((resolve, reject) => {
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
  });
}

type UseRecaptchaV3Options = {
  action: string;
  resetSignal?: number;
  inputName?: string;
};

export function useRecaptchaV3({ action, resetSignal = 0, inputName = "recaptchaToken" }: UseRecaptchaV3Options) {
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
  const tokenInputRef = useRef<HTMLInputElement | null>(null);
  const allowNativeSubmitRef = useRef(false);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    if (!siteKey) {
      return;
    }

    loadRecaptchaScript(siteKey).catch(() => {
      setLoadError("人机验证脚本加载失败，请刷新页面后重试。");
    });
  }, [siteKey]);

  useEffect(() => {
    if (tokenInputRef.current) {
      tokenInputRef.current.value = "";
    }

    setLoadError("");
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

    try {
      const token = await executeRecaptcha(siteKey, action);

      if (!tokenInputRef.current) {
        throw new Error("recaptcha token input missing");
      }

      tokenInputRef.current.value = token;
      allowNativeSubmitRef.current = true;
      event.currentTarget.requestSubmit();
    } catch {
      setLoadError("人机验证失败，请稍后再试。");
    }
  }

  const field = <input ref={tokenInputRef} name={inputName} type="hidden" defaultValue="" />;

  return {
    handleSubmit,
    field,
    loadError,
    isConfigured: Boolean(siteKey)
  };
}
