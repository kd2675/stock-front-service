"use client";

import { useQuery } from "@tanstack/react-query";
import type { UseFormReturn } from "react-hook-form";

import type {
  CreateInstrumentFormValues,
  CreateInstrumentPayload,
} from "@/app/lib/validation/adminSchemas";
import { cashDividendGuidanceQueryOptions } from "@/app/lib/react-query/stockMarketQueries";
import { getStockErrorMessage } from "@/app/lib/react-query/stockResult";
import { AdminCorporateActionFormPanel } from "@/app/supply-demand/admin/AdminCorporateActionFormPanel";
import { DarkSelect } from "@/app/supply-demand/admin/AdminFormControls";
import { AdminInitialIssueFormPanel } from "@/app/supply-demand/admin/AdminInitialIssueFormPanel";
import type { StockEventDraft, StockEventDraftSetters } from "@/app/supply-demand/admin/AdminStockEventTypes";
import type { CorporateActionType, OrderBookInstrument } from "@/app/types/stock";

export type { StockEventDraft, StockEventDraftSetters } from "@/app/supply-demand/admin/AdminStockEventTypes";

type AdminStockEventPanelProps = {
  mode: "instruments" | "actions";
  instruments: OrderBookInstrument[];
  createInstrumentForm: UseFormReturn<CreateInstrumentFormValues, unknown, CreateInstrumentPayload>;
  draft: StockEventDraft;
  draftSetters: StockEventDraftSetters;
  creatingInitialIssue: boolean;
  applyingAction: boolean;
  currentSimulationDate?: string;
  onSubmit: () => void;
};

export function AdminStockEventPanel({
  mode,
  instruments,
  createInstrumentForm,
  draft,
  draftSetters,
  creatingInitialIssue,
  applyingAction,
  currentSimulationDate,
  onSubmit,
}: AdminStockEventPanelProps) {
  const isInitialIssue = mode === "instruments";
  const guidanceSymbol = !isInitialIssue && draft.actionType === "CASH_DIVIDEND"
    ? draft.actionSymbol
    : "";
  const cashDividendGuidanceQuery = useQuery(cashDividendGuidanceQueryOptions(guidanceSymbol, {
    enabled: Boolean(guidanceSymbol),
    refetchIntervalMs: false,
  }));
  const cashDividendGuidanceErrorMessage = cashDividendGuidanceQuery.isError
    ? getStockErrorMessage(cashDividendGuidanceQuery.error, "현금배당 권유 기준을 조회하지 못했습니다.")
    : null;

  return (
    <section className="admin-panel mt-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-black">{isInitialIssue ? "신규 상장 등록" : "기업 이벤트 등록"}</h2>
          <p className="mt-1 text-xs font-bold text-stock-subtle">{isInitialIssue ? "종목과 발행 대기·잠금 보관원장만 생성합니다." : "상장 후 기업 이벤트의 일정과 처리 조건을 등록합니다."}</p>
        </div>
        <span className="text-xs font-bold text-admin-accent">{isInitialIssue ? "신규 종목" : "기존 종목"}</span>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-[1.2fr_1fr_2fr]">
        {isInitialIssue ? (
          <div className="grid content-center rounded-md border border-white/10 bg-black/20 px-3 py-2 text-sm font-black text-white">신규 상장</div>
        ) : (
          <DarkSelect label="이벤트 종류" value={draft.actionType} onChange={(value) => draftSetters.setActionType(value as CorporateActionType)}>
            <option value="PAID_IN_CAPITAL_INCREASE">유상증자</option>
            <option value="STOCK_SPLIT">액면분할</option>
            <option value="CASH_DIVIDEND">현금배당</option>
            <option value="BONUS_ISSUE">무상증자</option>
            <option value="STOCK_DIVIDEND">주식배당</option>
            <option value="DELISTING">상장폐지</option>
          </DarkSelect>
        )}
        {isInitialIssue ? (
          <div className="rounded-md border border-white/10 bg-black/20 px-3 py-2 text-xs font-bold text-stock-subtle">
            실행 중에도 종목과 INITIAL_ISSUE 보관원장을 CLOSED 상태로 준비할 수 있습니다.
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
          <div className="rounded-md border border-stock-danger/30 bg-admin-danger-surface px-3 py-2 text-xs font-bold text-admin-danger">
            ZERO_VALUE: 상장폐지일에 거래를 중단하고 보유 평가금액을 0원으로 반영합니다.
          </div>
        ) : (
          <div className="rounded-md border border-white/10 bg-black/20 px-3 py-2 text-xs font-bold text-stock-subtle">
            {isInitialIssue ? "인수계약과 LP는 실행 중에도 별도로 준비하며, 거래는 예약된 개장일부터 시작합니다." : "가격과 수량을 조정하는 이벤트는 열린 주문 정책을 먼저 검증합니다."}
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
          currentSimulationDate={currentSimulationDate}
          cashDividendGuidance={cashDividendGuidanceQuery.data}
          cashDividendGuidanceLoading={cashDividendGuidanceQuery.isLoading}
          cashDividendGuidanceErrorMessage={cashDividendGuidanceErrorMessage}
          onRetryCashDividendGuidance={() => void cashDividendGuidanceQuery.refetch()}
          onSubmit={onSubmit}
        />
      )}
    </section>
  );
}
