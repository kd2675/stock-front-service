"use client";

import { useState } from "react";

import useModalDialog from "@/app/hooks/useModalDialog";
import { formatNumber } from "@/app/supply-demand/admin/AdminFormatters";
import {
  calculateListingAutoTargetFit,
  LISTING_AUTO_QUANTITY_PRESETS,
  type ListingAutoQuantityPresetId,
  type ListingAutoTargetFit,
  type ListingAutoTargetFitInput,
} from "@/app/supply-demand/admin/listingAutoTargetFit";
import type { ListingAutoPosition } from "@/app/types/stock";

type CurrentQuantityValues = {
  inventoryBandQuantity: string;
  targetBuyQuantity: string;
  targetSellQuantity: string;
  maxOrderQuantity: string;
};

type AdminListingAutoQuantityPresetModalProps = {
  fitInput: Omit<ListingAutoTargetFitInput, "quantityPresetId">;
  initialPresetId: ListingAutoQuantityPresetId;
  positionSide: ListingAutoPosition;
  currentValues: CurrentQuantityValues;
  onApply: (fit: ListingAutoTargetFit) => void;
  onClose: () => void;
};

export function AdminListingAutoQuantityPresetModal({
  fitInput,
  initialPresetId,
  positionSide,
  currentValues,
  onApply,
  onClose,
}: AdminListingAutoQuantityPresetModalProps) {
  const [selectedPresetId, setSelectedPresetId] = useState<ListingAutoQuantityPresetId>(initialPresetId);
  const dialogRef = useModalDialog<HTMLDivElement>(true, onClose);
  const options = LISTING_AUTO_QUANTITY_PRESETS.map((preset) => ({
    preset,
    fit: calculateListingAutoTargetFit({ ...fitInput, quantityPresetId: preset.id }),
  }));
  const selectedOption = options.find(({ preset }) => preset.id === selectedPresetId) ?? options[0];
  const selectedFit = selectedOption.fit;
  const requiresTwoSidedTransition = positionSide !== "TWO_SIDED";

  return (
    <div className="modal-scroll fixed inset-0 z-50 overflow-y-auto bg-black/70 px-4 py-8 backdrop-blur-sm">
      <div
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="listing-auto-quantity-preset-title"
        className="mx-auto w-full max-w-6xl rounded-lg border border-white/10 bg-admin-modal p-4 shadow-[var(--shadow-dialog)] outline-none"
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="max-w-3xl">
            <h3 id="listing-auto-quantity-preset-title" className="text-base font-black text-white">
              권장 수량 프리셋
            </h3>
            <p className="mt-1 text-xs font-bold leading-5 text-stock-subtle">
              목표 보유량에서 위·아래로 움직일 수 있는 대칭 재고 용량을 기준으로 밴드와 양방향 호가 잔량을 계산합니다. 계정 가동 여부와 가격·위험 전략은 바꾸지 않습니다.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-h-9 rounded-md border border-white/15 px-3 py-2 text-xs font-black text-admin-accent-soft transition hover:border-admin-accent hover:text-white"
          >
            닫기
          </button>
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-5" role="group" aria-label="상장주관사 공급 규모">
          {options.map(({ preset, fit }) => {
            const selected = preset.id === selectedPresetId;
            const recommended = preset.id === initialPresetId;
            return (
              <button
                key={preset.id}
                type="button"
                aria-pressed={selected}
                disabled={!fit}
                onClick={() => setSelectedPresetId(preset.id)}
                className={[
                  "min-w-0 rounded-md border p-3 text-left transition disabled:cursor-not-allowed disabled:opacity-40",
                  selected
                    ? "border-admin-accent/60 bg-admin-accent-surface shadow-[inset_3px_0_0_var(--admin-accent)]"
                    : "border-white/10 bg-black/20 hover:border-white/20 hover:bg-white/[0.055]",
                ].join(" ")}
              >
                <span className="flex items-start justify-between gap-2">
                  <span className="text-sm font-black text-white">{preset.label}</span>
                  {recommended ? (
                    <span className="shrink-0 rounded border border-admin-accent/25 bg-admin-accent/10 px-1.5 py-0.5 text-[10px] font-black text-admin-accent">
                      추천
                    </span>
                  ) : null}
                </span>
                <span className="mt-1 block min-h-10 text-[11px] font-bold leading-5 text-stock-subtle">
                  {preset.description}
                </span>
                {fit ? (
                  <span className="mt-3 grid gap-1.5 border-t border-white/10 pt-3 text-[11px] font-bold tabular-nums">
                    <PresetMetric label="보유 밴드" value={`±${formatNumber(fit.inventoryBandQuantity)}주`} />
                    <PresetMetric label="양쪽 잔량" value={`${formatNumber(fit.targetBuyQuantity)}주`} />
                    <PresetMetric label="주문 상한" value={`${formatNumber(fit.maxOrderQuantity)}주`} />
                    <PresetMetric label="현재 보충" value={`${fit.buyOrderFragments + fit.sellOrderFragments}건`} />
                  </span>
                ) : null}
                <span className="mt-3 block text-[10px] font-black text-admin-placeholder">
                  대칭 용량 {(preset.inventoryBandRatio * 100).toFixed(0)}% · 한쪽 최대 {preset.orderFragmentCount}개
                </span>
              </button>
            );
          })}
        </div>

        {selectedFit ? (
          <div className="mt-4 overflow-hidden rounded-md border border-white/10 bg-black/20">
            <div className="grid gap-px bg-white/10 sm:grid-cols-2 lg:grid-cols-4">
              <QuantityChangeMetric label="보유 허용 밴드" current={currentValues.inventoryBandQuantity} next={selectedFit.inventoryBandQuantity} />
              <QuantityChangeMetric label="목표 매수 잔량" current={currentValues.targetBuyQuantity} next={selectedFit.targetBuyQuantity} />
              <QuantityChangeMetric label="목표 매도 잔량" current={currentValues.targetSellQuantity} next={selectedFit.targetSellQuantity} />
              <QuantityChangeMetric label="주문 1건 상한" current={currentValues.maxOrderQuantity} next={selectedFit.maxOrderQuantity} />
            </div>
            <p className="px-3 py-2.5 text-[11px] font-bold leading-5 text-stock-subtle">
              적용 후 재고 허용 범위 {formatNumber(selectedFit.lowerHoldingLimit)}~{formatNumber(selectedFit.upperHoldingLimit)}주 · 유효 목표 매수 {formatNumber(selectedFit.effectiveBuyTarget)}주 / 매도 {formatNumber(selectedFit.effectiveSellTarget)}주
            </p>
          </div>
        ) : null}

        {requiresTwoSidedTransition ? (
          <div className="mt-3 rounded-md border border-admin-warning/25 bg-admin-warning/[0.06] px-3 py-2.5 text-xs font-bold leading-5 text-admin-warning">
            수량 프리셋은 양방향 재고 운용 기준입니다. 적용하면 현재 포지션을 양방향 기관 운용으로 전환합니다. 계정의 가동·정지 상태는 유지됩니다.
          </div>
        ) : null}

        <div className="mt-4 flex flex-col-reverse gap-2 border-t border-white/10 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[11px] font-bold leading-5 text-stock-subtle">
            이 단계에서는 폼 입력값만 바뀝니다. 서버 반영은 기존 설정 저장 버튼을 눌러야 완료됩니다.
          </p>
          <div className="flex shrink-0 gap-2">
            <button type="button" onClick={onClose} className="min-h-10 rounded-md border border-white/15 px-4 py-2 text-xs font-black text-admin-muted transition hover:border-white/25 hover:text-white">
              취소
            </button>
            <button
              type="button"
              disabled={!selectedFit}
              onClick={() => selectedFit && onApply(selectedFit)}
              className="min-h-10 rounded-md bg-admin-accent px-4 py-2 text-xs font-black text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {requiresTwoSidedTransition ? "양방향으로 전환하고 적용" : "선택값 적용"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function PresetMetric({ label, value }: { label: string; value: string }) {
  return (
    <span className="flex items-center justify-between gap-2">
      <span className="text-admin-placeholder">{label}</span>
      <span className="text-white">{value}</span>
    </span>
  );
}

function QuantityChangeMetric({ label, current, next }: { label: string; current: string; next: number }) {
  const parsedCurrent = Number(current);
  const currentLabel = Number.isSafeInteger(parsedCurrent) && parsedCurrent >= 0
    ? `${formatNumber(parsedCurrent)}주`
    : "입력 확인";

  return (
    <div className="min-w-0 bg-admin-surface/95 px-3 py-3">
      <p className="text-[10px] font-black text-admin-placeholder">{label}</p>
      <p className="mt-1 break-words text-sm font-black tabular-nums text-white">
        <span className="text-stock-subtle">{currentLabel}</span>
        <span aria-hidden="true" className="mx-1.5 text-admin-placeholder">→</span>
        <span className="text-admin-accent">{formatNumber(next)}주</span>
      </p>
    </div>
  );
}
