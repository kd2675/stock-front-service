import { Fragment } from "react";

import {
  formatAutoIntensityFollowLevel,
  formatAutoMarketAssetPreference,
  formatAutoMarketPriceDirection,
} from "@/app/supply-demand/admin/AdminFormatters";
import { EnabledToggleButton, DarkInput, DarkSelect } from "@/app/supply-demand/admin/AdminFormControls";
import { AutoMarketConfigGuide } from "@/app/supply-demand/admin/AdminSignalGuide";
import type { AutoMarketConfig, AutoMarketDailyRegime } from "@/app/types/stock";

export type AutoMarketConfigDraft = {
  symbol: string;
  enabled: boolean;
  intensity: string;
  maxOrderQuantity: string;
  orderTtlSeconds: string;
};

export type AutoMarketConfigDraftSetters = {
  setSymbol: (value: string) => void;
  setEnabled: (value: boolean) => void;
  setIntensity: (value: string) => void;
  setMaxOrderQuantity: (value: string) => void;
  setOrderTtlSeconds: (value: string) => void;
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

function formatAutoMarketRegimePhase(phase: AutoMarketDailyRegime["regimePhase"]) {
  if (phase === "MIDDAY") {
    return "장 중간 이후";
  }
  return "장 전반";
}

function formatAutoMarketRegimeHeader(regime: AutoMarketDailyRegime) {
  const displayTime = regime.createdAt?.slice(11, 16);
  if (!displayTime) {
    return `${regime.simulationTradeDate} · ${formatAutoMarketRegimePhase(regime.regimePhase)}`;
  }
  return `${regime.simulationTradeDate} · ${displayTime} · ${formatAutoMarketRegimePhase(regime.regimePhase)}`;
}

function formatSignedModifier(value: number) {
  if (value > 0) {
    return `+${value}`;
  }
  return `${value}`;
}

type RegimeBadgeTone = "neutral" | "blue" | "green" | "red" | "amber" | "slate";
type RegimeBadgeSize = "default" | "prominent";

const regimeBadgeToneClassNames: Record<RegimeBadgeTone, string> = {
  neutral: "border-white/10 bg-white/[0.06] text-[#d7dee7]",
  blue: "border-[#64a8ff]/25 bg-[#64a8ff]/10 text-[#9ecbff]",
  green: "border-[#22c55e]/25 bg-[#22c55e]/10 text-[#86efac]",
  red: "border-[#ef4444]/25 bg-[#ef4444]/10 text-[#fca5a5]",
  amber: "border-[#f59e0b]/25 bg-[#f59e0b]/10 text-[#fcd34d]",
  slate: "border-white/10 bg-black/20 text-[#9aa7b4]",
};

const regimeBadgeSizeClassNames: Record<RegimeBadgeSize, string> = {
  default: "min-h-6 px-2 py-1 text-[11px]",
  prominent: "min-h-7 px-2.5 py-1 text-xs",
};

function RegimeBadge({
  description,
  label,
  size = "default",
  tone = "neutral",
  value,
}: {
  description?: string;
  label: string;
  size?: RegimeBadgeSize;
  tone?: RegimeBadgeTone;
  value: string;
}) {
  const ariaLabel = description ? `${label} ${value}. ${description}` : `${label} ${value}`;
  return (
    <span
      aria-label={ariaLabel}
      className={`group relative inline-flex items-center gap-1 rounded-md border font-black leading-none outline-none ${regimeBadgeSizeClassNames[size]} ${regimeBadgeToneClassNames[tone]}`}
      tabIndex={description ? 0 : undefined}
      title={description}
    >
      <span className="text-current/65">{label}</span>
      <span>{value}</span>
      {description ? (
        <span
          className="pointer-events-none absolute left-0 top-[calc(100%+6px)] z-50 w-64 max-w-[80vw] rounded-md border border-white/10 bg-[#111827] px-3 py-2 text-left text-[11px] font-bold leading-4 text-[#d7dee7] opacity-0 shadow-[0_16px_40px_rgba(0,0,0,0.35)] transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100"
          role="tooltip"
        >
          {description}
        </span>
      ) : null}
    </span>
  );
}

const regimeBadgeDescriptions = {
  priceDirection: "일일 주 랜덤값의 가격 방향입니다. 상승은 상방/매수 압력을, 하락은 하방/매도 압력을 만듭니다.",
  assetPreference: "일일 주 랜덤값의 자산 선호입니다. 주식 보유는 매수/보유 성향을, 현금 전환은 매도/현금화 성향을 강화합니다.",
  directionIntensity: "가격 방향과 주식/현금 선호를 얼마나 강하게 따를지 정합니다. 10에 가까울수록 주문 압력이 커집니다.",
  volatility: "해당 시뮬레이션 구간의 가격 흔들림 정도입니다. 높을수록 호가 분산과 가격 변화 여지가 커집니다.",
  liquidity: "주문 공급 밀도에 쓰이는 유동성 레벨입니다. 높을수록 자동장이 주문을 더 촘촘하게 공급하기 쉽습니다.",
  executionAggression: "지정가를 상대 호가에 얼마나 가깝게 낼지에 영향을 줍니다. 높을수록 체결 가능성이 큰 가격을 냅니다.",
  modifierPriceDirection: "현재 30분 구간의 보조 가격 방향 랜덤값입니다. -10은 강한 하락, +10은 강한 상승 압력입니다.",
  modifierAssetPreference: "현재 30분 구간의 보조 주식/현금 랜덤값입니다. -10은 강한 현금 전환, +10은 강한 주식 보유 압력입니다.",
  modifierDirectionIntensity: "현재 30분 구간의 보조 추종 강도 레벨입니다. 일일 추종 강도와 60:40으로 섞입니다.",
  modifierVolatility: "현재 30분 구간의 보조 변동성 레벨입니다. 일일 변동성과 60:40으로 섞입니다.",
  modifierLiquidity: "현재 30분 구간의 보조 유동성 레벨입니다. 일일 유동성과 60:40으로 섞입니다.",
  modifierExecutionAggression: "현재 30분 구간의 보조 체결 공격성 레벨입니다. 일일 체결 공격성과 60:40으로 섞입니다.",
  finalPricePressure: "일일 주 랜덤값 60%와 30분 보조 랜덤값 40%를 합산한 최종 가격 방향 압력입니다. 양수는 상승/매수, 음수는 하락/매도 쪽입니다.",
  finalAssetPressure: "일일 주 랜덤값 60%와 30분 보조 랜덤값 40%를 합산한 최종 주식/현금 압력입니다. 양수는 주식 보유, 음수는 현금 전환 쪽입니다.",
} as const;

function directionTone(direction: AutoMarketDailyRegime["priceDirection"]): RegimeBadgeTone {
  if (direction === "UP") {
    return "green";
  }
  if (direction === "DOWN") {
    return "red";
  }
  return "slate";
}

function assetPreferenceTone(preference: AutoMarketDailyRegime["assetPreference"]): RegimeBadgeTone {
  if (preference === "STOCK") {
    return "green";
  }
  if (preference === "CASH") {
    return "red";
  }
  return "slate";
}

function signedDirectionTone(value: number): RegimeBadgeTone {
  if (value > 0) {
    return "green";
  }
  if (value < 0) {
    return "red";
  }
  return "slate";
}

function signedSupportTone(value: number, positiveTone: RegimeBadgeTone = "blue"): RegimeBadgeTone {
  if (value > 0) {
    return positiveTone;
  }
  if (value < 0) {
    return "slate";
  }
  return "neutral";
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function priceDirectionSign(direction: AutoMarketDailyRegime["priceDirection"]) {
  if (direction === "UP") {
    return 1;
  }
  if (direction === "DOWN") {
    return -1;
  }
  return 0;
}

function assetPreferenceSign(preference: AutoMarketDailyRegime["assetPreference"]) {
  if (preference === "STOCK") {
    return 1;
  }
  if (preference === "CASH") {
    return -1;
  }
  return 0;
}

function formatSecondaryLevel(value: number) {
  if (value <= 0) {
    return `${value}`;
  }
  return `${value}/10`;
}

function calculateFinalPressure(primarySign: number, directionIntensity: number, directionalModifier: number) {
  const primaryPressure = primarySign * clamp(directionIntensity, 1, 10) / 10;
  const secondaryPressure = clamp(directionalModifier, -10, 10) / 10;
  return clamp(primaryPressure * 0.6 + secondaryPressure * 0.4, -1, 1);
}

function formatFinalPressure(value: number) {
  const percent = Math.round(value * 100);
  if (percent > 0) {
    return `+${percent}%`;
  }
  return `${percent}%`;
}

function finalPressureTone(value: number): RegimeBadgeTone {
  if (value > 0.05) {
    return "green";
  }
  if (value < -0.05) {
    return "red";
  }
  return "neutral";
}

function AutoMarketDailyRegimeCell({ regime }: { regime?: AutoMarketDailyRegime | null }) {
  if (!regime) {
    return (
      <div className="space-y-1 text-xs font-bold text-[#8b95a1]">
        <div>미생성</div>
        <div>장 시작 30분 전, 중간 이후 첫 실행 때 생성</div>
      </div>
    );
  }
  const modifier = regime.currentModifier;
  const finalPricePressure = calculateFinalPressure(
    priceDirectionSign(regime.priceDirection),
    regime.directionIntensity,
    modifier?.priceDirectionModifier ?? 0,
  );
  const finalAssetPressure = calculateFinalPressure(
    assetPreferenceSign(regime.assetPreference),
    regime.directionIntensity,
    modifier?.assetPreferenceModifier ?? 0,
  );
  return (
    <div className="space-y-2">
      <div className="text-[11px] font-bold leading-none text-[#8b95a1]">
        {formatAutoMarketRegimeHeader(regime)}
      </div>
      <div className="flex flex-wrap gap-1.5">
        <RegimeBadge description={regimeBadgeDescriptions.priceDirection} label="가격 방향" tone={directionTone(regime.priceDirection)} value={formatAutoMarketPriceDirection(regime.priceDirection)} />
        <RegimeBadge description={regimeBadgeDescriptions.assetPreference} label="주식/현금" tone={assetPreferenceTone(regime.assetPreference)} value={formatAutoMarketAssetPreference(regime.assetPreference)} />
      </div>
      <div className="flex flex-wrap gap-1.5">
        <RegimeBadge description={regimeBadgeDescriptions.directionIntensity} label="추종 강도" tone="blue" value={`${regime.directionIntensity}/10`} />
        <RegimeBadge description={regimeBadgeDescriptions.volatility} label="변동성" tone="amber" value={`${regime.volatilityLevel}/10`} />
        <RegimeBadge description={regimeBadgeDescriptions.liquidity} label="유동성" tone="blue" value={`${regime.liquidityLevel}/10`} />
        <RegimeBadge description={regimeBadgeDescriptions.executionAggression} label="체결 공격성" tone="amber" value={`${regime.executionAggressionLevel}/10`} />
      </div>
      {regime.currentModifier ? (
        <div className="space-y-1">
          <div className="text-[11px] font-bold leading-none text-[#8b95a1]">
            30분 보조 {regime.currentModifier.modifierWindowStartAt.slice(11, 16)}
          </div>
          <div className="flex flex-wrap gap-1.5">
            <RegimeBadge description={regimeBadgeDescriptions.modifierPriceDirection} label="방향" tone={signedDirectionTone(regime.currentModifier.priceDirectionModifier)} value={formatSignedModifier(regime.currentModifier.priceDirectionModifier)} />
            <RegimeBadge description={regimeBadgeDescriptions.modifierAssetPreference} label="주식/현금" tone={signedDirectionTone(regime.currentModifier.assetPreferenceModifier)} value={formatSignedModifier(regime.currentModifier.assetPreferenceModifier)} />
            <RegimeBadge description={regimeBadgeDescriptions.modifierDirectionIntensity} label="추종 강도" tone={signedSupportTone(regime.currentModifier.directionIntensityModifier, "blue")} value={formatSecondaryLevel(regime.currentModifier.directionIntensityModifier)} />
            <RegimeBadge description={regimeBadgeDescriptions.modifierVolatility} label="변동성" tone={signedSupportTone(regime.currentModifier.volatilityModifier, "amber")} value={formatSecondaryLevel(regime.currentModifier.volatilityModifier)} />
            <RegimeBadge description={regimeBadgeDescriptions.modifierLiquidity} label="유동성" tone={signedSupportTone(regime.currentModifier.liquidityModifier, "blue")} value={formatSecondaryLevel(regime.currentModifier.liquidityModifier)} />
            <RegimeBadge description={regimeBadgeDescriptions.modifierExecutionAggression} label="체결 공격성" tone={signedSupportTone(regime.currentModifier.executionAggressionModifier, "amber")} value={formatSecondaryLevel(regime.currentModifier.executionAggressionModifier)} />
          </div>
        </div>
      ) : (
        <div className="text-[11px] font-bold text-[#8b95a1]">30분 보조 미생성</div>
      )}
      <div className="flex flex-wrap gap-1.5 pt-0.5">
        <RegimeBadge
          description={regimeBadgeDescriptions.finalPricePressure}
          label="최종 방향"
          size="prominent"
          value={formatFinalPressure(finalPricePressure)}
          tone={finalPressureTone(finalPricePressure)}
        />
        <RegimeBadge
          description={regimeBadgeDescriptions.finalAssetPressure}
          label="최종 주식/현금"
          size="prominent"
          value={formatFinalPressure(finalAssetPressure)}
          tone={finalPressureTone(finalAssetPressure)}
        />
      </div>
      <div className="max-w-[220px] truncate font-mono text-[11px] font-bold text-[#8b95a1]" title={`seed ${regime.seed}`}>
        seed {regime.seed}
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
          <h2 className="text-base font-black">종목별 자동장 기본값</h2>
          <p className="mt-1 text-xs font-bold text-[#8b95a1]">자동참여자가 종목별 주문을 만들 때 먼저 적용하는 방향 추종 강도, 주문 수량 상한, 미체결 유지 시간입니다.</p>
        </div>
        <span className="text-xs font-bold text-[#64a8ff]">batch 자동 주문 생성 기준</span>
      </div>
      <div className="mt-4 grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_0.8fr_0.8fr_0.8fr_0.8fr_auto]">
        <DarkSelect label="자동장 대상 종목" value={draft.symbol} onChange={(value) => {
          const config = configs.find((item) => item.symbol === value);
          if (config) {
            onSelectDraft(config);
            return;
          }
          draftSetters.setSymbol(value);
        }}>
          <option value="">선택</option>
          {configs.map((config) => (
            <option key={config.symbol} value={config.symbol}>{config.symbol}</option>
          ))}
        </DarkSelect>
        <DarkSelect label="자동 주문 생성" value={draft.enabled ? "true" : "false"} onChange={(value) => draftSetters.setEnabled(value === "true")}>
          <option value="true">가동</option>
          <option value="false">정지</option>
        </DarkSelect>
        <DarkInput label="기본 추종 강도(1-10)" value={draft.intensity} onChange={draftSetters.setIntensity} placeholder="10" />
        <DarkInput label="1회 주문 최대 수량" value={draft.maxOrderQuantity} onChange={draftSetters.setMaxOrderQuantity} placeholder="4" />
        <DarkInput label="미체결 호가 TTL(초)" value={draft.orderTtlSeconds} onChange={draftSetters.setOrderTtlSeconds} placeholder="15" />
        <button type="button" onClick={onSubmit} disabled={updating} className="min-h-11 min-w-0 self-end rounded-md bg-white px-3 py-3 text-sm font-black text-[#101418] disabled:opacity-50 sm:col-span-2 lg:col-span-1">
          {updating ? "저장 중" : "저장"}
        </button>
      </div>
      <p className="mt-2 text-xs font-bold leading-5 text-[#8b95a1]">
        미체결 호가 TTL은 실제 서버 시간이 아니라 시뮬레이션 시간 기준입니다. 예: 시뮬레이션 하루가 현실 2시간이면 TTL 60초는 현실 약 5초 후 만료됩니다.
      </p>
      <AutoMarketConfigGuide />
      <div className="mt-4 overflow-x-auto rounded-md border border-white/10">
        <table className="min-w-[940px] w-full border-collapse text-sm">
          <thead className="bg-white/10 text-left text-[#b8c2cc]">
            <tr>
              <th className="px-3 py-2">종목</th>
              <th className="px-3 py-2">자동 주문 생성</th>
              <th className="px-3 py-2">추종 성향</th>
              <th className="px-3 py-2">기본 추종 강도</th>
              <th className="px-3 py-2">오늘 랜덤값</th>
              <th className="px-3 py-2">1회 주문 최대 수량</th>
              <th className="px-3 py-2">미체결 호가 TTL</th>
              <th className="px-3 py-2">수정</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {configs.map((config) => (
              <Fragment key={config.symbol}>
                <tr>
                  <td className="px-3 py-2 font-black">{config.symbol}</td>
                  <td className="px-3 py-2">
                    <EnabledToggleButton
                      enabled={config.enabled}
                      disabled={togglingSymbol === config.symbol}
                      onToggle={() => onToggleEnabled(config)}
                    />
                  </td>
                  <td className="px-3 py-2">{formatAutoIntensityFollowLevel(config.intensity)}</td>
                  <td className="px-3 py-2 tabular-nums">{config.intensity}/10</td>
                  <td className="px-3 py-2">
                    <div className="flex min-w-[260px] items-start justify-between gap-2">
                      <AutoMarketDailyRegimeCell regime={config.dailyRegime} />
                      <div className="grid shrink-0 gap-1">
                        <button
                          type="button"
                          onClick={() => onRegenerateRegime(config)}
                          disabled={regeneratingRegimeSymbol === config.symbol}
                          className="min-h-8 rounded-md bg-[#f59e0b]/20 px-2 py-1 text-xs font-black text-[#fcd34d] disabled:opacity-50"
                        >
                          {regeneratingRegimeSymbol === config.symbol ? "변경 중" : "주 랜덤"}
                        </button>
                        <button
                          type="button"
                          onClick={() => onRegenerateRegimeModifier(config)}
                          disabled={!config.dailyRegime || regeneratingRegimeModifierSymbol === config.symbol}
                          className="min-h-8 rounded-md bg-[#64a8ff]/15 px-2 py-1 text-xs font-black text-[#9ecbff] disabled:opacity-50"
                        >
                          {regeneratingRegimeModifierSymbol === config.symbol ? "변경 중" : "보조 랜덤"}
                        </button>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2 tabular-nums">{config.maxOrderQuantity}주</td>
                  <td className="px-3 py-2 tabular-nums">{config.orderTtlSeconds}초</td>
                  <td className="px-3 py-2">
                    <button type="button" onClick={() => onSelectDraft(config)} className="rounded-md bg-white/10 px-2 py-1 text-xs font-black text-white">
                      수정
                    </button>
                  </td>
                </tr>
                {editingSymbol === config.symbol ? (
                  <tr>
                    <td colSpan={8} className="bg-black/20 px-3 py-3">
                      <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[0.9fr_0.9fr_0.9fr_auto_auto]">
                        <DarkSelect label="자동 주문 생성" value={draft.enabled ? "true" : "false"} onChange={(value) => draftSetters.setEnabled(value === "true")}>
                          <option value="true">가동</option>
                          <option value="false">정지</option>
                        </DarkSelect>
                        <DarkInput label="기본 추종 강도(1-10)" value={draft.intensity} onChange={draftSetters.setIntensity} placeholder="10" />
                        <DarkInput label="1회 주문 최대 수량" value={draft.maxOrderQuantity} onChange={draftSetters.setMaxOrderQuantity} placeholder="4" />
                        <DarkInput label="미체결 호가 TTL(초)" value={draft.orderTtlSeconds} onChange={draftSetters.setOrderTtlSeconds} placeholder="15" />
                        <div className="grid grid-cols-2 gap-2 self-end">
                          <button type="button" onClick={onSubmit} disabled={updating} className="min-h-11 rounded-md bg-white px-3 py-3 text-sm font-black text-[#101418] disabled:opacity-50">
                            {updating ? "저장 중" : "저장"}
                          </button>
                          <button type="button" onClick={() => draftSetters.setEditingSymbol(null)} className="min-h-11 rounded-md bg-white/10 px-3 py-3 text-sm font-black text-white">
                            닫기
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : null}
              </Fragment>
            ))}
            {configs.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-3 py-4 text-[#8b95a1]">자동장 설정 대상 종목이 없습니다.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}
