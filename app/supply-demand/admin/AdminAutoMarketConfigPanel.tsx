import { DarkInput, DarkSelect, EnabledToggleButton } from "@/app/supply-demand/admin/AdminFormControls";
import { AutoMarketConfigGuide } from "@/app/supply-demand/admin/AdminSignalGuide";
import type { AutoMarketConfig, AutoMarketDailyRegime, AutoMarketDistributionBias } from "@/app/types/stock";

type PressureKey = keyof AutoMarketDistributionBias;

export type AutoMarketConfigDraft = {
  symbol: string;
  enabled: boolean;
  maxOrderQuantity: string;
  orderTtlSeconds: string;
  primaryDistributionBias: Record<PressureKey, string>;
  secondaryDistributionBias: Record<PressureKey, string>;
};

export type AutoMarketConfigDraftSetters = {
  setSymbol: (value: string) => void;
  setEnabled: (value: boolean) => void;
  setMaxOrderQuantity: (value: string) => void;
  setOrderTtlSeconds: (value: string) => void;
  setPrimaryDistributionBias: (field: PressureKey, value: string) => void;
  setSecondaryDistributionBias: (field: PressureKey, value: string) => void;
  setEditingSymbol: (value: string | null) => void;
};

type AdminAutoMarketConfigPanelProps = {
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
      <span className="mt-2 grid grid-cols-[auto_1fr_auto] items-center gap-2 text-[10px] font-bold text-[#7f8a96]">
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
          <span className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-gradient-to-r from-[#ef4444]/70 via-white/15 to-[#22c55e]/70 peer-focus-visible:ring-2 peer-focus-visible:ring-[#64a8ff] peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-[#111827]">
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
    <fieldset className="min-w-0 border-t border-white/10 pt-3">
      <legend className="pr-3 text-sm font-black text-white">{label}</legend>
      <p className="mb-1 mt-1 text-[11px] font-bold leading-5 text-[#8b95a1]">{description}</p>
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
  return clampPressure(primary * 0.6 + secondary * 0.4);
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
      <div className="text-[10px] font-black uppercase tracking-[0.12em] text-[#7f8a96]">{title}</div>
      {PRESSURE_FIELDS.map((field) => (
        <PressureBar key={field.key} label={field.label} value={values[field.key]} />
      ))}
    </div>
  );
}

