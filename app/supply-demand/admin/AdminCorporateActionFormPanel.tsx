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
  const exRightsMinDate = currentSimulationDate;
  const subscriptionStartMinDate = draft.offeringType === "SHAREHOLDER_ALLOCATION"
    ? maxIsoDate(currentSimulationDate, addIsoDateDays(draft.exRightsDate, 1))
    : currentSimulationDate;
  const subscriptionEndMinDate = maxIsoDate(currentSimulationDate, draft.subscriptionStartDate);
  const paymentMinDate = maxIsoDate(currentSimulationDate, addIsoDateDays(draft.subscriptionEndDate, 1));
  const listingMinDate = maxIsoDate(
    currentSimulationDate,
    addIsoDateDays(draft.paymentDate || draft.subscriptionEndDate || draft.exRightsDate, 1),
  );

  return (
    <>
      <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_1fr_1fr_1.4fr_auto]">
        {draft.actionType === "STOCK_SPLIT" ? (
          <>
            <DarkInput label="분할 전" value={draft.splitFrom} onChange={draftSetters.setSplitFrom} placeholder="1" />
            <DarkInput label="분할 후" value={draft.splitTo} onChange={draftSetters.setSplitTo} placeholder="5" />
            <div />
          </>
        ) : draft.actionType === "CASH_DIVIDEND" ? (
          <>
            <DarkInput label="1주당 배당금" value={draft.actionDividendAmount} onChange={draftSetters.setActionDividendAmount} placeholder="1000" />
            <div />
            <div />
          </>
        ) : draft.actionType === "BONUS_ISSUE" || draft.actionType === "STOCK_DIVIDEND" ? (
          <>
            <DarkInput label="배정 주식수" value={draft.actionShares} onChange={draftSetters.setActionShares} placeholder="10000" />
            <div />
            <div />
          </>
        ) : draft.actionType === "DELISTING" ? (
          <>
            <DarkDateInput label="상장폐지일" value={draft.delistingDate} onChange={draftSetters.setDelistingDate} placeholder="2026-06-26" minDate={currentSimulationDate} />
            <div />
            <div />
          </>
        ) : (
          <>
            <DarkInput label="발행수" value={draft.actionShares} onChange={draftSetters.setActionShares} placeholder="50000" />
            <DarkInput label="발행가" value={draft.actionIssuePrice} onChange={draftSetters.setActionIssuePrice} placeholder="50000" />
            {draft.actionType === "PAID_IN_CAPITAL_INCREASE" ? (
              <DarkSelect label="모집 방식" value={draft.offeringType} onChange={(value) => draftSetters.setOfferingType(value as typeof draft.offeringType)}>
                <option value="SHAREHOLDER_ALLOCATION">주주배정</option>
                <option value="PUBLIC_OFFERING">일반공모</option>
              </DarkSelect>
            ) : (
              <div />
            )}
          </>
        )}
        <DarkInput label="메모" value={draft.actionDescription} onChange={draftSetters.setActionDescription} placeholder="선택 입력" />
        <button type="button" onClick={onSubmit} disabled={applyingAction} className="rounded-md bg-white px-3 py-3 text-sm font-black text-[#101418] disabled:opacity-50">
          {applyingAction ? "적용 중" : "이벤트 적용"}
        </button>
      </div>
      <div className="mt-3 grid gap-3 md:grid-cols-3">
        {draft.actionType === "PAID_IN_CAPITAL_INCREASE" ? (
          <>
            {draft.offeringType === "SHAREHOLDER_ALLOCATION" ? (
              <DarkDateInput label="권리락일" value={draft.exRightsDate} onChange={draftSetters.setExRightsDate} placeholder="2026-06-22" minDate={exRightsMinDate} />
            ) : null}
            <DarkDateInput label="청약 시작일" value={draft.subscriptionStartDate} onChange={draftSetters.setSubscriptionStartDate} placeholder="2026-06-23" minDate={subscriptionStartMinDate} />
            <DarkDateInput label="청약 마감일" value={draft.subscriptionEndDate} onChange={draftSetters.setSubscriptionEndDate} placeholder="2026-06-24" minDate={subscriptionEndMinDate} />
            <DarkDateInput label="납입일" value={draft.paymentDate} onChange={draftSetters.setPaymentDate} placeholder="2026-06-24" minDate={paymentMinDate} />
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
    </>
  );
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
