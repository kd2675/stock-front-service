import { useRef, useState } from "react";

import useModalDialog from "@/app/hooks/useModalDialog";
import { formatCount, formatWon } from "@/app/supply-demand/admin/AdminFormatters";
import { FundFlowLine, SalaryMetric } from "@/app/supply-demand/admin/AdminMetricCards";
import { AdminTotalAssetHistoryModal } from "@/app/supply-demand/admin/AdminTotalAssetHistoryModal";
import type { AdminAssetHistoryMetric } from "@/app/supply-demand/admin/adminTotalAssetHistoryMetrics";
import type { AdminFundFlowSummary, AdminTotalAssetHistoryPage } from "@/app/types/stock";

export function AdminFlowFundSummaryPanel({
  fundFlow,
  allFundFlow,
  loading,
  loadingAll,
  error,
  allError,
  onLoadAll,
  onLoadTotalAssetHistory,
}: {
  fundFlow: AdminFundFlowSummary | null;
  allFundFlow: AdminFundFlowSummary | null;
  loading: boolean;
  loadingAll: boolean;
  error: boolean;
  allError: boolean;
  onLoadAll: () => void;
  onLoadTotalAssetHistory: (page: number) => Promise<AdminTotalAssetHistoryPage | null>;
}) {
  const [showAllFundFlow, setShowAllFundFlow] = useState(false);
  const [showTotalAssetHistory, setShowTotalAssetHistory] = useState(false);
  const [totalAssetHistoryMetric, setTotalAssetHistoryMetric] = useState<AdminAssetHistoryMetric>("TOTAL_ASSET");
  const [totalAssetHistory, setTotalAssetHistory] = useState<AdminTotalAssetHistoryPage | null>(null);
  const [loadingTotalAssetHistory, setLoadingTotalAssetHistory] = useState(false);
  const [totalAssetHistoryError, setTotalAssetHistoryError] = useState(false);
  const totalAssetHistoryRequestIdRef = useRef(0);

  const openAllFundFlow = () => {
    setShowAllFundFlow(true);
    if (!allFundFlow && !loadingAll) {
      onLoadAll();
    }
  };

  const loadTotalAssetHistory = async (page: number) => {
    const requestId = ++totalAssetHistoryRequestIdRef.current;
    setLoadingTotalAssetHistory(true);
    setTotalAssetHistoryError(false);
    try {
      const nextHistory = await onLoadTotalAssetHistory(page);
      if (requestId !== totalAssetHistoryRequestIdRef.current) {
        return;
      }
      if (!nextHistory) {
        setTotalAssetHistoryError(true);
        return;
      }
      setTotalAssetHistory(nextHistory);
    } catch {
      if (requestId === totalAssetHistoryRequestIdRef.current) {
        setTotalAssetHistoryError(true);
      }
    } finally {
      if (requestId === totalAssetHistoryRequestIdRef.current) {
        setLoadingTotalAssetHistory(false);
      }
    }
  };

  const openTotalAssetHistory = (metric: AdminAssetHistoryMetric) => {
    setShowAllFundFlow(false);
    setTotalAssetHistoryMetric(metric);
    setTotalAssetHistory(null);
    setShowTotalAssetHistory(true);
    void loadTotalAssetHistory(0);
  };

  if (!fundFlow) {
    return (
      <>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-md border border-white/10 bg-black/20 p-4">
          <p className="text-sm font-bold leading-6 text-stock-subtle">
            {loading ? "시뮬레이션 하루 자금 흐름을 조회하고 있습니다." : error ? "시뮬레이션 하루 자금 흐름을 조회하지 못했습니다. 흐름 새로고침을 다시 눌러 주세요." : "시뮬레이션 하루 자금 흐름을 아직 조회하지 못했습니다."}
          </p>
          <button
            type="button"
            onClick={openAllFundFlow}
            className="min-h-9 rounded-md border border-white/15 px-3 py-2 text-xs font-black text-admin-accent-soft transition hover:border-admin-accent hover:text-white"
          >
            전체 보기
          </button>
        </div>
        <AdminAllFundFlowModal
          fundFlow={allFundFlow}
          loading={loadingAll}
          error={allError}
          open={showAllFundFlow}
          onClose={() => setShowAllFundFlow(false)}
          onRefresh={onLoadAll}
          onOpenTotalAssetHistory={openTotalAssetHistory}
        />
        <AdminTotalAssetHistoryModal history={totalAssetHistory} loading={loadingTotalAssetHistory} error={totalAssetHistoryError} open={showTotalAssetHistory} selectedMetric={totalAssetHistoryMetric} onMetricChange={setTotalAssetHistoryMetric} onClose={() => setShowTotalAssetHistory(false)} onLoadPage={(page) => void loadTotalAssetHistory(page)} />
      </>
    );
  }

  return (
    <>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-black text-white">시뮬레이션 자산·자금 현황</h3>
          <p className="mt-1 text-xs font-bold text-stock-subtle">현재 자산 구성과 보유량, 시뮬레이션 장 시작부터 지금까지의 입출금·체결·손익입니다. 체결 금액과 손익은 정상 집계 시 약 30초 늦을 수 있고, 장애·재기동 시에는 야간 원본 대사 후 확정됩니다.</p>
        </div>
        <button
          type="button"
          onClick={openAllFundFlow}
          className="min-h-9 rounded-md border border-white/15 px-3 py-2 text-xs font-black text-admin-accent-soft transition hover:border-admin-accent hover:text-white"
        >
          전체 보기
        </button>
      </div>

      <AdminFundFlowMetricGrids fundFlow={fundFlow} executionLabel="하루 체결 (비동기·보통 30초)" onOpenTotalAssetHistory={openTotalAssetHistory} />

      <AdminAllFundFlowModal
        fundFlow={allFundFlow}
        loading={loadingAll}
        error={allError}
        open={showAllFundFlow}
        onClose={() => setShowAllFundFlow(false)}
        onRefresh={onLoadAll}
        onOpenTotalAssetHistory={openTotalAssetHistory}
      />
      <AdminTotalAssetHistoryModal history={totalAssetHistory} loading={loadingTotalAssetHistory} error={totalAssetHistoryError} open={showTotalAssetHistory} selectedMetric={totalAssetHistoryMetric} onMetricChange={setTotalAssetHistoryMetric} onClose={() => setShowTotalAssetHistory(false)} onLoadPage={(page) => void loadTotalAssetHistory(page)} />
    </>
  );
}

