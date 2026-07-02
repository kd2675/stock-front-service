import { DarkInput } from "@/app/supply-demand/admin/AdminFormControls";
import type { StockEventDraft, StockEventDraftSetters } from "@/app/supply-demand/admin/AdminStockEventTypes";

type AdminCorporateActionFormPanelProps = {
  applyingAction: boolean;
  draft: StockEventDraft;
  draftSetters: StockEventDraftSetters;
  onSubmit: () => void;
};

export function AdminCorporateActionFormPanel({
  applyingAction,
  draft,
  draftSetters,
  onSubmit,
}: AdminCorporateActionFormPanelProps) {
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
            <DarkInput label="상장폐지일" value={draft.delistingDate} onChange={draftSetters.setDelistingDate} placeholder="2026-06-26" type="date" />
            <div />
            <div />
          </>
        ) : (
          <>
            <DarkInput label="발행수" value={draft.actionShares} onChange={draftSetters.setActionShares} placeholder="50000" />
            <DarkInput label="발행가" value={draft.actionIssuePrice} onChange={draftSetters.setActionIssuePrice} placeholder="50000" />
            <div />
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
            <DarkInput label="권리락일" value={draft.exRightsDate} onChange={draftSetters.setExRightsDate} placeholder="2026-06-22" type="date" />
            <DarkInput label="납입일" value={draft.paymentDate} onChange={draftSetters.setPaymentDate} placeholder="2026-06-24" type="date" />
            <DarkInput label="신주상장일" value={draft.listingDate} onChange={draftSetters.setListingDate} placeholder="2026-06-26" type="date" />
          </>
        ) : null}
        {draft.actionType === "ADDITIONAL_ISSUE" ? (
          <DarkInput label="신주상장일" value={draft.listingDate} onChange={draftSetters.setListingDate} placeholder="2026-06-26" type="date" />
        ) : null}
        {draft.actionType === "STOCK_SPLIT" ? (
          <DarkInput label="효력일" value={draft.listingDate} onChange={draftSetters.setListingDate} placeholder="2026-06-26" type="date" />
        ) : null}
        {draft.actionType === "CASH_DIVIDEND" ? (
          <>
            <DarkInput label="배당락일" value={draft.exRightsDate} onChange={draftSetters.setExRightsDate} placeholder="2026-06-22" type="date" />
            <DarkInput label="지급일" value={draft.paymentDate} onChange={draftSetters.setPaymentDate} placeholder="2026-06-26" type="date" />
          </>
        ) : null}
        {draft.actionType === "BONUS_ISSUE" || draft.actionType === "STOCK_DIVIDEND" ? (
          <>
            <DarkInput label="권리락일" value={draft.exRightsDate} onChange={draftSetters.setExRightsDate} placeholder="2026-06-22" type="date" />
            <DarkInput label="신주상장일" value={draft.listingDate} onChange={draftSetters.setListingDate} placeholder="2026-06-26" type="date" />
          </>
        ) : null}
      </div>
    </>
  );
}
