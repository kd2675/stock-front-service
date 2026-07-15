"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { ensureAccessToken, getUserFromToken, isStockAccountRole, logout } from "@/app/lib/auth";
import { consumeOAuthNextPath } from "@/app/lib/authRouting";
import { UNSUPPORTED_ROLE_MESSAGE } from "@/app/login/loginHelpers";

const OAUTH_ERROR_KEYS = ["error", "errorCode", "provider"] as const;

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const cleanCallbackUrl = `${window.location.pathname}${window.location.search}`;
    window.history.replaceState(null, "", cleanCallbackUrl);

    const callbackQuery = new URLSearchParams(window.location.search);
    const loginQuery = new URLSearchParams();
    OAUTH_ERROR_KEYS.forEach((key) => {
      const value = callbackQuery.get(key);
      if (value) {
        loginQuery.set(key, value);
      }
    });
    if (loginQuery.has("error") || loginQuery.has("errorCode")) {
      consumeOAuthNextPath();
      router.replace(`/login?${loginQuery.toString()}`);
      return;
    }

    let cancelled = false;
    void (async () => {
      const token = await ensureAccessToken();
      if (cancelled) {
        return;
      }
      if (!token) {
        consumeOAuthNextPath();
        router.replace(`/login?error=${encodeURIComponent("소셜 로그인 세션을 확인할 수 없습니다. 다시 시도해 주세요.")}`);
        return;
      }
      const user = getUserFromToken(token);
      if (!isStockAccountRole(user?.role)) {
        await logout();
        consumeOAuthNextPath();
        router.replace(`/login?error=${encodeURIComponent(UNSUPPORTED_ROLE_MESSAGE)}`);
        return;
      }
      router.replace(consumeOAuthNextPath());
    })();

    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <main className="grid min-h-screen place-items-center bg-stock-canvas px-5 text-stock-ink">
      <section className="w-full max-w-sm text-center" aria-live="polite">
        <span className="mx-auto block size-8 animate-spin rounded-full border-2 border-stock-line border-t-stock-accent" aria-hidden="true" />
        <h1 className="mt-5 text-xl font-black">로그인을 마무리하고 있습니다</h1>
        <p className="mt-2 text-sm font-bold text-stock-text-tertiary">인증 정보를 확인한 뒤 투자 화면으로 이동합니다.</p>
      </section>
    </main>
  );
}
