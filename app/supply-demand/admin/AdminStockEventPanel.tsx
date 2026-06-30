import type { UseFormReturn } from "react-hook-form";

import { DarkFormInput, DarkFormSelect, DarkInput, DarkSelect } from "@/app/supply-demand/admin/AdminFormControls";
import type { CreateInstrumentFormValues } from "@/app/lib/validation/adminSchemas";
import type { CorporateActionType, OrderBookInstrument } from "@/app/types/stock";

export type StockEventDraft = {
  actionType: CorporateActionType;
  actionSymbol: string;
  actionShares: string;
  actionIssuePrice: string;
  actionDividendAmount: string;
  exRightsDate: string;
  paymentDate: string;
  listingDate: string;
  delistingDate: string;
  splitFrom: string;
  splitTo: string;
  actionDescription: string;
};

export type StockEventDraftSetters = {
  setActionType: (value: CorporateActionType) => void;
  setActionSymbol: (value: string) => void;
  setActionShares: (value: string) => void;
  setActionIssuePrice: (value: string) => void;
  setActionDividendAmount: (value: string) => void;
  setExRightsDate: (value: string) => void;
  setPaymentDate: (value: string) => void;
  setListingDate: (value: string) => void;
  setDelistingDate: (value: string) => void;
  setSplitFrom: (value: string) => void;
  setSplitTo: (value: string) => void;
  setActionDescription: (value: string) => void;
};

type AdminStockEventPanelProps = {
  instruments: OrderBookInstrument[];
  createInstrumentForm: UseFormReturn<CreateInstrumentFormValues>;
  draft: StockEventDraft;
  draftSetters: StockEventDraftSetters;
  creatingInitialIssue: boolean;
  applyingAction: boolean;
  onSubmit: () => void;
};

