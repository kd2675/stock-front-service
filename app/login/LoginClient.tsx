"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";

import useAuthSession from "@/app/hooks/useAuthSession";
import { isStockAccountRole, login, logout, signup } from "@/app/lib/auth";
import { AUTH_EXPIRED_REDIRECT_KEY } from "@/app/lib/authEvents";
import { AUTH_API_BASE } from "@/app/lib/api";
import { rememberOAuthNextPath, sanitizeAuthNextPath } from "@/app/lib/authRouting";
import { resolveFirstFieldErrorMessage } from "@/app/lib/validation/formErrors";

import { LoginFormPanel } from "./LoginFormPanel";
import {
  loginFormSchema,
  resolveOAuthErrorMessage,
  resolveSessionMessage,
  UNSUPPORTED_ROLE_MESSAGE,
  type LoginFormPayload,
  type LoginFormValues,
  type LoginMode,
} from "./loginHelpers";

export function LoginClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { authStatus, isHydrated } = useAuthSession();
  const [mode, setMode] = useState<LoginMode>("login");
  const [message, setMessage] = useState<string | null>(null);
  const loginForm = useForm<LoginFormValues, unknown, LoginFormPayload>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      mode: "login",
      username: "",
      password: "",
      email: "",
    },
  });
  const username = useWatch({ control: loginForm.control, name: "username" });
  const password = useWatch({ control: loginForm.control, name: "password" });
  const email = useWatch({ control: loginForm.control, name: "email" });
  const nextPath = useMemo(() => sanitizeAuthNextPath(searchParams.get("next")), [searchParams]);

  useEffect(() => {
    if (!isHydrated || authStatus === "unknown") {
      return;
    }
    if (authStatus === "in") {
      router.replace(nextPath);
      return;
    }

    const error = searchParams.get("error");
    const errorCode = searchParams.get("errorCode");
    if (error || errorCode) {
      const provider = searchParams.get("provider");
      window.setTimeout(() => setMessage(resolveOAuthErrorMessage(error, errorCode, provider)), 0);
      return;
    }
    const sessionMessage = resolveSessionMessage(searchParams.get("expired"));
    if (sessionMessage) {
      window.sessionStorage.removeItem(AUTH_EXPIRED_REDIRECT_KEY);
      window.setTimeout(() => setMessage(sessionMessage), 0);
    }
  }, [authStatus, isHydrated, nextPath, router, searchParams]);

  const submit = loginForm.handleSubmit(async (values) => {
    setMessage(null);
    try {
      if (values.mode === "signup") {
        const signed = await signup(values.username, values.password, values.email);
        if (!signed.ok) {
          setMessage(signed.message ?? "회원가입에 실패했습니다. 입력값 또는 중복 계정을 확인해 주세요.");
          return;
        }
      }

      const loginResult = await login(values.username, values.password);
      if (!loginResult.ok) {
        setMessage(loginResult.message ?? "로그인에 실패했습니다.");
        return;
      }
      if (!isStockAccountRole(loginResult.user?.role)) {
        await logout();
        setMessage(UNSUPPORTED_ROLE_MESSAGE);
        return;
      }
      router.replace(nextPath);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "로그인 처리 중 오류가 발생했습니다.");
    }
  }, (errors) => {
    setMessage(resolveFirstFieldErrorMessage(errors, "로그인 입력값을 확인해 주세요."));
  });

  const updateMode = (nextMode: LoginMode) => {
    setMode(nextMode);
    loginForm.setValue("mode", nextMode, {
      shouldDirty: false,
      shouldTouch: false,
      shouldValidate: false,
    });
    setMessage(null);
  };

  const updateField = (fieldName: "username" | "password" | "email", value: string) => {
    loginForm.setValue(fieldName, value, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: false,
    });
    setMessage(null);
  };

  const startOAuthLogin = (provider: "naver-stock" | "kakao-stock") => {
    rememberOAuthNextPath(nextPath);
    window.location.replace(`${AUTH_API_BASE}/oauth2/authorize/${provider}`);
  };

  if (!isHydrated || authStatus === "unknown" || authStatus === "in") {
    return (
      <main className="grid min-h-screen place-items-center bg-stock-canvas px-5 text-stock-ink" aria-live="polite">
        <section className="text-center">
          <span className="mx-auto block size-8 animate-spin rounded-full border-2 border-stock-line border-t-stock-accent" aria-hidden="true" />
          <p className="mt-4 text-sm font-bold text-stock-text-tertiary">로그인 상태를 확인하고 있습니다.</p>
        </section>
      </main>
    );
  }

  return (
    <main className="login-screen min-h-screen bg-stock-canvas px-5 py-8 text-stock-ink">
      <section className="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-6xl items-center gap-8 lg:grid-cols-[1fr_420px]">
        <div>
          <p className="text-xs font-bold text-stock-accent">STOCK MOCK TRADING</p>
          <h1 className="mt-3 max-w-2xl break-keep text-4xl font-black leading-tight md:text-6xl">
            실제 시세 흐름으로 연습하는 모의투자
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-stock-text-tertiary">
            주문과 체결은 DB 원장에 남기고, 수요와 공급 주문장에서 자동참여자와 사용자의 호가가 만나도록 구성했습니다.
            계좌를 만든 뒤 보유 주식, 손익, 수익률을 함께 확인할 수 있습니다.
          </p>
        </div>

        <LoginFormPanel
          email={email}
          message={message}
          mode={mode}
          password={password}
          submitting={loginForm.formState.isSubmitting}
          username={username}
          onEmailChange={(value) => updateField("email", value)}
          onModeChange={updateMode}
          onOAuthLogin={startOAuthLogin}
          onPasswordChange={(value) => updateField("password", value)}
          onSubmit={() => void submit()}
          onUsernameChange={(value) => updateField("username", value)}
        />
      </section>
    </main>
  );
}
