import { z } from "zod";

export const UNSUPPORTED_ROLE_MESSAGE = "stock-front-service에서 지원하지 않는 계정 권한입니다.";

export type LoginMode = "login" | "signup";

export const loginFormSchema = z.object({
  mode: z.enum(["login", "signup"]),
  username: z.string().trim().min(1, "아이디를 입력해 주세요."),
  password: z.string().min(1, "비밀번호를 입력해 주세요."),
  email: z.string().trim(),
}).superRefine((value, context) => {
  if (value.mode !== "signup") {
    return;
  }
  if (!value.email) {
    context.addIssue({
      code: "custom",
      message: "이메일을 입력해 주세요.",
      path: ["email"],
    });
    return;
  }
  if (!z.email().safeParse(value.email).success) {
    context.addIssue({
      code: "custom",
      message: "올바른 이메일 형식으로 입력해 주세요.",
      path: ["email"],
    });
  }
});

export type LoginFormValues = z.input<typeof loginFormSchema>;
export type LoginFormPayload = z.output<typeof loginFormSchema>;

export function resolveOAuthErrorMessage(error: string | null, errorCode: string | null, provider: string | null): string {
  const providerLabel = provider ? `${provider} ` : "";
  if (errorCode === "email_not_found") {
    return `${providerLabel}계정에서 이메일을 확인할 수 없습니다. 이메일 제공 동의를 확인해 주세요.`;
  }
  if (errorCode === "unsupported_provider") {
    return "지원하지 않는 OAuth 제공자입니다.";
  }
  return error || "소셜 로그인에 실패했습니다.";
}

export function resolveSessionMessage(expired: string | null): string | null {
  if (expired === "1") {
    return "세션이 만료되었습니다. 다시 로그인해 주세요.";
  }
  return null;
}