function AdminFundFlowMetricGrids({
  fundFlow,
  executionLabel,
  onOpenTotalAssetHistory,
}: {
  fundFlow: AdminFundFlowSummary;
  executionLabel: string;
  onOpenTotalAssetHistory: (metric: AdminAssetHistoryMetric) => void;
}) {
  return (
    <>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <h4 className="text-xs font-black text-white">현재 자산 구성</h4>
        <span className="rounded-md bg-white/10 px-2 py-1 text-xs font-black text-admin-muted">
          활성 참여 계좌 {formatCount(fundFlow.activeAccountCount, "개")}
        </span>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <SalaryMetric label="전체 총자산" value={formatWon(fundFlow.totalAsset)} tone="good" actionHint="7일 변화" onClick={() => onOpenTotalAssetHistory("TOTAL_ASSET")} />
        <SalaryMetric label="가용 현금" value={formatWon(fundFlow.totalCashBalance)} tone="neutral" actionHint="7일 변화" onClick={() => onOpenTotalAssetHistory("CASH_BALANCE")} />
        <SalaryMetric label="매수·청약 예약금" value={formatWon(fundFlow.totalReservedBuyCash)} tone="warn" actionHint="7일 변화" onClick={() => onOpenTotalAssetHistory("RESERVED_CASH")} />
        <SalaryMetric label="보유 주식 평가액" value={formatWon(fundFlow.totalHoldingMarketValue)} tone="neutral" actionHint="7일 변화" onClick={() => onOpenTotalAssetHistory("MARKET_VALUE")} />
        <SalaryMetric label="총 보유량" value={formatCount(fundFlow.totalHoldingQuantity, "주")} tone="neutral" detail={`계좌별 보유 포지션 ${formatCount(fundFlow.holdingPositionCount, "건")}`} actionHint="7일 변화" onClick={() => onOpenTotalAssetHistory("HOLDING_QUANTITY")} />
        <SalaryMetric label="가용 보유량" value={formatCount(fundFlow.totalAvailableHoldingQuantity, "주")} tone="good" detail={`매도 예약 ${formatCount(fundFlow.totalReservedSellQuantity, "주")}`} actionHint="7일 변화" onClick={() => onOpenTotalAssetHistory("AVAILABLE_HOLDING_QUANTITY")} />
      </div>

      <AssetCompositionBar fundFlow={fundFlow} />

      <h4 className="mt-6 text-xs font-black text-white">자금·손익 흐름</h4>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <FundFlowLine label="순입금" value={formatWon(fundFlow.netExternalCashFlow)} />
        <FundFlowLine label="배당 수입" value={formatWon(fundFlow.dividendIncomeAmount)} />
        <FundFlowLine label="거래 순현금" value={formatWon(fundFlow.tradeNetCashFlow)} />
        <FundFlowLine label="수수료/세금" value={formatWon(fundFlow.totalFeeAmount + fundFlow.totalTaxAmount)} />
        <FundFlowLine label="매수 순유출" value={formatWon(fundFlow.buyNetAmount)} />
        <FundFlowLine label="매도 순유입" value={formatWon(fundFlow.sellNetAmount)} />
        <FundFlowLine label="실현 손익" value={formatWon(fundFlow.realizedProfit)} />
        <FundFlowLine label={executionLabel} value={formatCount(fundFlow.executionCount, "건")} />
      </div>
    </>
  );
}