function AutoMarketDailyRegimeCell({ regime }: { regime?: AutoMarketDailyRegime | null }) {
  const primary = pressureValues(regime, "primary");
  if (!regime || !primary) {
    return <div className="text-xs font-bold leading-5 text-[#8b95a1]">현재 구간 주 랜덤 미생성</div>;
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
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-bold text-[#8b95a1]">
        <span>{regime.simulationTradeDate}</span>
        <span className="text-[#9ecbff]">{PHASE_LABELS[regime.regimePhase]}</span>
        {secondary ? <span>보조 {regime.currentModifier?.modifierWindowStartAt.slice(11, 16)}</span> : <span>보조 미생성</span>}
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <RegimePressureGroup title="주 60%" values={primary} />
        <RegimePressureGroup title="보조 40%" values={secondaryValues} />
        <RegimePressureGroup title="최종 적용" values={finalValues} />
      </div>
    </div>
  );
}

function ConfigEditor({
  draft,
  draftSetters,
  updating,
  onSubmit,
  onClose,
}: {
  draft: AutoMarketConfigDraft;
  draftSetters: AutoMarketConfigDraftSetters;
  updating: boolean;
  onSubmit: () => void;
  onClose?: () => void;
}) {
  return (
    <div>
      <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[0.9fr_0.9fr_0.9fr_auto]">
        <DarkSelect label="자동 주문 생성" value={draft.enabled ? "true" : "false"} onChange={(value) => draftSetters.setEnabled(value === "true")}>
          <option value="true">가동</option>
          <option value="false">정지</option>
        </DarkSelect>
        <DarkInput label="1회 주문 최대 수량" value={draft.maxOrderQuantity} onChange={draftSetters.setMaxOrderQuantity} placeholder="4" />
        <DarkInput label="미체결 호가 TTL(초)" value={draft.orderTtlSeconds} onChange={draftSetters.setOrderTtlSeconds} placeholder="15" />
        <div className="grid grid-cols-2 gap-2 self-end">
          <button type="button" onClick={onSubmit} disabled={updating} className="min-h-11 rounded-md bg-white px-3 py-3 text-sm font-black text-[#101418] disabled:opacity-50">
            {updating ? "저장 중" : "저장"}
          </button>
          {onClose ? (
            <button type="button" onClick={onClose} className="min-h-11 rounded-md bg-white/10 px-3 py-3 text-sm font-black text-white">닫기</button>
          ) : null}
        </div>
      </div>
      <div className="mt-4 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <DistributionBiasEditor
          description="06·09·12·15시에 생성되는 주 랜덤의 최빈 구간입니다. 실제 주문 반영 비중은 60%입니다."
          label="주 랜덤 분포 편향"
          onChange={draftSetters.setPrimaryDistributionBias}
          values={draft.primaryDistributionBias}
        />
        <DistributionBiasEditor
          description="시뮬레이션 30분마다 생성되는 보조 랜덤의 최빈 구간입니다. 실제 주문 반영 비중은 40%입니다."
          label="보조 랜덤 분포 편향"
          onChange={draftSetters.setSecondaryDistributionBias}
          values={draft.secondaryDistributionBias}
        />
      </div>
    </div>
  );
}

export function AdminAutoMarketConfigPanel({
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
  return (
    <section className="mt-5 rounded-lg border border-white/10 bg-white/[0.06] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-black">종목별 자동장 압력 분포</h2>
          <p className="mt-1 max-w-3xl text-xs font-bold leading-5 text-[#8b95a1]">
            각 설정값은 결과를 고정하지 않고 난수 분포가 가장 자주 모일 위치를 정합니다. 모든 생성값은 -100~100이며 주 60%, 보조 40%로 합성됩니다.
          </p>
        </div>
        <span className="text-xs font-bold text-[#64a8ff]">주 06·09·12·15시 · 보조 30분</span>
      </div>
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto]">
        <DarkSelect label="자동장 대상 종목" value={draft.symbol} onChange={(value) => {
          const config = configs.find((item) => item.symbol === value);
          if (config) {
            onSelectDraft(config);
            return;
          }
          draftSetters.setSymbol(value);
        }}>
          <option value="">선택</option>
          {configs.map((config) => <option key={config.symbol} value={config.symbol}>{config.symbol}</option>)}
        </DarkSelect>
        <button type="button" onClick={onSubmit} disabled={updating || !draft.symbol} className="min-h-11 self-end rounded-md bg-white px-4 py-3 text-sm font-black text-[#101418] disabled:opacity-50">
          {updating ? "저장 중" : "현재 설정 저장"}
        </button>
      </div>
      <p className="mt-2 text-xs font-bold leading-5 text-[#8b95a1]">
        편향 0은 중앙값 근처가 완만하게 많고, +100은 양의 극단 근처가, -100은 음의 극단 근처가 더 자주 나오도록 분포를 기울입니다.
      </p>
      <AutoMarketConfigGuide />
      <div className="mt-4 space-y-3">
        {configs.map((config) => (
          <article key={config.symbol} className="overflow-hidden rounded-md border border-white/10 bg-black/10">
            <div className="grid gap-4 p-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
              <dl className="grid min-w-0 grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="min-w-0">
                  <dt className="text-[11px] font-bold text-[#7f8a96]">종목</dt>
                  <dd className="mt-1 truncate text-sm font-black text-white">{config.symbol}</dd>
                </div>
                <div>
                  <dt className="text-[11px] font-bold text-[#7f8a96]">자동 주문 생성</dt>
                  <dd className="mt-1">
                    <EnabledToggleButton enabled={config.enabled} disabled={togglingSymbol === config.symbol} onToggle={() => onToggleEnabled(config)} />
                  </dd>
                </div>
                <div>
                  <dt className="text-[11px] font-bold text-[#7f8a96]">1회 최대 수량</dt>
                  <dd className="mt-1 text-sm font-black tabular-nums text-white">{config.maxOrderQuantity}주</dd>
                </div>
                <div>
                  <dt className="text-[11px] font-bold text-[#7f8a96]">미체결 TTL</dt>
                  <dd className="mt-1 text-sm font-black tabular-nums text-white">{config.orderTtlSeconds}초</dd>
                </div>
              </dl>
              <div className="grid grid-cols-3 gap-1.5 lg:w-[300px]">
                <button type="button" onClick={() => onSelectDraft(config)} className="min-h-9 rounded-md bg-white/10 px-2 py-2 text-xs font-black text-white">설정</button>
                <button type="button" onClick={() => onRegenerateRegime(config)} disabled={regeneratingRegimeSymbol === config.symbol} className="min-h-9 rounded-md bg-[#f59e0b]/20 px-2 py-2 text-xs font-black text-[#fcd34d] disabled:opacity-50">
                  {regeneratingRegimeSymbol === config.symbol ? "생성 중" : "주 재생성"}
                </button>
                <button type="button" onClick={() => onRegenerateRegimeModifier(config)} disabled={!config.dailyRegime || regeneratingRegimeModifierSymbol === config.symbol} className="min-h-9 rounded-md bg-[#64a8ff]/15 px-2 py-2 text-xs font-black text-[#9ecbff] disabled:opacity-50">
                  {regeneratingRegimeModifierSymbol === config.symbol ? "생성 중" : "보조 재생성"}
                </button>
              </div>
            </div>
            <div className="border-t border-white/[0.07] bg-white/[0.025] px-3 py-3">
              <p className="mb-2 text-[11px] font-black text-[#7f8a96]">현재 구간 압력</p>
              <AutoMarketDailyRegimeCell regime={config.dailyRegime} />
            </div>
            {editingSymbol === config.symbol ? (
              <div className="border-t border-white/10 bg-black/20 px-4 py-4">
                <ConfigEditor draft={draft} draftSetters={draftSetters} onClose={() => draftSetters.setEditingSymbol(null)} onSubmit={onSubmit} updating={updating} />
              </div>
            ) : null}
          </article>
        ))}
        {configs.length === 0 ? (
          <div className="rounded-md border border-white/10 bg-black/10 px-3 py-4 text-sm font-bold text-[#8b95a1]">
            자동장 설정 대상 종목이 없습니다.
          </div>
        ) : null}
      </div>
    </section>
  );
}
