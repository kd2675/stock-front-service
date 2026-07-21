import { AdminFundFlowPanel } from "@/app/supply-demand/admin/AdminFundFlowPanel";
import type { CashAdjustmentType } from "@/app/supply-demand/admin/AdminCashAdjustmentPayloadHelpers";
import { DarkInput } from "@/app/supply-demand/admin/AdminFormControls";
import { formatWon } from "@/app/supply-demand/admin/AdminFormatters";
import type { FundFlow } from "@/app/types/stock";

export function AdminUserCashAdjustmentPanel({
  userKey,
  amount,
  loadingFundFlow,
  adjustingUserCashType,
  fundFlow,
  fundFlowUserKey,
  onUserKeyChange,
  onAmountChange,
  onLoadFundFlow,
  onAdjustCash,
}: {
  userKey: string;
  amount: string;
  loadingFundFlow: boolean;
  adjustingUserCashType: CashAdjustmentType | null;
  fundFlow: FundFlow | null;
  fundFlowUserKey: string | null;
  onUserKeyChange: (value: string) => void;
  onAmountChange: (value: string) => void;
  onLoadFundFlow: () => void;
  onAdjustCash: (adjustmentType: CashAdjustmentType) => void;
}) {
  const normalizedUserKey = userKey.trim();
  const loadedUserKey = fundFlowUserKey?.trim() ?? "";
  const accountConfirmed = fundFlow !== null && normalizedUserKey !== "" && normalizedUserKey === loadedUserKey;
  const parsedAmount = Number(amount.replaceAll(",", ""));
  const validAmount = Number.isFinite(parsedAmount) && parsedAmount > 0;
  const adjustmentDisabled = adjustingUserCashType !== null || !accountConfirmed || !validAmount;

  return (
    <section className="admin-panel mt-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-black">실제 유저 계좌 현금</h2>
          <p className="mt-1 text-xs font-bold text-stock-subtle">자동참여자가 아닌 로그인 유저의 모의투자 계좌에 입금하거나 회수합니다.</p>
        </div>
        <span className="text-xs font-bold text-admin-accent">stock_account_cash_flow 원장 기록</span>
      </div>
      <div className="mt-4 grid min-w-0 gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div className="rounded-md border border-white/10 bg-black/20 p-4">
          <h3 className="text-sm font-black text-white">1. 계좌 확인</h3>
          <p className="mt-1 text-xs font-bold text-stock-subtle">조정할 사용자와 현재 현금을 먼저 확인합니다.</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
            <DarkInput label="유저 식별키" value={userKey} onChange={onUserKeyChange} placeholder="userKey" />
            <button type="button" onClick={onLoadFundFlow} disabled={loadingFundFlow || normalizedUserKey === ""} className="min-h-11 self-end rounded-md bg-white px-4 py-3 text-sm font-black text-admin-canvas disabled:cursor-not-allowed disabled:opacity-45">{loadingFundFlow ? "조회 중" : "계좌 조회"}</button>
          </div>
          {accountConfirmed ? (
            <div className="mt-3 rounded-md border border-admin-success/25 bg-admin-success-surface/35 px-3 py-3">
              <p className="text-xs font-black text-admin-success">조회 확인됨</p>
              <div className="mt-1 flex flex-wrap items-end justify-between gap-2">
                <p className="break-all text-sm font-black text-white">{loadedUserKey}</p>
                <p className="text-lg font-black tabular-nums text-white">{formatWon(fundFlow.cashBalance)}</p>
              </div>
            </div>
          ) : (
            <p className="mt-3 rounded-md border border-dashed border-white/15 px-3 py-3 text-xs font-bold leading-5 text-stock-subtle">식별키를 변경하면 다시 조회해야 입금·회수 버튼이 활성화됩니다.</p>
          )}
        </div>

        <div className="rounded-md border border-white/10 bg-white/[0.035] p-4">
          <h3 className="text-sm font-black text-white">2. 현금 조정</h3>
          <p className="mt-1 text-xs font-bold text-stock-subtle">확인된 계좌에만 적용되며 모든 변경은 현금 원장에 기록됩니다.</p>
          <div className="mt-3">
            <DarkInput label="입금/회수 금액" value={amount} onChange={onAmountChange} placeholder="1,000,000" />
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button type="button" onClick={() => onAdjustCash("DEPOSIT")} disabled={adjustmentDisabled} className="min-h-11 rounded-md bg-stock-accent px-4 py-3 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-40">{adjustingUserCashType === "DEPOSIT" ? "입금 중" : "입금"}</button>
            <button
              type="button"
              onClick={() => {
                if (window.confirm(`${loadedUserKey} 계좌에서 ${formatWon(parsedAmount)}을 회수할까요?`)) onAdjustCash("WITHDRAW");
              }}
              disabled={adjustmentDisabled}
              className="min-h-11 rounded-md bg-admin-danger-surface px-4 py-3 text-sm font-black text-admin-danger disabled:cursor-not-allowed disabled:opacity-40"
            >
              {adjustingUserCashType === "WITHDRAW" ? "회수 중" : "회수"}
            </button>
          </div>
          {!validAmount && amount.trim() ? <p className="mt-2 text-xs font-bold text-admin-danger">0보다 큰 금액을 입력해 주세요.</p> : null}
        </div>
      </div>
      {fundFlow ? (
        <AdminFundFlowPanel userKey={fundFlowUserKey ?? userKey.trim()} fundFlow={fundFlow} />
      ) : (
        <div className="mt-4 rounded-md border border-white/10 bg-black/20 p-4 text-sm font-bold leading-6 text-stock-subtle">
          유저 식별키를 입력하고 흐름 조회를 누르면 입출금, 예약 현금, 거래 순현금, 배당 수입, 최근 현금 원장을 확인할 수 있습니다.
        </div>
      )}
    </section>
  );
}
