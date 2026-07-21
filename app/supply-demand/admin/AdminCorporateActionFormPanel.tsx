import { DarkDateInput, DarkInput, DarkSelect } from "@/app/supply-demand/admin/AdminFormControls";
import type { StockEventDraft, StockEventDraftSetters } from "@/app/supply-demand/admin/AdminStockEventTypes";

type AdminCorporateActionFormPanelProps = {
  applyingAction: boolean;
  draft: StockEventDraft;
  draftSetters: StockEventDraftSetters;
  currentSimulationDate?: string;
  onSubmit: () => void;
};

export function AdminCorporateActionFormPanel({
  applyingAction,
  draft,
  draftSetters,
  currentSimulationDate,
  onSubmit,
}: AdminCorporateActionFormPanelProps) {
  const exRightsMinDate = addIsoDateDays(currentSimulationDate, 1);
  const subscriptionStartMinDate = draft.offeringType === "SHAREHOLDER_ALLOCATION"
    ? maxIsoDate(currentSimulationDate, addIsoDateDays(draft.exRightsDate, 1))
    : currentSimulationDate;
  const subscriptionEndMinDate = maxIsoDate(currentSimulationDate, draft.subscriptionStartDate);
  const paymentReferenceDate = draft.actionType === "CASH_DIVIDEND"
    ? draft.exRightsDate
    : draft.subscriptionEndDate;
  const paymentMinDate = maxIsoDate(currentSimulationDate, addIsoDateDays(paymentReferenceDate, 1));
  const listingMinDate = maxIsoDate(
    currentSimulationDate,
    addIsoDateDays(draft.paymentDate || draft.subscriptionEndDate || draft.exRightsDate, 1),
  );
  const simulationDateAvailable = isIsoDate(currentSimulationDate);
  const dangerousAction = draft.actionType === "DELISTING" || draft.actionType === "STOCK_SPLIT";

  const submitAction = () => {
    if (!dangerousAction || window.confirm(`${formatActionType(draft.actionType)} 이벤트를 현재 입력값으로 등록할까요? 등록 후 장마감·개장 준비 단계에 영향을 줄 수 있습니다.`)) {
      onSubmit();
    }
  };

  return (
    <>
      <div className="mt-4 rounded-md border border-white/10 bg-black/20 p-4">
        <div>
          <h3 className="text-sm font-black text-white">수량·가격 조건</h3>
          <p className="mt-1 text-xs font-bold text-stock-subtle">선택한 이벤트에 필요한 값만 입력합니다.</p>
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {draft.actionType === "STOCK_SPLIT" ? (
          <>
            <DarkInput label="분할 전" value={draft.splitFrom} onChange={draftSetters.setSplitFrom} placeholder="1" inputMode="numeric" />
            <DarkInput label="분할 후" value={draft.splitTo} onChange={draftSetters.setSplitTo} placeholder="5" inputMode="numeric" />
          </>
        ) : draft.actionType === "CASH_DIVIDEND" ? (
          <DarkInput label="1주당 배당금" value={draft.actionDividendAmount} onChange={draftSetters.setActionDividendAmount} placeholder="1000" inputMode="decimal" />
        ) : draft.actionType === "BONUS_ISSUE" || draft.actionType === "STOCK_DIVIDEND" ? (
          <DarkInput label="배정 주식수" value={draft.actionShares} onChange={draftSetters.setActionShares} placeholder="10000" inputMode="numeric" />
        ) : draft.actionType === "DELISTING" ? (
          <DarkDateInput label="상장폐지일" value={draft.delistingDate} onChange={draftSetters.setDelistingDate} placeholder="2026-06-26" minDate={currentSimulationDate} />
        ) : (
          <>
            <DarkInput label="발행수" value={draft.actionShares} onChange={draftSetters.setActionShares} placeholder="50000" inputMode="numeric" />
            <DarkInput label="발행가" value={draft.actionIssuePrice} onChange={draftSetters.setActionIssuePrice} placeholder="50000" inputMode="decimal" />
            {draft.actionType === "PAID_IN_CAPITAL_INCREASE" ? (
              <DarkSelect label="모집 방식" value={draft.offeringType} onChange={(value) => draftSetters.setOfferingType(value as typeof draft.offeringType)}>
                <option value="SHAREHOLDER_ALLOCATION">주주배정</option>
                <option value="PUBLIC_OFFERING">일반공모</option>
              </DarkSelect>
            ) : (
              null
            )}
          </>
        )}
        </div>
      </div>

      {draft.actionType === "PAID_IN_CAPITAL_INCREASE" ? (
        <div className="mt-3 grid gap-2 rounded-md border border-admin-accent/20 bg-admin-accent-surface/40 p-3 text-xs font-bold leading-5 text-admin-muted sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
          <p>
            {draft.offeringType === "SHAREHOLDER_ALLOCATION"
              ? "주주배정은 권리락 처리로 계좌별 권리를 만든 뒤, 배정 수량 안에서 청약합니다."
              : "일반공모는 권리락 없이 전체 남은 모집 수량 안에서 선착순으로 청약합니다."}
          </p>
          <span className="rounded-sm bg-white/[0.06] px-2 py-1 text-admin-accent">
            {simulationDateAvailable ? `기준일 ${currentSimulationDate}` : "시뮬레이션 기준일 확인 필요"}
          </span>
        </div>
      ) : null}

      {draft.actionType !== "DELISTING" ? (
        <div className="mt-3 rounded-md border border-white/10 bg-white/[0.035] p-4">
          <div>
            <h3 className="text-sm font-black text-white">효력 일정</h3>
            <p className="mt-1 text-xs font-bold text-stock-subtle">권리락·청약·납입·상장 순서가 시뮬레이션 기준일 이후가 되도록 입력합니다.</p>
          </div>
          <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {draft.actionType === "PAID_IN_CAPITAL_INCREASE" ? (
          <>
            {draft.offeringType === "SHAREHOLDER_ALLOCATION" ? (
              <DarkDateInput label="권리락일" value={draft.exRightsDate} onChange={draftSetters.setExRightsDate} placeholder="2026-06-22" minDate={exRightsMinDate} />
            ) : null}
            <DarkDateInput label="청약 시작일" value={draft.subscriptionStartDate} onChange={draftSetters.setSubscriptionStartDate} placeholder="2026-06-23" minDate={subscriptionStartMinDate} />
            <DarkDateInput label="청약 마감일" value={draft.subscriptionEndDate} onChange={draftSetters.setSubscriptionEndDate} placeholder="2026-06-24" minDate={subscriptionEndMinDate} />
            <DarkDateInput label="납입일" value={draft.paymentDate} onChange={draftSetters.setPaymentDate} placeholder="2026-06-25" minDate={paymentMinDate} />
            <DarkDateInput label="신주상장일" value={draft.listingDate} onChange={draftSetters.setListingDate} placeholder="2026-06-26" minDate={listingMinDate} />
          </>
        ) : null}
        {draft.actionType === "STOCK_SPLIT" ? (
          <DarkDateInput label="효력일" value={draft.listingDate} onChange={draftSetters.setListingDate} placeholder="2026-06-26" minDate={currentSimulationDate} />
        ) : null}
        {draft.actionType === "CASH_DIVIDEND" ? (
          <>
            <DarkDateInput label="배당락일" value={draft.exRightsDate} onChange={draftSetters.setExRightsDate} placeholder="2026-06-22" minDate={exRightsMinDate} />
            <DarkDateInput label="지급일" value={draft.paymentDate} onChange={draftSetters.setPaymentDate} placeholder="2026-06-26" minDate={paymentMinDate} />
          </>
        ) : null}
        {draft.actionType === "BONUS_ISSUE" || draft.actionType === "STOCK_DIVIDEND" ? (
          <>
            <DarkDateInput label="권리락일" value={draft.exRightsDate} onChange={draftSetters.setExRightsDate} placeholder="2026-06-22" minDate={exRightsMinDate} />
            <DarkDateInput label="신주상장일" value={draft.listingDate} onChange={draftSetters.setListingDate} placeholder="2026-06-26" minDate={listingMinDate} />
          </>
        ) : null}
          </div>
        </div>
      ) : null}

      <div className="mt-3 rounded-md border border-white/10 bg-black/15 p-4">
        <h3 className="text-sm font-black text-white">등록 확인</h3>
        <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <DarkInput label={`메모 (${draft.actionDescription.length}/255)`} value={draft.actionDescription} onChange={draftSetters.setActionDescription} placeholder="이벤트 목적과 운영 메모를 입력하세요" maxLength={255} />
          <button type="button" onClick={submitAction} disabled={applyingAction || !simulationDateAvailable} className={[
            "min-h-11 rounded-md px-4 py-3 text-sm font-black focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-admin-accent disabled:cursor-not-allowed disabled:opacity-50",
            dangerousAction ? "bg-admin-danger-surface text-admin-danger" : "bg-stock-accent text-white",
          ].join(" ")}>
            {applyingAction ? "등록 중" : simulationDateAvailable ? `${formatActionType(draft.actionType)} 등록` : "시간 확인 중"}
          </button>
        </div>
        {dangerousAction ? <p className="mt-2 text-xs font-bold leading-5 text-admin-danger">이 작업은 보유 수량·평가 가격·거래 가능 상태에 직접 영향을 줍니다. 등록 전 입력값을 다시 확인하세요.</p> : null}
      </div>
    </>
  );
}

function formatActionType(actionType: StockEventDraft["actionType"]) {
  if (actionType === "PAID_IN_CAPITAL_INCREASE") return "유상증자";
  if (actionType === "STOCK_SPLIT") return "액면분할";
  if (actionType === "CASH_DIVIDEND") return "현금배당";
  if (actionType === "BONUS_ISSUE") return "무상증자";
  if (actionType === "STOCK_DIVIDEND") return "주식배당";
  return "상장폐지";
}

function maxIsoDate(...values: Array<string | null | undefined>) {
  return values.filter(isIsoDate).sort().at(-1);
}

function addIsoDateDays(value: string | null | undefined, days: number) {
  if (!isIsoDate(value)) {
    return undefined;
  }
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + days));
  return [
    date.getUTCFullYear().toString().padStart(4, "0"),
    (date.getUTCMonth() + 1).toString().padStart(2, "0"),
    date.getUTCDate().toString().padStart(2, "0"),
  ].join("-");
}

function isIsoDate(value: string | null | undefined): value is string {
  return /^\d{4}-\d{2}-\d{2}$/.test(value ?? "");
}
