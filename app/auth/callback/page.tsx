"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { clearAccessToken, getUserFromToken, isStockAccountRole, setAccessToken } from "@/app/lib/auth";
import { UNSUPPORTED_ROLE_MESSAGE } from "@/app/login/loginHelpers";

const OAUTH_ERROR_KEYS = ["error", "errorCode", "provider"] as const;

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const fragment = new URLSearchParams(window.location.hash.slice(1));
    const token = fragment.get("token");
    const cleanCallbackUrl = `${window.location.pathname}${window.location.search}`;
    window.history.replaceState(null, "", cleanCallbackUrl);

    if (token) {
      const user = getUserFromToken(token);
      if (!isStockAccountRole(user?.role)) {
        clearAccessToken();
        router.replace(`/login?error=${encodeURIComponent(UNSUPPORTED_ROLE_MESSAGE)}`);
        return;
      }
      setAccessToken(token);
      router.replace("/");
      return;
    }

    const callbackQuery = new URLSearchParams(window.location.search);
    const loginQuery = new URLSearchParams();
    OAUTH_ERROR_KEYS.forEach((key) => {
      const value = callbackQuery.get(key);
      if (value) {
        loginQuery.set(key, value);
      }
    });
    if (!loginQuery.has("error") && !loginQuery.has("errorCode")) {
      loginQuery.set("error", "소셜 로그인 결과를 확인할 수 없습니다. 다시 시도해 주세요.");
    }
    router.replace(`/login?${loginQuery.toString()}`);
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
