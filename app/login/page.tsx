"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { API_BASE } from "@/app/lib/api";
import { clearAccessToken, getUserFromToken, isUserRole, login, setAccessToken, signup } from "@/app/lib/auth";
import { AUTH_EXPIRED_REDIRECT_KEY } from "@/app/lib/authEvents";

const USER_ONLY_MESSAGE = "stock-front-service는 USER 계정만 사용할 수 있습니다.";
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function resolveOAuthErrorMessage(error: string | null, errorCode: string | null, provider: string | null): string {
  const providerLabel = provider ? `${provider} ` : "";
  if (errorCode === "email_not_found") {
    return `${providerLabel}계정에서 이메일을 확인할 수 없습니다. 이메일 제공 동의를 확인해 주세요.`;
  }
  if (errorCode === "unsupported_provider") {
    return "지원하지 않는 OAuth 제공자입니다.";
  }
  return error || "소셜 로그인에 실패했습니다.";
}

function resolveSessionMessage(expired: string | null): string | null {
  if (expired === "1") {
    return "세션이 만료되었습니다. 다시 로그인해 주세요.";
  }
  return null;
}

function validateForm(mode: "login" | "signup", username: string, password: string, email: string): string | null {
  if (!username) {
    return "아이디를 입력해 주세요.";
  }
  if (!password) {
    return "비밀번호를 입력해 주세요.";
  }
  if (mode === "signup" && !email) {
    return "이메일을 입력해 주세요.";
  }
  if (mode === "signup" && !EMAIL_PATTERN.test(email)) {
    return "올바른 이메일 형식으로 입력해 주세요.";
  }
  return null;
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) {
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
      return;
    }
    setAccessToken(token);
    const user = getUserFromToken(token);
    if (!isUserRole(user?.role)) {
      clearAccessToken();
      window.setTimeout(() => setMessage(USER_ONLY_MESSAGE), 0);
      return;
    }
    router.replace("/");
  }, [router, searchParams]);

  const submit = async () => {
    const trimmedUsername = username.trim();
    const trimmedEmail = email.trim();
    const validationMessage = validateForm(mode, trimmedUsername, password, trimmedEmail);
    if (validationMessage) {
      setMessage(validationMessage);
      return;
    }

    setSubmitting(true);
    setMessage(null);
    if (mode === "signup") {
      const signed = await signup(trimmedUsername, password, trimmedEmail);
      if (!signed.ok) {
        setMessage(signed.message ?? "회원가입에 실패했습니다. 입력값 또는 중복 계정을 확인해 주세요.");
        setSubmitting(false);
        return;
      }
    }

    const loginResult = await login(trimmedUsername, password);
    if (!loginResult.ok) {
      setMessage(loginResult.message ?? "로그인에 실패했습니다.");
      setSubmitting(false);
      return;
    }
    if (!isUserRole(loginResult.user?.role)) {
      clearAccessToken();
      setMessage(USER_ONLY_MESSAGE);
      setSubmitting(false);
      return;
    }
    router.replace("/");
  };

  return (
    <main className="min-h-screen bg-[#f4f0e8] px-5 py-8 text-[#161616]">
      <section className="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-6xl items-center gap-8 lg:grid-cols-[1fr_420px]">
        <div>
          <p className="text-xs font-bold text-[#427d65]">STOCK MOCK TRADING</p>
          <h1 className="mt-3 max-w-2xl text-4xl font-black leading-tight md:text-6xl">
            실제 시세 흐름으로 연습하는 모의투자
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-[#5d5a52]">
            주문은 DB 원장에 남기고, batch 서버가 가격 갱신과 체결을 담당합니다.
            지금은 외부 가격 기반 가상 체결로 시작하고, 이후 내부 오더북 매칭으로 확장할 수 있게 설계했습니다.
          </p>
        </div>

        <div className="rounded-lg border border-[#27231c] bg-white p-5 shadow-[0_18px_44px_rgba(35,31,25,0.12)]">
          <div className="grid grid-cols-2 rounded-md bg-[#f4f0e8] p-1">
            <button
              type="button"
              onClick={() => {
                setMode("login");
                setMessage(null);
              }}
              className={mode === "login" ? "rounded bg-[#27231c] px-3 py-2 text-sm font-bold text-white" : "px-3 py-2 text-sm font-bold text-[#5d5a52]"}
            >
              로그인
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("signup");
                setMessage(null);
              }}
              className={mode === "signup" ? "rounded bg-[#27231c] px-3 py-2 text-sm font-bold text-white" : "px-3 py-2 text-sm font-bold text-[#5d5a52]"}
            >
              회원가입
            </button>
          </div>

          <div className="mt-5 space-y-3">
            <Field
              label="아이디"
              value={username}
              onChange={(value) => {
                setUsername(value);
                setMessage(null);
              }}
              autoComplete="username"
            />
            {mode === "signup" ? (
              <Field
                label="이메일"
                value={email}
                onChange={(value) => {
                  setEmail(value);
                  setMessage(null);
                }}
                type="email"
                autoComplete="email"
              />
            ) : null}
            <Field
              label="비밀번호"
              value={password}
              onChange={(value) => {
                setPassword(value);
                setMessage(null);
              }}
              type="password"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
            />
          </div>

          {message ? (
            <p aria-live="polite" className="mt-4 rounded-md bg-[#fff0ea] px-3 py-2 text-sm text-[#b84737]">
              {message}
            </p>
          ) : null}

          <button
            type="button"
            onClick={() => void submit()}
            disabled={submitting}
            className="mt-5 w-full rounded-md bg-[#d38b2c] px-4 py-3 text-sm font-black text-[#161616] disabled:opacity-60"
          >
            {submitting ? "처리 중" : mode === "login" ? "로그인" : "가입 후 시작"}
          </button>

          <div className="mt-5 grid gap-2">
            <button
              type="button"
              onClick={() => {
                window.location.href = `${API_BASE}/oauth2/authorize/naver-stock`;
              }}
              className="rounded-md bg-[#03C75A] px-4 py-3 text-sm font-black text-white"
            >
              네이버로 계속
            </button>
            <button
              type="button"
              onClick={() => {
                window.location.href = `${API_BASE}/oauth2/authorize/kakao-stock`;
              }}
              className="rounded-md bg-[#FEE500] px-4 py-3 text-sm font-black text-[#191919]"
            >
              카카오로 계속
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  autoComplete?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs font-bold text-[#68635a]">{label}</span>
      <input
        type={type}
        value={value}
        autoComplete={autoComplete}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 w-full rounded-md border border-[#d9d1c1] bg-[#fffaf0] px-3 py-3 text-sm outline-none focus:border-[#427d65]"
      />
    </label>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-[#f4f0e8]" />}>
      <LoginContent />
    </Suspense>
  );
}