export function AdminStockEventPanel({
  instruments,
  createInstrumentForm,
  draft,
  draftSetters,
  creatingInitialIssue,
  applyingAction,
  onSubmit,
}: AdminStockEventPanelProps) {
  const isInitialIssue = draft.actionType === "INITIAL_ISSUE";

  return (
    <section className="mt-5 rounded-lg border border-white/10 bg-white/[0.06] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-black">주식 이벤트 발생</h2>
          <p className="mt-1 text-xs font-bold text-[#8b95a1]">신규 상장과 상장 후 이벤트를 같은 흐름에서 적용합니다.</p>
        </div>
        <span className="text-xs font-bold text-[#64a8ff]">{isInitialIssue ? "신규 종목" : "기존 종목"}</span>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-[1.2fr_1fr_2fr]">
        <DarkSelect label="이벤트 종류" value={draft.actionType} onChange={(value) => draftSetters.setActionType(value as CorporateActionType)}>
          <option value="INITIAL_ISSUE">신규 상장</option>
          <option value="PAID_IN_CAPITAL_INCREASE">유상증자</option>
          <option value="ADDITIONAL_ISSUE">추가발행</option>
          <option value="STOCK_SPLIT">액면분할</option>
          <option value="CASH_DIVIDEND">현금배당</option>
          <option value="BONUS_ISSUE">무상증자</option>
          <option value="STOCK_DIVIDEND">주식배당</option>
          <option value="DELISTING">상장폐지</option>
        </DarkSelect>
        {isInitialIssue ? (
          <div className="rounded-md border border-white/10 bg-black/20 px-3 py-2 text-xs font-bold text-[#8b95a1]">
            종목과 INITIAL_ISSUE 원장, 상장주관사 자동계정을 함께 생성합니다.
          </div>
        ) : (
          <DarkSelect label="종목" value={draft.actionSymbol} onChange={draftSetters.setActionSymbol}>
            <option value="">선택</option>
            {instruments.map((instrument) => (
              <option key={instrument.symbol} value={instrument.symbol}>{instrument.symbol}</option>
            ))}
          </DarkSelect>
        )}
        {draft.actionType === "DELISTING" ? (
          <div className="rounded-md border border-[#f04452]/30 bg-[#3a1f1b] px-3 py-2 text-xs font-bold text-[#ffb4a8]">
            ZERO_VALUE: 상장폐지일에 거래를 중단하고 보유 평가금액을 0원으로 반영합니다.
          </div>
        ) : (
          <div className="rounded-md border border-white/10 bg-black/20 px-3 py-2 text-xs font-bold text-[#8b95a1]">
            {isInitialIssue ? "초기 전량 매도벽 없이 주관사 자동계정이 호가를 공급합니다." : "가격과 수량을 조정하는 이벤트는 열린 주문 정책을 먼저 검증합니다."}
          </div>
        )}
      </div>

      {isInitialIssue ? (
        <div className="mt-4 grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <DarkFormInput label="종목 코드" registration={createInstrumentForm.register("symbol")} placeholder="예: DEMO001" error={createInstrumentForm.formState.errors.symbol?.message} />
          <DarkFormInput label="종목명" registration={createInstrumentForm.register("name")} placeholder="예: 제로큐 주문장" error={createInstrumentForm.formState.errors.name?.message} className="sm:col-span-2 lg:col-span-2" />
          <DarkFormInput label="시장" registration={createInstrumentForm.register("market")} placeholder="ORDERBOOK" error={createInstrumentForm.formState.errors.market?.message} />
          <DarkFormInput label="초기 가격" registration={createInstrumentForm.register("initialPrice")} placeholder="70000" error={createInstrumentForm.formState.errors.initialPrice?.message} />
          <DarkFormInput label="발행주식수" registration={createInstrumentForm.register("issuedShares")} placeholder="100000" error={createInstrumentForm.formState.errors.issuedShares?.message} />
          <DarkFormInput label="호가 단위" registration={createInstrumentForm.register("tickSize")} placeholder="100" error={createInstrumentForm.formState.errors.tickSize?.message} />
          <DarkFormInput label="가격제한폭(%)" registration={createInstrumentForm.register("priceLimitRate")} placeholder="30" error={createInstrumentForm.formState.errors.priceLimitRate?.message} />
          <DarkFormInput label="주관사 표시명" registration={createInstrumentForm.register("listingAutoDisplayName")} placeholder="미입력 시 자동 생성" error={createInstrumentForm.formState.errors.listingAutoDisplayName?.message} className="sm:col-span-2" />
          <DarkFormSelect label="주관사 상태" registration={createInstrumentForm.register("listingAutoEnabled")}>
            <option value="true">가동</option>
            <option value="false">정지</option>
          </DarkFormSelect>
          <DarkFormSelect label="주관사 포지션" registration={createInstrumentForm.register("listingAutoPositionSide")}>
            <option value="SELL_ONLY">매도 전용</option>
            <option value="BUY_ONLY">매수 전용</option>
          </DarkFormSelect>
          <DarkFormInput label="주관사 최대 수량" registration={createInstrumentForm.register("listingAutoMaxOrderQuantity")} placeholder="100" error={createInstrumentForm.formState.errors.listingAutoMaxOrderQuantity?.message} />
          <DarkFormInput label="주관사 호가 TTL(초)" registration={createInstrumentForm.register("listingAutoOrderTtlSeconds")} placeholder="30" error={createInstrumentForm.formState.errors.listingAutoOrderTtlSeconds?.message} />
          <DarkFormInput label="가격 분산 틱" registration={createInstrumentForm.register("listingAutoPriceOffsetTicks")} placeholder="3" error={createInstrumentForm.formState.errors.listingAutoPriceOffsetTicks?.message} />
          <button type="button" onClick={onSubmit} disabled={creatingInitialIssue} className="min-h-11 min-w-0 self-end rounded-md bg-white px-3 py-3 text-sm font-black text-[#101418] disabled:opacity-50 sm:col-span-2 lg:col-span-1">
            {creatingInitialIssue ? "적용 중" : "이벤트 적용"}
          </button>
        </div>
      ) : (
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
      )}
    </section>
  );
}
