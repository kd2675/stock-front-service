"use client";

import { useState } from "react";

import { AdminAutoMarketRegimeHistory } from "@/app/supply-demand/admin/AdminAutoMarketRegimeHistory";
import { DarkInput, DarkSelect, EnabledToggleButton } from "@/app/supply-demand/admin/AdminFormControls";
import { AutoMarketConfigGuide } from "@/app/supply-demand/admin/AdminSignalGuide";
import type { AutoMarketConfig, AutoMarketDailyRegime, AutoMarketDistributionBias, AutoMarketRegimeCountWeights } from "@/app/types/stock";

type PressureKey = keyof AutoMarketDistributionBias;
type RegimeCountWeightKey = keyof AutoMarketRegimeCountWeights;

export type AutoMarketConfigDraft = {
  symbol: string;
  enabled: boolean;
  maxOrderQuantity: string;
  orderTtlSeconds: string;
  primaryRegimeCountWeights: Record<RegimeCountWeightKey, string>;
  primaryDistributionBias: Record<PressureKey, string>;
  secondaryDistributionBias: Record<PressureKey, string>;
};

export type AutoMarketConfigDraftSetters = {
  setSymbol: (value: string) => void;
  setEnabled: (value: boolean) => void;
  setMaxOrderQuantity: (value: string) => void;
  setOrderTtlSeconds: (value: string) => void;
  setPrimaryRegimeCountWeight: (field: RegimeCountWeightKey, value: string) => void;
  setPrimaryDistributionBias: (field: PressureKey, value: string) => void;
  setSecondaryDistributionBias: (field: PressureKey, value: string) => void;
  setEditingSymbol: (value: string | null) => void;
};

type AdminAutoMarketConfigPanelProps = {
  accessToken: string | null;
  configs: AutoMarketConfig[];
  draft: AutoMarketConfigDraft;
  draftSetters: AutoMarketConfigDraftSetters;
  editingSymbol: string | null;
  updating: boolean;
  togglingSymbol: string | null;
  regeneratingRegimeSymbol: string | null;
  regeneratingRegimeModifierSymbol: string | null;
  onSelectDraft: (config: AutoMarketConfig) => void;
  onSubmit: () => void;
  onToggleEnabled: (config: AutoMarketConfig) => void;
  onRegenerateRegime: (config: AutoMarketConfig) => void;
  onRegenerateRegimeModifier: (config: AutoMarketConfig) => void;
};

const PRESSURE_FIELDS: Array<{
  key: PressureKey;
  label: string;
  negative: string;
  positive: string;
}> = [
  { key: "pricePressure", label: "가격 압력", negative: "하락·매도", positive: "상승·매수" },
  { key: "assetPreferencePressure", label: "자산 선호", negative: "현금 전환", positive: "주식 보유" },
  { key: "volatilityPressure", label: "변동성", negative: "안정", positive: "확대" },
  { key: "liquidityPressure", label: "유동성", negative: "희소", positive: "풍부" },
  { key: "executionAggressionPressure", label: "체결 공격성", negative: "수동", positive: "적극" },
];

const REGIME_COUNT_WEIGHT_FIELDS: Array<{
  key: RegimeCountWeightKey;
  count: number;
  label: string;
  description: string;
}> = [
  { key: "oneTime", count: 1, label: "1회", description: "06시 값을 종일 유지" },
  { key: "twoTimes", count: 2, label: "2회", description: "06시와 추가 슬롯 1개" },
  { key: "threeTimes", count: 3, label: "3회", description: "06시와 추가 슬롯 2개" },
  { key: "fourTimes", count: 4, label: "4회", description: "06·09·12·15시 모두 생성" },
];

const PHASE_LABELS: Record<AutoMarketDailyRegime["regimePhase"], string> = {
  SLOT_0600: "06:00 구간",
  SLOT_0900: "09:00 구간",
  SLOT_1200: "12:00 구간",
  SLOT_1500: "15:00 구간",
};

function clampPressure(value: number) {
  return Math.min(100, Math.max(-100, Number.isFinite(value) ? value : 0));
}

