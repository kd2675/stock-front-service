"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { upsertInstitutionPortfolioQueryData } from "@/app/lib/react-query/stockCacheUpdates";
import { adminAdjustInstitutionPortfolioCashMutationOptions } from "@/app/lib/react-query/stockMutations";
import { getAdminActionData } from "@/app/supply-demand/admin/AdminActionResultHelpers";
import { formatCompactWon } from "@/app/supply-demand/admin/AdminFormatters";
import type { InstitutionPortfolio } from "@/app/types/stock";

type AdjustmentType = "DEPOSIT" | "WITHDRAW";

type Feedback = {
  tone: "success" | "error";
  message: string;
};

export function AdminInstitutionCashAdjustment({
  accessToken,
  portfolio,
}: {
  accessToken: string | null;
  portfolio: InstitutionPortfolio;
}) {
  const queryClient = useQueryClient();
  const mutation = useMutation(adminAdjustInstitutionPortfolioCashMutationOptions());
  const [amount, setAmount] = useState("");
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const normalizedAmount = parseCashAmount(amount);
  const validAmount = normalizedAmount !== null && normalizedAmount > 0;

  const adjustCash = async (adjustmentType: AdjustmentType) => {
    if (!accessToken || mutation.isPending || !validAmount) {
      return;
    }
    if (adjustmentType === "WITHDRAW" && normalizedAmount > portfolio.cashBalance) {
      setFeedback({
        tone: "error",
        message: "회수 금액은 매수 예약금을 제외한 가용 현금을 초과할 수 없습니다.",
      });
      return;
    }
    const actionLabel = adjustmentType === "DEPOSIT" ? "입금" : "회수";
    const confirmed = window.confirm(
      [
        `${portfolio.displayName} 계좌에 ${formatCompactWon(normalizedAmount)}을 ${actionLabel}합니다.`,
        `입금 계좌 ID: ${portfolio.accountUserKey ?? "미설정"}`,
        "현금 원장에 관리자 조정으로 기록되며, 다음 기관 결정부터 현재 AUM과 위험 한도가 다시 계산됩니다. 기존 미체결 주문의 예약금은 바뀌지 않습니다.",
      ].join("\n\n"),
    );
    if (!confirmed) {
      return;
    }

    setFeedback(null);
    const result = await mutation.mutateAsync({
      token: accessToken,
      portfolioId: portfolio.portfolioId,
      payload: {
        adjustmentType,
        amount: normalizedAmount,
      },
    });
    const updated = getAdminActionData(
      result,
      `기관 계좌 ${actionLabel}에 실패했습니다.`,
    );
    if (!updated.ok) {
      setFeedback({ tone: "error", message: updated.message });
      return;
    }
    upsertInstitutionPortfolioQueryData(queryClient, updated.data);
    setAmount("");
    setFeedback({
      tone: "success",
      message: `${actionLabel} 완료 · 가용 현금 ${formatCompactWon(updated.data.cashBalance)} · AUM ${formatCompactWon(updated.data.totalAsset)}`,
    });
  };

  return (
    <section className="mt-3 rounded-md border border-white/10 bg-white/[0.025] p-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-[220px] flex-1">
          <h4 className="text-xs font-black text-white">기관 현금 입금·회수</h4>
          <p className="mt-1 text-[10px] font-bold leading-5 text-stock-subtle">
            원장 기준 외부 현금 조정입니다. 가용 현금만 회수할 수 있고 매수 예약금은 유지되며, 조정 후 AUM·목표 금액·회전 한도는 다음 결정에서 현재 자산 기준으로 재계산됩니다.
          </p>
          <label className="mt-2 grid max-w-sm gap-1 text-[10px] font-black text-admin-muted">
            조정 금액
            <input
              inputMode="decimal"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              placeholder="1,000,000"
              className="admin-control px-3 text-xs font-bold tabular-nums"
            />
          </label>
        </div>
        <div className="grid min-w-[220px] gap-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => void adjustCash("DEPOSIT")}
            disabled={!accessToken || mutation.isPending || !validAmount}
            className="min-h-9 rounded-md bg-admin-success-surface px-3 text-xs font-black text-admin-success disabled:cursor-not-allowed disabled:opacity-45"
          >
            {mutation.isPending ? "처리 중" : "현금 입금"}
          </button>
          <button
            type="button"
            onClick={() => void adjustCash("WITHDRAW")}
            disabled={!accessToken || mutation.isPending || !validAmount}
            className="min-h-9 rounded-md bg-admin-danger-surface px-3 text-xs font-black text-admin-danger disabled:cursor-not-allowed disabled:opacity-45"
          >
            {mutation.isPending ? "처리 중" : "현금 회수"}
          </button>
        </div>
      </div>

      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[10px] font-bold text-admin-quiet">
        <span>가용 현금 {formatCompactWon(portfolio.cashBalance)}</span>
        <span>매수 예약 {formatCompactWon(portfolio.openBuyReservedCash)}</span>
        <span>AUM {formatCompactWon(portfolio.totalAsset)}</span>
      </div>

      {feedback ? (
        <p className={[
          "mt-2 rounded-md border px-3 py-2 text-[10px] font-bold leading-5",
          feedback.tone === "success"
            ? "border-admin-success/25 bg-admin-success-surface text-admin-success"
            : "border-admin-danger/25 bg-admin-danger-surface text-admin-danger",
        ].join(" ")}>
          {feedback.message}
        </p>
      ) : null}
    </section>
  );
}

function parseCashAmount(value: string) {
  const normalized = value.trim().replace(/,/g, "");
  if (!/^\d+(?:\.\d{1,2})?$/.test(normalized)) {
    return null;
  }
  const parsed = Number(normalized);
  return Number.isSafeInteger(Math.round(parsed * 100)) ? parsed : null;
}