function AssetCompositionBar({ fundFlow }: { fundFlow: AdminFundFlowSummary }) {
  const components = [
    { label: "가용 현금", value: Math.max(0, fundFlow.totalCashBalance), className: "bg-admin-accent" },
    { label: "매수·청약 예약금", value: Math.max(0, fundFlow.totalReservedBuyCash), className: "bg-admin-warning" },
    { label: "보유 주식 평가액", value: Math.max(0, fundFlow.totalHoldingMarketValue), className: "bg-admin-success" },
  ];
  const compositionTotal = components.reduce((sum, component) => sum + component.value, 0);
  const compositionLabel = components
    .map((component) => {
      const percentage = compositionTotal > 0
        ? ((component.value * 100) / compositionTotal).toFixed(1)
        : "0.0";
      return `${component.label} ${percentage}%`;
    })
    .join(", ");

  return (
    <div className="mt-3 rounded-md border border-white/10 bg-black/20 px-3 py-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[11px] font-black text-stock-subtle">총자산 구성 비중</p>
        <p className="text-[11px] font-bold text-admin-muted">현금 + 예약금 + 보유 주식 평가액</p>
      </div>
      {compositionTotal > 0 ? (
        <>
          <div className="mt-3 flex h-2 overflow-hidden rounded-full bg-white/10" role="img" aria-label={`총자산 구성 비중: ${compositionLabel}`}>
            {components.map((component) => (
              <span key={component.label} className={component.className} style={{ width: `${(component.value * 100) / compositionTotal}%` }} />
            ))}
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2">
            {components.map((component) => (
              <div key={component.label} className="inline-flex items-center gap-1.5 text-[11px]">
                <span aria-hidden="true" className={`h-2 w-2 shrink-0 rounded-full ${component.className}`} />
                <span className="font-bold text-stock-subtle">{component.label}</span>
                <span className="font-black tabular-nums text-white">{((component.value * 100) / compositionTotal).toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </>
      ) : (
        <p className="mt-3 text-xs font-bold text-admin-muted">구성 비중을 계산할 자산이 없습니다.</p>
      )}
    </div>
  );
}

function AdminAllFundFlowModal({
  fundFlow,
  loading,
  error,
  open,
  onClose,
  onRefresh,
  onOpenTotalAssetHistory,
}: {
  fundFlow: AdminFundFlowSummary | null;
  loading: boolean;
  error: boolean;
  open: boolean;
  onClose: () => void;
  onRefresh: () => void;
  onOpenTotalAssetHistory: (metric: AdminAssetHistoryMetric) => void;
}) {
  const dialogRef = useModalDialog<HTMLDivElement>(open, onClose);

  if (!open) {
    return null;
  }

  return (
    <div className="modal-scroll fixed inset-0 z-50 overflow-y-auto bg-black/70 px-4 py-8 backdrop-blur-sm">
      <div ref={dialogRef} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="all-fund-flow-title" className="mx-auto w-full max-w-5xl rounded-lg border border-white/10 bg-admin-modal p-4 shadow-[var(--shadow-dialog)] outline-none">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 id="all-fund-flow-title" className="text-base font-black text-white">전체 누적 자금 흐름</h3>
            <p className="mt-1 text-xs font-bold leading-5 text-stock-subtle">서비스에 쌓인 전체 원장과 전체 체결 기준의 누적 흐름입니다. 계좌 잔액과 총자산은 현재 스냅샷입니다.</p>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            {loading ? (
              <span className="rounded-md bg-white/10 px-2 py-1 text-xs font-black text-admin-accent-soft">조회 중</span>
            ) : null}
            {error ? (
              <span className="rounded-md bg-admin-danger-surface px-2 py-1 text-xs font-black text-admin-danger">조회 실패</span>
            ) : null}
            <button
              type="button"
              onClick={onRefresh}
              className="min-h-9 rounded-md border border-white/15 px-3 py-2 text-xs font-black text-admin-accent-soft transition hover:border-admin-accent hover:text-white"
            >
              다시 조회
            </button>
            <button
              type="button"
              onClick={onClose}
              className="min-h-9 rounded-md bg-white px-3 py-2 text-xs font-black text-admin-canvas"
            >
              닫기
            </button>
          </div>
        </div>

        {fundFlow ? (
          <AdminFundFlowMetricGrids fundFlow={fundFlow} executionLabel="전체 체결 (비동기·보통 30초)" onOpenTotalAssetHistory={onOpenTotalAssetHistory} />
        ) : (
          <div className="mt-4 rounded-md border border-white/10 bg-black/20 p-4 text-sm font-bold leading-6 text-stock-subtle">
            {loading ? "전체 누적 자금 흐름을 조회하고 있습니다." : "전체 누적 자금 흐름을 아직 조회하지 못했습니다."}
          </div>
        )}
      </div>
    </div>
  );
}
