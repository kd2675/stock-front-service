import { AdminFundFlowPanel } from "@/app/supply-demand/admin/AdminFundFlowPanel";
import type { CashAdjustmentType } from "@/app/supply-demand/admin/AdminCashAdjustmentPayloadHelpers";
import { DarkInput } from "@/app/supply-demand/admin/AdminFormControls";
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
  return (
    <section className="admin-panel mt-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-black">실제 유저 계좌 현금</h2>
          <p className="mt-1 text-xs font-bold text-stock-subtle">자동참여자가 아닌 로그인 유저의 모의투자 계좌에 입금하거나 회수합니다.</p>
        </div>
        <span className="text-xs font-bold text-admin-accent">stock_account_cash_flow 원장 기록</span>
      </div>
      <div className="mt-4 grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_auto_auto_auto]">
        <DarkInput label="유저 식별키" value={userKey} onChange={onUserKeyChange} placeholder="userKey" />
        <DarkInput label="입금/회수 금액" value={amount} onChange={onAmountChange} placeholder="1,000,000" />
        <button
          type="button"
          onClick={onLoadFundFlow}
          disabled={loadingFundFlow}
          className="min-h-11 rounded-md bg-white px-4 py-3 text-sm font-black text-admin-canvas disabled:cursor-wait disabled:opacity-55"
        >
          {loadingFundFlow ? "조회 중" : "흐름 조회"}
        </button>
        <button
          type="button"
          onClick={() => onAdjustCash("DEPOSIT")}
          disabled={adjustingUserCashType !== null}
          className="min-h-11 rounded-md bg-stock-danger px-4 py-3 text-sm font-black text-white disabled:opacity-50"
        >
          {adjustingUserCashType === "DEPOSIT" ? "입금 중" : "입금"}
        </button>
        <button
          type="button"
          onClick={() => onAdjustCash("WITHDRAW")}
          disabled={adjustingUserCashType !== null}
          className="min-h-11 rounded-md bg-stock-accent px-4 py-3 text-sm font-black text-white disabled:opacity-50"
        >
          {adjustingUserCashType === "WITHDRAW" ? "회수 중" : "회수"}
        </button>
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
