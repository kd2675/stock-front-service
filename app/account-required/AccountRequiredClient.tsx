"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import TradingTopBar from "@/app/components/TradingTopBar";
import useAuthSession from "@/app/hooks/useAuthSession";
import { getAccessToken } from "@/app/lib/auth";
import { openAccountMutationOptions, reconnectAccountMutationOptions } from "@/app/lib/react-query/stockMutations";
import { accountStatusQueryOptions } from "@/app/lib/react-query/stockQueries";
import { stockKeys } from "@/app/lib/react-query/stockKeys";
import type { Account } from "@/app/types/stock";

export default function AccountRequiredClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { isHydrated, authStatus, user } = useAuthSession();
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [issuedAccount, setIssuedAccount] = useState<Account | null>(null);
  const [reconnectAccountCode, setReconnectAccountCode] = useState("");
  const [reconnectRecoveryCode, setReconnectRecoveryCode] = useState("");
  const nextPath = useMemo(() => sanitizeNextPath(searchParams.get("next")), [searchParams]);
  const token = authStatus === "in" ? getAccessToken() : null;
  const accountStatusQuery = useQuery({
    ...accountStatusQueryOptions(token),
    enabled: isHydrated && authStatus === "in" && Boolean(token),
  });
  const openAccountMutation = useMutation({
    ...openAccountMutationOptions(),
    onSuccess: async (account) => {
      setIssuedAccount(account);
      setErrorMessage(null);
      setMessage(account.recoveryCode ? "모의투자 계좌가 준비되었습니다. 복구코드를 저장한 뒤 이동하세요." : "모의투자 계좌가 준비되었습니다.");
      await queryClient.invalidateQueries({ queryKey: stockKeys.account() });
    },
    onError: (error) => {
      setMessage(null);
      setErrorMessage(error instanceof Error ? error.message : "계좌 개설에 실패했습니다.");
    },
  });
  const reconnectAccountMutation = useMutation({
    ...reconnectAccountMutationOptions(),
    onSuccess: async (account) => {
      setIssuedAccount(account);
      setErrorMessage(null);
      setMessage("기존 모의투자 계좌가 현재 사용자에게 연결되었습니다. 새 복구코드를 저장하세요.");
      setReconnectAccountCode("");
      setReconnectRecoveryCode("");
      await queryClient.invalidateQueries({ queryKey: stockKeys.account() });
    },
    onError: (error) => {
      setMessage(null);
      setErrorMessage(error instanceof Error ? error.message : "계좌 복구 연결에 실패했습니다.");
    },
  });

  useEffect(() => {
    if (!isHydrated || authStatus === "unknown") {
      return;
    }
    if (authStatus === "out") {
      router.replace("/login");
      return;
    }
    if (accountStatusQuery.data?.hasAccount && !issuedAccount) {
      router.replace(nextPath);
    }
  }, [accountStatusQuery.data?.hasAccount, authStatus, isHydrated, issuedAccount, nextPath, router]);

  if (!isHydrated || authStatus === "unknown" || accountStatusQuery.isPending) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f6f7f9] px-5 text-[#191f28]">
        <div className="rounded-lg border border-[#e5e8eb] bg-white px-5 py-4 text-sm font-bold text-[#4e5968] shadow-sm">
          계좌 확인 중
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f6f7f9] text-[#191f28]">
      <TradingTopBar active={nextPath === "/supply-demand" ? "order-book" : "virtual-price"} />

      <section className="mx-auto grid min-h-[calc(100vh-65px)] w-full max-w-5xl content-center gap-5 px-4 py-8 sm:px-5 lg:grid-cols-[minmax(0,1fr)_360px] lg:px-8">
        <div className="min-w-0 rounded-lg bg-white p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04)] ring-1 ring-[#eef0f2] sm:p-8">
          <p className="text-xs font-bold tracking-wide text-[#3182f6]">STOCK ACCOUNT</p>
          <h1 className="mt-3 text-3xl font-black leading-tight sm:text-4xl">모의투자 계좌가 필요합니다</h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-[#6b7684]">
            주문, 보유수량, 예수금, 손익 기록은 주식계좌 기준으로 분리됩니다. 계좌를 만든 뒤 투자 화면으로 이동합니다.
          </p>

          <div className="mt-7 grid gap-3 sm:grid-cols-3">
            <AccountSetupMetric label="계좌 상태" value="미개설" />
            <AccountSetupMetric label="연결 사용자" value={user?.username ?? "사용자"} />
            <AccountSetupMetric label="권한" value={user?.role ?? "USER"} />
          </div>

          {message ? <p className="mt-5 rounded-md bg-[#eff6ff] px-4 py-3 text-sm font-semibold text-[#1b64da]">{message}</p> : null}
          {errorMessage || accountStatusQuery.isError ? (
            <p className="mt-3 rounded-md bg-[#fff6f6] px-4 py-3 text-sm font-semibold text-[#e42939]">
              {errorMessage ?? (accountStatusQuery.error instanceof Error ? accountStatusQuery.error.message : "계좌 상태를 확인하지 못했습니다.")}
            </p>
          ) : null}

          <div className="mt-7 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                setMessage(null);
                setErrorMessage(null);
                setIssuedAccount(null);
                openAccountMutation.mutate();
              }}
              disabled={openAccountMutation.isPending || reconnectAccountMutation.isPending}
              className="rounded-md bg-[#3182f6] px-5 py-3 text-sm font-black text-white disabled:cursor-wait disabled:bg-[#8bbcff]"
            >
              {openAccountMutation.isPending ? "계좌 준비 중" : "모의투자 계좌 만들기"}
            </button>
            <button
              type="button"
              onClick={() => void accountStatusQuery.refetch()}
              disabled={accountStatusQuery.isFetching}
              className="rounded-md bg-[#f2f4f6] px-5 py-3 text-sm font-bold text-[#333d4b] disabled:cursor-wait disabled:opacity-60"
            >
              {accountStatusQuery.isFetching ? "확인 중" : "기존 계좌 다시 확인"}
            </button>
          </div>

          {issuedAccount ? (
            <RecoveryCredentialPanel account={issuedAccount} onContinue={() => router.replace(nextPath)} />
          ) : null}

          <div className="mt-8 border-t border-[#eef0f2] pt-6">
            <p className="text-sm font-black text-[#191f28]">기존 계좌 복구 연결</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="min-w-0">
                <span className="text-xs font-bold text-[#6b7684]">계좌코드</span>
                <input
                  value={reconnectAccountCode}
                  onChange={(event) => setReconnectAccountCode(event.target.value)}
                  placeholder="STK-XXXXXXXXXXXX"
                  className="mt-2 w-full rounded-md border border-[#d1d6db] bg-white px-3 py-3 text-sm font-bold text-[#191f28] outline-none focus:border-[#3182f6]"
                />
              </label>
              <label className="min-w-0">
                <span className="text-xs font-bold text-[#6b7684]">복구코드</span>
                <input
                  value={reconnectRecoveryCode}
                  onChange={(event) => setReconnectRecoveryCode(event.target.value)}
                  placeholder="RC-XXXX-XXXX-XXXX"
                  className="mt-2 w-full rounded-md border border-[#d1d6db] bg-white px-3 py-3 text-sm font-bold text-[#191f28] outline-none focus:border-[#3182f6]"
                />
              </label>
            </div>
            <button
              type="button"
              onClick={() => {
                setMessage(null);
                setErrorMessage(null);
                setIssuedAccount(null);
                if (!reconnectAccountCode.trim() || !reconnectRecoveryCode.trim()) {
                  setErrorMessage("계좌코드와 복구코드를 모두 입력해 주세요.");
                  return;
                }
                reconnectAccountMutation.mutate({
                  accountCode: reconnectAccountCode.trim(),
                  recoveryCode: reconnectRecoveryCode.trim(),
                });
              }}
              disabled={openAccountMutation.isPending || reconnectAccountMutation.isPending}
              className="mt-4 rounded-md bg-[#191f28] px-5 py-3 text-sm font-black text-white disabled:cursor-wait disabled:opacity-60"
            >
              {reconnectAccountMutation.isPending ? "연결 중" : "계좌 복구 연결"}
            </button>
          </div>
        </div>

        <aside className="min-w-0 rounded-lg bg-[#191f28] p-5 text-white shadow-[0_1px_2px_rgba(0,0,0,0.08)]">
          <p className="text-sm font-bold text-[#b0b8c1]">진입 예정 화면</p>
          <p className="mt-2 break-words text-xl font-black">{formatNextLabel(nextPath)}</p>
          <div className="my-5 h-px bg-[#2b333f]" />
          <p className="text-xs font-semibold text-[#8b95a1]">사용자 키</p>
          <p className="mt-1 break-words text-sm font-black">{user?.userKey ?? "-"}</p>
          <p className="mt-5 text-sm font-semibold leading-6 text-[#d1d6db]">
            계좌 생성 이후부터 예수금, 주문 예약금, 보유수량, 체결 내역이 기록됩니다.
          </p>
        </aside>
      </section>
    </main>
  );
}

function AccountSetupMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-md bg-[#f9fafb] p-4">
      <p className="text-xs font-bold text-[#6b7684]">{label}</p>
      <p className="mt-2 min-w-0 truncate text-sm font-black text-[#191f28]">{value}</p>
    </div>
  );
}

function RecoveryCredentialPanel({ account, onContinue }: { account: Account; onContinue: () => void }) {
  const isDetached = account.status === "DETACHED";

  return (
    <div className="mt-6 rounded-lg border border-[#d8e7ff] bg-[#f7fbff] p-4">
      <p className="text-sm font-black text-[#1b64da]">복구 정보</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <RecoveryValue label="계좌코드" value={account.accountCode ?? "-"} />
        <RecoveryValue label="복구코드" value={account.recoveryCode ?? "-"} />
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <RecoveryValue label="복구 가능 기한" value={isDetached ? formatDateTime(account.recoveryExpiresAt) : "계좌 분리 시점부터 30일"} />
        <RecoveryValue label="보관 만료" value={isDetached ? formatDateTime(account.purgeAfter) : "계좌 분리 시점부터 90일"} />
      </div>
      <button type="button" onClick={onContinue} className="mt-4 rounded-md bg-[#3182f6] px-5 py-3 text-sm font-black text-white">
        투자 화면으로 이동
      </button>
    </div>
  );
}

function RecoveryValue({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-md bg-white px-3 py-3 ring-1 ring-[#e5e8eb]">
      <p className="text-xs font-bold text-[#6b7684]">{label}</p>
      <p className="mt-1 break-all text-sm font-black text-[#191f28]">{value}</p>
    </div>
  );
}

function formatDateTime(value?: string | null) {
  if (!value) {
    return "-";
  }
  return value.replace("T", " ").slice(0, 16);
}

function sanitizeNextPath(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("://")) {
    return "/";
  }
  if (value.startsWith("/login") || value.startsWith("/account-required")) {
    return "/";
  }
  return value;
}

function formatNextLabel(nextPath: string) {
  if (nextPath === "/supply-demand") {
    return "수요와 공급 주문 체결";
  }
  return "특정가격 자동주문체결";
}
