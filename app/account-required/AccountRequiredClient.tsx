"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";

import { TradingStatusScreen } from "@/app/components/TradingStatusBox";
import useAuthSession from "@/app/hooks/useAuthSession";
import { sanitizeAccountNextPath } from "@/app/lib/accountRouting";
import { getAccessTokenForAuthStatus } from "@/app/lib/auth";
import { buildLoginPath, currentBrowserPath } from "@/app/lib/authRouting";
import { invalidateAccountStatusQueries } from "@/app/lib/react-query/stockInvalidations";
import { openAccountMutationOptions, reconnectAccountMutationOptions } from "@/app/lib/react-query/stockMutations";
import { accountStatusQueryOptions } from "@/app/lib/react-query/stockAccountQueries";
import { isEnabledWithAuthenticatedSession } from "@/app/lib/react-query/stockQueryCore";
import { createStockErrorMessageHandler } from "@/app/lib/react-query/stockResult";
import { resolveFirstFieldErrorMessage } from "@/app/lib/validation/formErrors";
import type { Account } from "@/app/types/stock";

import { AccountRequiredLayout } from "./AccountRequiredPanels";

const reconnectAccountSchema = z.object({
  accountCode: z.string().trim().min(1, "계좌코드를 입력해 주세요."),
  recoveryCode: z.string().trim().min(1, "복구코드를 입력해 주세요."),
});

type ReconnectAccountFormValues = z.input<typeof reconnectAccountSchema>;
type ReconnectAccountPayload = z.output<typeof reconnectAccountSchema>;

export default function AccountRequiredClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { isHydrated, authStatus, user } = useAuthSession();
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [issuedAccount, setIssuedAccount] = useState<Account | null>(null);
  const reconnectForm = useForm<ReconnectAccountFormValues, unknown, ReconnectAccountPayload>({
    resolver: zodResolver(reconnectAccountSchema),
    defaultValues: {
      accountCode: "",
      recoveryCode: "",
    },
  });
  const reconnectAccountCode = useWatch({ control: reconnectForm.control, name: "accountCode" });
  const reconnectRecoveryCode = useWatch({ control: reconnectForm.control, name: "recoveryCode" });
  const nextPath = useMemo(() => sanitizeAccountNextPath(searchParams.get("next")), [searchParams]);
  const token = getAccessTokenForAuthStatus(authStatus);
  const setOpenAccountErrorMessage = createStockErrorMessageHandler(setErrorMessage, "계좌 개설에 실패했습니다.");
  const setReconnectAccountErrorMessage = createStockErrorMessageHandler(setErrorMessage, "계좌 복구 연결에 실패했습니다.");
  const accountStatusQuery = useQuery(accountStatusQueryOptions(token, {
    enabled: isEnabledWithAuthenticatedSession({ authStatus, isHydrated, token }),
  }));
  const openAccountMutation = useMutation({
    ...openAccountMutationOptions(),
    onSuccess: async (account) => {
      setIssuedAccount(account);
      setErrorMessage(null);
      setMessage(account.recoveryCode ? "모의투자 계좌가 준비되었습니다. 복구코드를 저장한 뒤 이동하세요." : "모의투자 계좌가 준비되었습니다.");
      await invalidateAccountStatusQueries(queryClient);
    },
    onError: (error) => {
      setMessage(null);
      setOpenAccountErrorMessage(error);
    },
  });
  const reconnectAccountMutation = useMutation({
    ...reconnectAccountMutationOptions(),
    onSuccess: async (account) => {
      setIssuedAccount(account);
      setErrorMessage(null);
      setMessage("기존 모의투자 계좌가 현재 사용자에게 연결되었습니다. 새 복구코드를 저장하세요.");
      reconnectForm.reset();
      await invalidateAccountStatusQueries(queryClient);
    },
    onError: (error) => {
      setMessage(null);
      setReconnectAccountErrorMessage(error);
    },
  });

  useEffect(() => {
    if (!isHydrated || authStatus === "unknown") {
      return;
    }
    if (authStatus === "out") {
      router.replace(buildLoginPath(currentBrowserPath()));
      return;
    }
    if (accountStatusQuery.data?.hasAccount && !issuedAccount) {
      router.replace(nextPath);
    }
  }, [accountStatusQuery.data?.hasAccount, authStatus, isHydrated, issuedAccount, nextPath, router]);

  const submitReconnect = reconnectForm.handleSubmit((values) => {
    setMessage(null);
    setErrorMessage(null);
    setIssuedAccount(null);
    reconnectAccountMutation.mutate(values);
  }, (errors) => {
    setMessage(null);
    setIssuedAccount(null);
    setErrorMessage(resolveFirstFieldErrorMessage(errors, "계좌코드와 복구코드를 모두 입력해 주세요."));
  });

  const updateReconnectField = (fieldName: keyof ReconnectAccountFormValues, value: string) => {
    reconnectForm.setValue(fieldName, value, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: false,
    });
    setErrorMessage(null);
  };

  if (!isHydrated || authStatus === "unknown" || accountStatusQuery.isPending) {
    return <TradingStatusScreen backgroundClassName="bg-stock-canvas">계좌 확인 중</TradingStatusScreen>;
  }

  return (
    <AccountRequiredLayout
      accountStatusErrorMessage={accountStatusQuery.isError ? (accountStatusQuery.error instanceof Error ? accountStatusQuery.error.message : "계좌 상태를 확인하지 못했습니다.") : null}
      errorMessage={errorMessage}
      issuedAccount={issuedAccount}
      message={message}
      nextPath={nextPath}
      openAccountPending={openAccountMutation.isPending}
      reconnectAccountCode={reconnectAccountCode}
      reconnectPending={reconnectAccountMutation.isPending}
      reconnectRecoveryCode={reconnectRecoveryCode}
      statusFetching={accountStatusQuery.isFetching}
      user={user}
      onContinue={() => router.replace(nextPath)}
      onOpenAccount={() => {
        setMessage(null);
        setErrorMessage(null);
        setIssuedAccount(null);
        openAccountMutation.mutate();
      }}
      onReconnect={() => {
        void submitReconnect();
      }}
      onReconnectAccountCodeChange={(value) => updateReconnectField("accountCode", value)}
      onReconnectRecoveryCodeChange={(value) => updateReconnectField("recoveryCode", value)}
      onRefetchAccount={() => void accountStatusQuery.refetch()}
    />
  );
}