function signed(value: number) {
  const normalized = Math.round(clampPressure(value));
  return normalized > 0 ? `+${normalized}` : `${normalized}`;
}

function clampWeight(value: number) {
  return Math.min(100, Math.max(0, Number.isFinite(value) ? Math.round(value) : 0));
}

function pressureTone(value: number) {
  if (value > 0) {
    return "text-[#86efac]";
  }
  if (value < 0) {
    return "text-[#fca5a5]";
  }
  return "text-[#d7dee7]";
}

function DistributionBiasSlider({
  field,
  value,
  onChange,
}: {
  field: (typeof PRESSURE_FIELDS)[number];
  value: string;
  onChange: (value: string) => void;
}) {
  const numericValue = clampPressure(Number(value));
  const markerPosition = (numericValue + 100) / 2;
  return (
    <label className="block border-b border-white/[0.07] py-2.5 last:border-b-0">
      <span className="flex items-center justify-between gap-3 text-xs font-black">
        <span>{field.label}</span>
        <output className={`min-w-10 text-right tabular-nums ${pressureTone(numericValue)}`}>
          {signed(numericValue)}
        </output>
      </span>
      <span className="mt-2 grid grid-cols-[auto_1fr_auto] items-center gap-2 text-[10px] font-bold text-admin-subtle">
        <span>{field.negative}</span>
        <span className="relative h-5">
          <input
            aria-label={`${field.label} 분포 편향`}
            className="peer absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
            max={100}
            min={-100}
            onChange={(event) => onChange(event.target.value)}
            step={1}
            type="range"
            value={numericValue}
          />
          <span className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-gradient-to-r from-[#ef4444]/70 via-white/15 to-[#22c55e]/70 peer-focus-visible:ring-2 peer-focus-visible:ring-admin-accent peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-[#111827]">
            <span
              aria-hidden="true"
              className="absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[#111827] bg-white shadow-[0_0_0_1px_rgba(255,255,255,0.2)]"
              style={{ left: `${markerPosition}%` }}
            />
          </span>
        </span>
        <span>{field.positive}</span>
      </span>
    </label>
  );
}

function DistributionBiasEditor({
  label,
  description,
  values,
  onChange,
}: {
  label: string;
  description: string;
  values: Record<PressureKey, string>;
  onChange: (field: PressureKey, value: string) => void;
}) {
  return (
    <fieldset className="min-w-0">
      <legend className="pr-3 text-sm font-black text-white">{label}</legend>
      <p className="mb-1 mt-1 text-[11px] font-bold leading-5 text-stock-subtle">{description}</p>
      {PRESSURE_FIELDS.map((field) => (
        <DistributionBiasSlider
          field={field}
          key={field.key}
          onChange={(value) => onChange(field.key, value)}
          value={values[field.key]}
        />
      ))}
    </fieldset>
  );
}

function RegimeCountWeightEditor({
  values,
  onChange,
}: {
  values: Record<RegimeCountWeightKey, string>;
  onChange: (field: RegimeCountWeightKey, value: string) => void;
}) {
  const weights = REGIME_COUNT_WEIGHT_FIELDS.map((field) => ({
    ...field,
    weight: clampWeight(Number(values[field.key])),
  }));
  const total = weights.reduce((sum, field) => sum + field.weight, 0);
  const expectedCount = total > 0
    ? weights.reduce((sum, field) => sum + field.count * field.weight, 0) / total
    : 0;

  return (
    <fieldset className="min-w-0">
      <legend className="pr-3 text-sm font-black text-white">주 랜덤 일일 적용 횟수</legend>
      <div className="mb-2 mt-1 flex flex-wrap items-center justify-between gap-2">
        <p className="max-w-3xl text-[11px] font-bold leading-5 text-stock-subtle">
          종목별로 다음 거래일의 적용 횟수를 추첨합니다. 06시는 항상 포함되고 나머지 슬롯은 무작위로 선택됩니다.
        </p>
        <span className={`text-[11px] font-black tabular-nums ${total > 0 ? "text-admin-accent-label" : "text-admin-danger"}`}>
          {total > 0 ? `예상 평균 ${expectedCount.toFixed(2)}회` : "가중치가 필요합니다"}
        </span>
      </div>
      <div className="grid gap-x-5 sm:grid-cols-2">
        {weights.map((field) => {
          const probability = total > 0 ? field.weight / total * 100 : 0;
          return (
            <label className="block border-b border-white/[0.07] py-2.5" key={field.key}>
              <span className="flex items-start justify-between gap-3">
                <span>
                  <span className="block text-xs font-black text-white">{field.label}</span>
                  <span className="mt-0.5 block text-[10px] font-bold text-admin-subtle">{field.description}</span>
                </span>
                <output className="min-w-24 text-right text-[11px] font-black tabular-nums text-admin-accent-label">
                  가중치 {field.weight} · {probability.toFixed(1)}%
                </output>
              </span>
              <span className="relative mt-2 block h-5">
                <input
                  aria-label={`주 랜덤 ${field.label} 적용 가중치`}
                  className="peer absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
                  max={100}
                  min={0}
                  onChange={(event) => onChange(field.key, event.target.value)}
                  step={1}
                  type="range"
                  value={field.weight}
                />
                <span className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 overflow-hidden rounded-full bg-white/10 peer-focus-visible:ring-2 peer-focus-visible:ring-admin-accent peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-[#111827]">
                  <span
                    aria-hidden="true"
                    className="block h-full rounded-full bg-admin-accent transition-[width] duration-150"
                    style={{ width: `${field.weight}%` }}
                  />
                </span>
                <span
                  aria-hidden="true"
                  className="absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[#111827] bg-white shadow-[0_0_0_1px_rgba(255,255,255,0.2)]"
                  style={{ left: `${field.weight}%` }}
                />
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

function PressureBar({ label, value }: { label: string; value: number }) {
  const normalized = clampPressure(value);
  return (
    <div className="grid grid-cols-[78px_minmax(0,1fr)_38px] items-center gap-2 text-[11px] font-bold">
      <span className="truncate text-[#9aa7b4]">{label}</span>
      <span className="relative h-1.5 rounded-full bg-white/10">
        <span className="absolute left-1/2 top-1/2 h-3 w-px -translate-y-1/2 bg-white/25" />
        <span
          className={`absolute top-0 h-full rounded-full ${normalized >= 0 ? "bg-[#22c55e]" : "bg-[#ef4444]"}`}
          style={normalized >= 0
            ? { left: "50%", width: `${normalized / 2}%` }
            : { left: `${50 + normalized / 2}%`, width: `${Math.abs(normalized) / 2}%` }}
        />
      </span>
      <span className={`text-right tabular-nums ${pressureTone(normalized)}`}>{signed(normalized)}</span>
    </div>
  );
}

function pressureValues(regime: AutoMarketDailyRegime | null | undefined, source: "primary" | "secondary") {
  if (!regime) {
    return null;
  }
  if (source === "secondary") {
    return regime.currentModifier ?? null;
  }
  return regime;
}

function calculateFinal(primary: number, secondary: number) {
  return clampPressure(primary * 0.7 + secondary * 0.3);
}

function RegimePressureGroup({
  title,
  values,
}: {
  title: string;
  values: Pick<AutoMarketDistributionBias, PressureKey>;
}) {
  return (
    <div className="space-y-1.5">
      <div className="text-[10px] font-black uppercase tracking-[0.12em] text-admin-subtle">{title}</div>
      {PRESSURE_FIELDS.map((field) => (
        <PressureBar key={field.key} label={field.label} value={values[field.key]} />
      ))}
    </div>
  );
}

function AutoMarketDailyRegimeCell({ regime }: { regime?: AutoMarketDailyRegime | null }) {
  const primary = pressureValues(regime, "primary");
  if (!regime || !primary) {
    return <div className="text-xs font-bold leading-5 text-stock-subtle">현재 구간 주 랜덤 미생성</div>;
  }
  const secondary = pressureValues(regime, "secondary");
  const secondaryValues: AutoMarketDistributionBias = secondary ?? {
    pricePressure: 0,
    assetPreferencePressure: 0,
    volatilityPressure: 0,
    liquidityPressure: 0,
    executionAggressionPressure: 0,
  };
  const finalValues = Object.fromEntries(PRESSURE_FIELDS.map((field) => [
    field.key,
    calculateFinal(primary[field.key], secondaryValues[field.key]),
  ])) as AutoMarketDistributionBias;

  return (
    <div className="min-w-0 space-y-3">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-bold text-stock-subtle">
        <span>{regime.simulationTradeDate}</span>
        <span className="text-admin-accent-label">{PHASE_LABELS[regime.regimePhase]}</span>
        <span>
          {(regime.sourceRegimePhase ?? regime.regimePhase) === regime.regimePhase
            ? "주 신규 생성"
            : `${PHASE_LABELS[regime.sourceRegimePhase ?? regime.regimePhase]} 값 유지`}
        </span>
        {secondary ? <span>보조 {regime.currentModifier?.modifierWindowStartAt.slice(11, 16)}</span> : <span>보조 미생성</span>}
      </div>
      <RegimePressureGroup title="주 70% + 보조 30% · 최종 적용" values={finalValues} />
    </div>
  );
}

function DailyRegimeApplicationBadge({ regime }: { regime?: AutoMarketDailyRegime | null }) {
  if (!regime) {
    return <span className="text-[11px] font-bold text-admin-subtle">당일 주 랜덤 미확정</span>;
  }
  if (regime.preparedRegimeSlotCount !== 4) {
    return (
      <span className="rounded-full border border-admin-warning/30 bg-admin-warning/10 px-2.5 py-1 text-[11px] font-black tabular-nums text-admin-warning-soft">
        일일 슬롯 준비 {regime.preparedRegimeSlotCount}/4
      </span>
    );
  }
  return (
    <span
      className="rounded-full border border-admin-accent/30 bg-admin-accent/10 px-2.5 py-1 text-[11px] font-black tabular-nums text-admin-accent-label"
      title="해당 거래일에 새로운 주 랜덤값이 생성되도록 추첨된 횟수입니다."
    >
      당일 주 랜덤 총 {regime.dailyApplicationCount}회
    </span>
  );
}

function ConfigEditor({
  draft,
  draftSetters,
  updating,
  onSubmit,
}: {
  draft: AutoMarketConfigDraft;
  draftSetters: AutoMarketConfigDraftSetters;
  updating: boolean;
  onSubmit: () => void;
}) {
  return (
    <form
      className="grid min-w-0 gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <FormSection title="주문 기본" description="종목의 자동 주문 생성 여부와 주문 1건의 안전 상한을 관리합니다.">
        <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <DarkSelect label="자동 주문 생성" value={draft.enabled ? "true" : "false"} onChange={(value) => draftSetters.setEnabled(value === "true")}>
          <option value="true">가동</option>
          <option value="false">정지</option>
        </DarkSelect>
        <DarkInput label="1회 주문 최대 수량" value={draft.maxOrderQuantity} onChange={draftSetters.setMaxOrderQuantity} placeholder="4" />
        <div className="min-w-0">
          <DarkInput label="미체결 호가 TTL(시뮬 초)" value={draft.orderTtlSeconds} onChange={draftSetters.setOrderTtlSeconds} placeholder="15" />
          <p className="mt-1 text-[10px] font-bold leading-4 text-admin-placeholder">현실 시간이 아니라 시뮬레이션 시간 기준입니다.</p>
        </div>
      </div>
      </FormSection>

      <div className="min-w-0 rounded-md border border-white/10 bg-white/[0.025] p-4">
        <RegimeCountWeightEditor
          onChange={draftSetters.setPrimaryRegimeCountWeight}
          values={draft.primaryRegimeCountWeights}
        />
      </div>

      <details className="group min-w-0 rounded-md border border-white/10 bg-white/[0.025]">
        <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 marker:hidden">
          <span className="min-w-0">
            <span className="block text-sm font-black text-white">분포 편향 상세 설정</span>
            <span className="mt-0.5 block text-[11px] font-bold leading-4 text-stock-subtle">주·보조 압력의 최빈 위치를 각각 조정합니다. 결과값을 고정하는 설정은 아닙니다.</span>
          </span>
          <span aria-hidden="true" className="shrink-0 text-admin-accent transition-transform group-open:rotate-180">⌄</span>
        </summary>
        <div className="grid min-w-0 gap-6 border-t border-white/10 px-4 pb-4 pt-3 lg:grid-cols-2">
          <DistributionBiasEditor
            description="선택된 일일 슬롯에서 생성되는 주 랜덤의 최빈 구간입니다. 실제 주문 반영 비중은 70%입니다."
            label="주 랜덤 분포 편향"
            onChange={draftSetters.setPrimaryDistributionBias}
            values={draft.primaryDistributionBias}
          />
          <DistributionBiasEditor
            description="시뮬레이션 30분마다 생성되는 보조 랜덤의 최빈 구간입니다. 실제 주문 반영 비중은 30%입니다."
            label="보조 랜덤 분포 편향"
            onChange={draftSetters.setSecondaryDistributionBias}
            values={draft.secondaryDistributionBias}
          />
        </div>
      </details>

      <div className="flex flex-col gap-2 border-t border-white/10 pt-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[11px] font-bold leading-5 text-admin-placeholder">
          저장한 설정은 다음 자동 주문 생성부터 적용됩니다. 이미 생성된 주문과 현재 랜덤값은 즉시 바뀌지 않습니다.
        </p>
        <button type="submit" disabled={updating} className="min-h-11 shrink-0 rounded-md bg-white px-5 py-3 text-sm font-black text-admin-canvas transition hover:bg-admin-accent-label disabled:cursor-wait disabled:opacity-50">
          {updating ? "저장 중" : `${draft.symbol} 설정 저장`}
        </button>
      </div>
    </form>
  );
}

function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset className="min-w-0 rounded-md border border-white/10 bg-white/[0.025] p-4">
      <legend className="px-1 text-sm font-black text-white">{title}</legend>
      <p className="mb-4 mt-1 text-[11px] font-bold leading-5 text-stock-subtle">{description}</p>
      {children}
    </fieldset>
  );
}

export function AdminAutoMarketConfigPanel({
  accessToken,
  configs,
  draft,
  draftSetters,
  editingSymbol,
  updating,
  togglingSymbol,
  regeneratingRegimeSymbol,
  regeneratingRegimeModifierSymbol,
  onSelectDraft,
  onSubmit,
  onToggleEnabled,
  onRegenerateRegime,
  onRegenerateRegimeModifier,
}: AdminAutoMarketConfigPanelProps) {
  const [historySymbol, setHistorySymbol] = useState<string | null>(null);
  const selectedConfig = configs.find((config) => config.symbol === draft.symbol) ?? configs[0] ?? null;

  return (
    <section className="admin-panel mt-5 overflow-hidden">
      <PanelHeader configCount={configs.length} />

      {configs.length === 0 ? (
        <div className="mt-5 rounded-md border border-white/10 bg-black/10 px-3 py-4 text-sm font-bold text-stock-subtle">
          자동장 설정 대상 종목이 없습니다.
        </div>
      ) : (
        <div className="mt-5 grid min-w-0 gap-5 xl:grid-cols-[280px_minmax(0,1fr)]">
          <SymbolSelector
            activeSymbol={selectedConfig?.symbol ?? ""}
            configs={configs}
            editingSymbol={editingSymbol}
            onSelect={onSelectDraft}
          />

          <div className="min-w-0">
            {selectedConfig ? (
              <>
                <CurrentRegimeSummary
                  config={selectedConfig}
                  historyOpen={historySymbol === selectedConfig.symbol}
                  regeneratingRegimeModifier={regeneratingRegimeModifierSymbol === selectedConfig.symbol}
                  regeneratingRegime={regeneratingRegimeSymbol === selectedConfig.symbol}
                  toggling={togglingSymbol === selectedConfig.symbol}
                  onRegenerateRegime={() => onRegenerateRegime(selectedConfig)}
                  onRegenerateRegimeModifier={() => onRegenerateRegimeModifier(selectedConfig)}
                  onToggleEnabled={() => onToggleEnabled(selectedConfig)}
                  onToggleHistory={() => setHistorySymbol((current) => current === selectedConfig.symbol ? null : selectedConfig.symbol)}
                />

                {historySymbol === selectedConfig.symbol ? (
                  <AdminAutoMarketRegimeHistory
                    accessToken={accessToken}
                    currentTradeDate={selectedConfig.dailyRegime?.simulationTradeDate}
                    symbol={selectedConfig.symbol}
                  />
                ) : null}

                <div className="mt-4">
                  <ConfigEditor draft={draft} draftSetters={draftSetters} onSubmit={onSubmit} updating={updating} />
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}

      <AutoMarketConfigGuide />
    </section>
  );
}

function PanelHeader({ configCount }: { configCount: number }) {
  return (
    <header className="flex flex-col gap-3 border-b border-white/10 pb-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0 max-w-4xl">
        <h2 className="text-base font-black">종목별 자동장</h2>
        <p className="mt-1 text-xs font-bold leading-5 text-stock-subtle">
          종목을 선택해 현재 종합 압력과 주문 상한을 확인하고, 주·보조 랜덤 분포를 한 화면에서 관리합니다. 압력은 주 70%, 보조 30%로 합성됩니다.
        </p>
      </div>
      <span className="inline-flex w-fit shrink-0 items-center rounded-md border border-admin-accent/25 bg-admin-accent-surface px-2.5 py-1.5 text-xs font-black text-admin-accent">
        {configCount}개 종목 · 보조 30분
      </span>
    </header>
  );
}

function SymbolSelector({
  activeSymbol,
  configs,
  editingSymbol,
  onSelect,
}: {
  activeSymbol: string;
  configs: AutoMarketConfig[];
  editingSymbol: string | null;
  onSelect: (config: AutoMarketConfig) => void;
}) {
  return (
    <aside aria-label="자동장 종목 선택" className="min-w-0">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 className="text-xs font-black text-admin-muted">종목 선택</h3>
        <span className="text-[11px] font-bold text-admin-placeholder">설정·압력</span>
      </div>
      <label className="grid min-w-0 gap-1 text-xs font-bold text-admin-muted sm:hidden">
        관리 종목
        <select
          className="admin-control h-11 w-full min-w-0 px-3 text-sm font-bold outline-none"
          value={activeSymbol}
          onChange={(event) => {
            const config = configs.find((item) => item.symbol === event.target.value);
            if (config) {
              onSelect(config);
            }
          }}
        >
          {configs.map((config) => <option key={config.symbol} value={config.symbol}>{config.symbol} · {config.enabled ? "가동" : "정지"}</option>)}
        </select>
      </label>
      <div className="hidden min-w-0 gap-2 sm:grid sm:grid-cols-3 xl:grid-cols-1">
        {configs.map((config) => {
          const active = config.symbol === activeSymbol;
          const finalPricePressure = currentFinalPressure(config.dailyRegime, "pricePressure");
          return (
            <button
              key={config.symbol}
              type="button"
              aria-pressed={active}
              onClick={() => onSelect(config)}
              className={[
                "group min-w-0 rounded-md border p-3 text-left transition",
                active
                  ? "border-admin-accent/60 bg-admin-accent-surface shadow-[inset_3px_0_0_var(--admin-accent)]"
                  : "border-white/10 bg-black/20 hover:border-white/20 hover:bg-white/[0.055]",
              ].join(" ")}
            >
              <span className="flex items-start justify-between gap-2">
                <span className="text-sm font-black text-white">{config.symbol}</span>
                <span className={[
                  "shrink-0 rounded border px-1.5 py-0.5 text-[10px] font-black",
                  config.enabled
                    ? "border-admin-success/25 bg-admin-success/10 text-admin-success"
                    : "border-white/10 bg-white/[0.04] text-admin-placeholder",
                ].join(" ")}>{config.enabled ? "가동" : "정지"}</span>
              </span>
              <span className="mt-3 flex items-end justify-between gap-2">
                <span>
                  <span className="block text-[10px] font-bold text-admin-placeholder">현재 가격 압력</span>
                  <span className={`mt-0.5 block text-lg font-black tabular-nums ${pressureTone(finalPricePressure)}`}>{signed(finalPricePressure)}</span>
                </span>
                <span className="text-right text-[10px] font-bold leading-4 text-admin-placeholder">
                  최대 {config.maxOrderQuantity.toLocaleString()}주<br />TTL {config.orderTtlSeconds}초
                </span>
              </span>
              <span className="mt-3 block h-1.5 overflow-hidden rounded-full bg-white/10">
                <span
                  className={`block h-full rounded-full ${finalPricePressure >= 0 ? "bg-admin-success" : "bg-admin-danger"}`}
                  style={{ width: `${Math.abs(finalPricePressure)}%` }}
                />
              </span>
              {active && editingSymbol === config.symbol ? <span className="sr-only">현재 편집 중</span> : null}
            </button>
          );
        })}
      </div>
    </aside>
  );
}

function CurrentRegimeSummary({
  config,
  historyOpen,
  regeneratingRegime,
  regeneratingRegimeModifier,
  toggling,
  onRegenerateRegime,
  onRegenerateRegimeModifier,
  onToggleEnabled,
  onToggleHistory,
}: {
  config: AutoMarketConfig;
  historyOpen: boolean;
  regeneratingRegime: boolean;
  regeneratingRegimeModifier: boolean;
  toggling: boolean;
  onRegenerateRegime: () => void;
  onRegenerateRegimeModifier: () => void;
  onToggleEnabled: () => void;
  onToggleHistory: () => void;
}) {
  return (
    <section aria-labelledby="auto-market-current-regime" className="min-w-0 rounded-md border border-white/10 bg-black/20 p-4">
      <div className="flex min-w-0 flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 id="auto-market-current-regime" className="text-lg font-black text-white">{config.symbol}</h3>
            <DailyRegimeApplicationBadge regime={config.dailyRegime} />
          </div>
          <p className="mt-1 text-xs font-bold leading-5 text-stock-subtle">현재 구간에서 주문 생성에 적용되는 종합 압력입니다.</p>
        </div>
        <div className="w-fit">
          <EnabledToggleButton enabled={config.enabled} disabled={toggling} onToggle={onToggleEnabled} />
        </div>
      </div>

      <div className="mt-4 rounded-md border border-white/[0.07] bg-white/[0.025] p-3">
        <AutoMarketDailyRegimeCell regime={config.dailyRegime} />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <ActionButton label={regeneratingRegime ? "생성 중" : "주 랜덤 재생성"} tone="warning" disabled={regeneratingRegime} onClick={onRegenerateRegime} />
        <ActionButton label={regeneratingRegimeModifier ? "생성 중" : "보조 랜덤 재생성"} tone="accent" disabled={!config.dailyRegime || regeneratingRegimeModifier} onClick={onRegenerateRegimeModifier} />
        <ActionButton label={historyOpen ? "과거 기록 닫기" : "과거 기록 보기"} disabled={false} onClick={onToggleHistory} />
        <div className="flex min-h-10 items-center justify-center rounded-md border border-white/[0.07] bg-white/[0.025] px-2 text-center text-[10px] font-bold leading-4 text-admin-placeholder">
          재생성은 현재값만 변경<br className="hidden sm:block" /> 저장 설정은 유지
        </div>
      </div>
    </section>
  );
}

function ActionButton({
  label,
  tone = "neutral",
  disabled,
  onClick,
}: {
  label: string;
  tone?: "neutral" | "warning" | "accent";
  disabled: boolean;
  onClick: () => void;
}) {
  const toneClassName = tone === "warning"
    ? "bg-admin-warning/15 text-admin-warning-soft"
    : tone === "accent"
      ? "bg-admin-accent/15 text-admin-accent-label"
      : "bg-white/10 text-white";
  return (
    <button type="button" onClick={onClick} disabled={disabled} className={`min-h-10 rounded-md px-2 py-2 text-xs font-black transition disabled:cursor-wait disabled:opacity-40 ${toneClassName}`}>
      {label}
    </button>
  );
}

function currentFinalPressure(regime: AutoMarketDailyRegime | null | undefined, key: PressureKey) {
  if (!regime) {
    return 0;
  }
  return calculateFinal(regime[key], regime.currentModifier?.[key] ?? 0);
}
