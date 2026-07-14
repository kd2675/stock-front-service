import { AUTH_API_BASE } from "@/app/lib/api";

import type { LoginMode } from "./loginHelpers";

type LoginFormPanelProps = {
  email: string;
  message: string | null;
  mode: LoginMode;
  password: string;
  submitting: boolean;
  username: string;
  onEmailChange: (value: string) => void;
  onModeChange: (mode: LoginMode) => void;
  onPasswordChange: (value: string) => void;
  onSubmit: () => void;
  onUsernameChange: (value: string) => void;
};

export function LoginFormPanel({
  email,
  message,
  mode,
  password,
  submitting,
  username,
  onEmailChange,
  onModeChange,
  onPasswordChange,
  onSubmit,
  onUsernameChange,
}: LoginFormPanelProps) {
  return (
    <div className="rounded-lg border border-stock-border bg-white p-5 shadow-[0_16px_40px_rgba(25,31,40,0.08)]">
      <div className="grid grid-cols-2 rounded-md bg-stock-surface-strong p-1">
        <button
          type="button"
          onClick={() => onModeChange("login")}
          className={mode === "login" ? "rounded-md bg-white px-3 py-2 text-sm font-black text-stock-ink shadow-[0_1px_2px_rgba(0,0,0,0.06)]" : "px-3 py-2 text-sm font-bold text-stock-muted"}
        >
          로그인
        </button>
        <button
          type="button"
          onClick={() => onModeChange("signup")}
          className={mode === "signup" ? "rounded-md bg-white px-3 py-2 text-sm font-black text-stock-ink shadow-[0_1px_2px_rgba(0,0,0,0.06)]" : "px-3 py-2 text-sm font-bold text-stock-muted"}
        >
          회원가입
        </button>
      </div>

      <div className="mt-5 space-y-3">
        <Field label="아이디" value={username} onChange={onUsernameChange} autoComplete="username" />
        {mode === "signup" ? (
          <Field label="이메일" value={email} onChange={onEmailChange} type="email" autoComplete="email" />
        ) : null}
        <Field
          label="비밀번호"
          value={password}
          onChange={onPasswordChange}
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
        onClick={onSubmit}
        disabled={submitting}
        className="mt-5 w-full rounded-md bg-stock-accent px-4 py-3 text-sm font-black text-white disabled:cursor-wait disabled:opacity-60"
      >
        {submitting ? "처리 중" : mode === "login" ? "로그인" : "가입 후 시작"}
      </button>

      <div className="mt-5 grid gap-2">
        <button
          type="button"
          onClick={() => {
            window.location.href = `${AUTH_API_BASE}/oauth2/authorize/naver-stock`;
          }}
          className="rounded-md bg-[#03C75A] px-4 py-3 text-sm font-black text-white"
        >
          네이버로 계속
        </button>
        <button
          type="button"
          onClick={() => {
            window.location.href = `${AUTH_API_BASE}/oauth2/authorize/kakao-stock`;
          }}
          className="rounded-md bg-[#FEE500] px-4 py-3 text-sm font-black text-[#191919]"
        >
          카카오로 계속
        </button>
      </div>
    </div>
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
      <span className="text-xs font-bold text-stock-muted">{label}</span>
      <input
        type={type}
        value={value}
        autoComplete={autoComplete}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 w-full rounded-md border border-stock-border-strong bg-white px-3 py-3 text-sm font-bold text-stock-ink outline-none focus:border-stock-accent"
      />
    </label>
  );
}
