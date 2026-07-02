import type { UseFormReturn } from "react-hook-form";

import type {
  CreateInstrumentFormValues,
  CreateInstrumentPayload,
} from "@/app/lib/validation/adminSchemas";
import { AdminCorporateActionFormPanel } from "@/app/supply-demand/admin/AdminCorporateActionFormPanel";
import { DarkSelect } from "@/app/supply-demand/admin/AdminFormControls";
import { AdminInitialIssueFormPanel } from "@/app/supply-demand/admin/AdminInitialIssueFormPanel";
import type { StockEventDraft, StockEventDraftSetters } from "@/app/supply-demand/admin/AdminStockEventTypes";
import type { CorporateActionType, OrderBookInstrument } from "@/app/types/stock";

export type { StockEventDraft, StockEventDraftSetters } from "@/app/supply-demand/admin/AdminStockEventTypes";

type AdminStockEventPanelProps = {
  instruments: OrderBookInstrument[];
  createInstrumentForm: UseFormReturn<CreateInstrumentFormValues, unknown, CreateInstrumentPayload>;
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
        <AdminInitialIssueFormPanel
          createInstrumentForm={createInstrumentForm}
          creatingInitialIssue={creatingInitialIssue}
          onSubmit={onSubmit}
        />
      ) : (
        <AdminCorporateActionFormPanel
          applyingAction={applyingAction}
          draft={draft}
          draftSetters={draftSetters}
          onSubmit={onSubmit}
        />
      )}
    </section>
  );
}
