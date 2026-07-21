import { MAX_LISTING_AUTO_NEW_ORDERS_PER_SIDE_PER_RUN } from "@/app/supply-demand/admin/AdminConstants";
import {
  formatListingAutoOperationMode,
  formatListingAutoStrategyProfile,
  formatNumber,
  formatWon,
} from "@/app/supply-demand/admin/AdminFormatters";
import { DarkInput, DarkSelect } from "@/app/supply-demand/admin/AdminFormControls";
import { AdminTargetHoldingPercentageControl } from "@/app/supply-demand/admin/AdminTargetHoldingPercentageControl";
import {
  LISTING_AUTO_OPERATION_MODES,
  LISTING_AUTO_STRATEGY_PROFILES,
  listingAutoStrategyPreset,
} from "@/app/supply-demand/admin/listingAutoPolicy";
import { calculateListingAutoTargetFit, type ListingAutoTargetFit } from "@/app/supply-demand/admin/listingAutoTargetFit";
import type {
  ListingAutoAccount,
  ListingAutoOperationMode,
  ListingAutoPosition,
  ListingAutoStrategyProfile,
} from "@/app/types/stock";

export type ListingAutoAccountDraft = {
  symbol: string;
  displayName: string;
  enabled: boolean;
  positionSide: ListingAutoPosition;
  operationMode: ListingAutoOperationMode;
  strategyProfile: ListingAutoStrategyProfile;
  maxOrderQuantity: string;
  orderTtlSeconds: string;
  priceOffsetTicks: string;
  targetSpreadTicks: string;
  inventorySkewTicks: string;
  minimumProfitRate: string;
  aggressiveUnwindThreshold: string;
  aggressiveOrderRatio: string;
  targetBuyQuantity: string;
  targetSellQuantity: string;
  targetHoldingQuantity: string;
  inventoryBandQuantity: string;
};

export type ListingAutoAccountDraftSetters = {
  setSymbol: (value: string) => void;
  setDisplayName: (value: string) => void;
  setEnabled: (value: boolean) => void;
  setPositionSide: (value: ListingAutoPosition) => void;
  setOperationMode: (value: ListingAutoOperationMode) => void;
  setStrategyProfile: (value: ListingAutoStrategyProfile) => void;
  setMaxOrderQuantity: (value: string) => void;
  setOrderTtlSeconds: (value: string) => void;
  setPriceOffsetTicks: (value: string) => void;
  setTargetSpreadTicks: (value: string) => void;
  setInventorySkewTicks: (value: string) => void;
  setMinimumProfitRate: (value: string) => void;
  setAggressiveUnwindThreshold: (value: string) => void;
  setAggressiveOrderRatio: (value: string) => void;
  setTargetBuyQuantity: (value: string) => void;
  setTargetSellQuantity: (value: string) => void;
  setTargetHoldingQuantity: (value: string) => void;
  setInventoryBandQuantity: (value: string) => void;
  setEditingSymbol: (value: string | null) => void;
};

type Props = {
  accounts: ListingAutoAccount[];
  selectedAccount: ListingAutoAccount | null;
  draft: ListingAutoAccountDraft;
  draftSetters: ListingAutoAccountDraftSetters;
  editingSymbol: string | null;
  updating: boolean;
  onSelectDraft: (account: ListingAutoAccount) => void;
  onSubmit: () => void;
};

type AccountOperatingState = {
  buyOrderFragments: number;
  effectiveBuyTarget: number;
  effectiveSellTarget: number;
  lowerHoldingLimit: number;
  sellOrderFragments: number;
  targetHoldingPercent: number;
  upperHoldingLimit: number;
};

export function AdminListingAutoAccountPanel({
  accounts,
  selectedAccount,
  draft,
  draftSetters,
  editingSymbol,
  updating,
  onSelectDraft,
  onSubmit,
}: Props) {
  const draftAccount = accounts.find((account) => account.symbol === draft.symbol) ?? null;
  const parsedTargetHoldingQuantity = Number(draft.targetHoldingQuantity);
  const targetHoldingQuantityValid = Number.isSafeInteger(parsedTargetHoldingQuantity) && parsedTargetHoldingQuantity >= 0;
  const targetHoldingFit = draftAccount && targetHoldingQuantityValid
    ? calculateListingAutoTargetFit({
        issuedShares: draftAccount.issuedShares,
        holdingQuantity: draftAccount.holdingQuantity,
        openBuyQuantity: draftAccount.openBuyQuantity,
        openSellQuantity: draftAccount.openSellQuantity,
        targetHoldingQuantity: parsedTargetHoldingQuantity,
      })
    : null;

  const applyTargetHoldingConfig = () => {
    if (!targetHoldingFit) {
      return;
    }
    draftSetters.setEnabled(true);
    draftSetters.setPositionSide("TWO_SIDED");
    draftSetters.setInventoryBandQuantity(String(targetHoldingFit.inventoryBandQuantity));
    draftSetters.setTargetBuyQuantity(String(targetHoldingFit.targetBuyQuantity));
    draftSetters.setTargetSellQuantity(String(targetHoldingFit.targetSellQuantity));
    draftSetters.setMaxOrderQuantity(String(targetHoldingFit.maxOrderQuantity));
  };

  const applyStrategyProfile = (profile: ListingAutoStrategyProfile) => {
    const preset = listingAutoStrategyPreset(profile);
    draftSetters.setStrategyProfile(profile);
    draftSetters.setTargetSpreadTicks(preset.targetSpreadTicks);
    draftSetters.setInventorySkewTicks(preset.inventorySkewTicks);
    draftSetters.setMinimumProfitRate(preset.minimumProfitRate);
    draftSetters.setAggressiveUnwindThreshold(preset.aggressiveUnwindThreshold);
    draftSetters.setAggressiveOrderRatio(preset.aggressiveOrderRatio);
  };

  return (
    <section className="admin-panel mt-5 overflow-hidden">
      <PanelHeader accountCount={accounts.length} />

      {accounts.length === 0 ? (
        <EmptyAccounts />
      ) : (
        <div className="mt-5 grid min-w-0 gap-5 xl:grid-cols-[280px_minmax(0,1fr)]">
          <AccountSelector
            accounts={accounts}
            activeSymbol={draft.symbol}
            editingSymbol={editingSymbol}
            onSelect={onSelectDraft}
          />

          <div className="min-w-0">
            {selectedAccount ? (
              <>
                <AccountSummary account={selectedAccount} />

                <form
                  className="mt-4 grid min-w-0 gap-4"
                  onSubmit={(event) => {
                    event.preventDefault();
                    onSubmit();
                  }}
                >
                  <FormSection title="운용 기본" description="계정 상태와 운용 목적을 먼저 정합니다.">
                    <div className="grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      <DarkInput label="표시명" value={draft.displayName} onChange={draftSetters.setDisplayName} placeholder="상장주관사" className="sm:col-span-2" />
                      <DarkSelect label="상태" value={draft.enabled ? "true" : "false"} onChange={(value) => draftSetters.setEnabled(value === "true")}>
                        <option value="true">가동</option>
                        <option value="false">정지</option>
                      </DarkSelect>
                      <DarkSelect label="포지션" value={draft.positionSide} onChange={(value) => draftSetters.setPositionSide(value as ListingAutoPosition)}>
                        <option value="SELL_ONLY">매도 전용</option>
                        <option value="BUY_ONLY">매수 전용</option>
                        <option value="TWO_SIDED">양방향 기관 운용</option>
                      </DarkSelect>
                      <DarkSelect label="운용 목적" value={draft.operationMode} onChange={(value) => {
                        const mode = value as ListingAutoOperationMode;
                        draftSetters.setOperationMode(mode);
                        if (mode !== "UNDERWRITER_RETURN") {
                          draftSetters.setPositionSide("TWO_SIDED");
                        }
                      }}>
                        {LISTING_AUTO_OPERATION_MODES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                      </DarkSelect>
                      <DarkSelect label="전략 프리셋" value={draft.strategyProfile} onChange={(value) => applyStrategyProfile(value as ListingAutoStrategyProfile)}>
                        {LISTING_AUTO_STRATEGY_PROFILES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                      </DarkSelect>
                      <PolicyExplanation draft={draft} />
                    </div>
                  </FormSection>

                  <FormSection title="재고 목표" description="발행량 대비 목표 보유율을 기준으로 밴드와 호가 잔량을 맞춥니다.">
                    <div className="grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      <AdminTargetHoldingPercentageControl
                        issuedShares={draftAccount?.issuedShares ?? 0}
                        targetHoldingQuantity={draft.targetHoldingQuantity}
                        onTargetHoldingQuantityChange={draftSetters.setTargetHoldingQuantity}
                        actionLabel="권장 수량 적용"
                        onAction={applyTargetHoldingConfig}
                        actionDisabled={!targetHoldingFit}
                      />
                      <TargetHoldingFitPreview fit={targetHoldingFit} />
                      <DarkInput label="보유 허용 밴드(±주)" value={draft.inventoryBandQuantity} onChange={draftSetters.setInventoryBandQuantity} placeholder="30000" />
                      <DarkInput label="목표 매수 호가 잔량" value={draft.targetBuyQuantity} onChange={draftSetters.setTargetBuyQuantity} placeholder="30000" />
                      <DarkInput label="목표 매도 호가 잔량" value={draft.targetSellQuantity} onChange={draftSetters.setTargetSellQuantity} placeholder="30000" />
                      <DarkInput label="주문 1건 최대 수량" value={draft.maxOrderQuantity} onChange={draftSetters.setMaxOrderQuantity} placeholder="3000" />
                    </div>
                  </FormSection>

                  <AdvancedPolicyFields draft={draft} draftSetters={draftSetters} />

                  <div className="flex flex-col gap-2 border-t border-white/10 pt-4 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-[11px] font-bold leading-5 text-admin-placeholder">
                      저장하면 다음 상장주관사 공급 실행부터 적용됩니다. 기존 미체결 호가는 TTL 또는 취소 시점까지 유지될 수 있습니다.
                    </p>
                    <button
                      type="submit"
                      disabled={updating}
                      className="min-h-11 shrink-0 rounded-md bg-white px-5 py-3 text-sm font-black text-admin-canvas transition hover:bg-admin-accent-label disabled:cursor-wait disabled:opacity-50"
                    >
                      {updating ? "저장 중" : `${selectedAccount.symbol} 설정 저장`}
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="grid min-h-52 place-items-center rounded-md border border-dashed border-white/15 bg-black/15 px-4 text-center">
                <p className="text-sm font-bold text-stock-subtle">왼쪽에서 관리할 계정을 선택하세요.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

function PanelHeader({ accountCount }: { accountCount: number }) {
  return (
    <header className="flex flex-col gap-3 border-b border-white/10 pb-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0 max-w-4xl">
        <h2 className="text-base font-black">상장주관사 자동계정</h2>
        <p className="mt-1 text-xs font-bold leading-5 text-stock-subtle">
          발행원가 대비 성과, 목표 재고, 호가 공급 정책을 계정별로 관리합니다. 평시 호가는 외부 최우선 호가를 침범하지 않고 재고 한계에서만 제한적으로 공격 주문을 냅니다.
        </p>
      </div>
      <span className="inline-flex w-fit shrink-0 items-center rounded-md border border-admin-accent/25 bg-admin-accent-surface px-2.5 py-1.5 text-xs font-black text-admin-accent">
        {accountCount}개 계정
      </span>
    </header>
  );
}

function AccountSelector({
  accounts,
  activeSymbol,
  editingSymbol,
  onSelect,
}: {
  accounts: ListingAutoAccount[];
  activeSymbol: string;
  editingSymbol: string | null;
  onSelect: (account: ListingAutoAccount) => void;
}) {
  return (
    <aside aria-label="상장주관사 계정 선택" className="min-w-0">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 className="text-xs font-black text-admin-muted">계정 선택</h3>
        <span className="text-[11px] font-bold text-admin-placeholder">종목별 1개</span>
      </div>
      <label className="grid min-w-0 gap-1 text-xs font-bold text-admin-muted sm:hidden">
        관리 계정
        <select
          value={activeSymbol}
          onChange={(event) => {
            const account = accounts.find((item) => item.symbol === event.target.value);
            if (account) {
              onSelect(account);
            }
          }}
          className="admin-control h-11 w-full min-w-0 px-3 text-sm font-bold outline-none"
        >
          {accounts.map((account) => (
            <option key={account.symbol} value={account.symbol}>
              {account.symbol} · {account.displayName} · {account.enabled ? "가동" : "정지"}
            </option>
          ))}
        </select>
      </label>
      <div className="hidden min-w-0 gap-2 sm:grid sm:grid-cols-3 xl:grid-cols-1">
        {accounts.map((account) => {
          const active = account.symbol === activeSymbol;
          const holdingPercent = account.issuedShares > 0 ? Math.min((account.holdingQuantity / account.issuedShares) * 100, 100) : 0;
          const profitClassName = account.netProfit >= 0 ? "text-admin-success" : "text-admin-danger";
          return (
            <button
              key={account.symbol}
              type="button"
              aria-pressed={active}
              onClick={() => onSelect(account)}
              className={[
                "group min-w-0 rounded-md border p-3 text-left transition",
                active
                  ? "border-admin-accent/60 bg-admin-accent-surface shadow-[inset_3px_0_0_var(--admin-accent)]"
                  : "border-white/10 bg-black/20 hover:border-white/20 hover:bg-white/[0.055]",
              ].join(" ")}
            >
              <span className="flex min-w-0 items-start justify-between gap-2">
                <span className="min-w-0">
                  <span className="block text-sm font-black text-white">{account.symbol}</span>
                  <span className="mt-0.5 block truncate text-[11px] font-bold text-stock-subtle">{account.displayName}</span>
                </span>
                <span className={[
                  "shrink-0 rounded border px-1.5 py-0.5 text-[10px] font-black",
                  account.enabled
                    ? "border-admin-success/25 bg-admin-success/10 text-admin-success"
                    : "border-white/10 bg-white/[0.04] text-admin-placeholder",
                ].join(" ")}>{account.enabled ? "가동" : "정지"}</span>
              </span>
              <span className="mt-3 flex items-end justify-between gap-2">
                <span>
                  <span className="block text-[10px] font-bold text-admin-placeholder">누적 손익</span>
                  <span className={`mt-0.5 block text-sm font-black tabular-nums ${profitClassName}`}>{formatSignedWon(account.netProfit)}</span>
                </span>
                <span className={`text-xs font-black tabular-nums ${profitClassName}`}>{formatSignedPercent(account.returnRate)}</span>
              </span>
              <span className="mt-3 block h-1.5 overflow-hidden rounded-full bg-white/10">
                <span className="block h-full rounded-full bg-admin-accent" style={{ width: `${holdingPercent}%` }} />
              </span>
              <span className="mt-1.5 flex items-center justify-between gap-2 text-[10px] font-bold text-admin-placeholder">
                <span>보유 {holdingPercent.toFixed(2)}%</span>
                <span>{formatListingAutoStrategyProfile(account.strategyProfile)}</span>
              </span>
              {active && editingSymbol === account.symbol ? <span className="sr-only">현재 편집 중</span> : null}
            </button>
          );
        })}
      </div>
    </aside>
  );
}

function AccountSummary({ account }: { account: ListingAutoAccount }) {
  const state = deriveAccountOperatingState(account);
  const netProfitClassName = account.netProfit >= 0 ? "text-admin-success" : "text-admin-danger";
  const inventoryPosition = account.inventoryBandQuantity > 0
    ? Math.max(-1, Math.min((account.holdingQuantity - account.targetHoldingQuantity) / account.inventoryBandQuantity, 1))
    : 0;
  const inventoryMarker = 2 + ((inventoryPosition + 1) / 2) * 96;

  return (
    <section aria-labelledby="listing-account-summary" className="min-w-0 rounded-md border border-white/10 bg-black/20 p-4">
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 id="listing-account-summary" className="text-lg font-black text-white">{account.symbol}</h3>
            <span className="rounded border border-white/10 bg-white/[0.05] px-2 py-1 text-[10px] font-black text-admin-muted">
              {formatListingAutoOperationMode(account.operationMode)} · {formatListingAutoStrategyProfile(account.strategyProfile)}
            </span>
          </div>
          <p className="mt-1 truncate text-xs font-bold text-stock-subtle">{account.displayName} · {account.userKey} · 계좌 {account.accountId ?? "-"}</p>
        </div>
        <div className="shrink-0 sm:text-right">
          <p className="text-[10px] font-black text-admin-placeholder">누적 손익</p>
          <p className={`mt-0.5 text-xl font-black tabular-nums ${netProfitClassName}`}>{formatSignedWon(account.netProfit)}</p>
          <p className={`mt-0.5 text-xs font-black tabular-nums ${netProfitClassName}`}>{formatSignedPercent(account.returnRate)}</p>
        </div>
      </div>

      <div className="mt-4 grid min-w-0 grid-cols-2 gap-px overflow-hidden rounded-md border border-white/10 bg-white/10 lg:grid-cols-3">
        <SummaryMetric label="최초 인수원가" value={`-${formatWon(account.initialInventoryCost)}`} detail={`${formatNumber(account.initialInventoryQuantity)}주 × ${formatWon(account.initialIssuePrice)}`} />
        <SummaryMetric label="현재 총자산" value={formatWon(account.totalEquity)} detail={`현금 ${formatWon(account.cashBalance)} · 매수예약 ${formatWon(account.reservedBuyCash)}`} />
        <SummaryMetric label="보유 평가" value={formatWon(account.marketValue)} detail={`평균 ${formatWon(account.averagePrice)} · 현재 ${formatWon(account.currentPrice)}`} />
        <SummaryMetric label="보유/매도예약" value={`${formatNumber(account.holdingQuantity)}주`} detail={`예약 ${formatNumber(account.reservedQuantity)}주 · 가용 ${formatNumber(account.availableQuantity)}주`} />
        <SummaryMetric label="유효 호가 목표" value={`매수 ${formatNumber(state.effectiveBuyTarget)} / 매도 ${formatNumber(state.effectiveSellTarget)}주`} detail={`현재 ${formatNumber(account.openBuyQuantity)} / ${formatNumber(account.openSellQuantity)}주`} />
        <SummaryMetric label="다음 보충" value={`매수 ${state.buyOrderFragments} / 매도 ${state.sellOrderFragments}건`} detail={`최대 ${formatNumber(account.maxOrderQuantity)}주 · TTL ${account.orderTtlSeconds}초`} />
      </div>

      <div className="mt-4">
        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-bold">
          <span className="text-admin-muted">재고 밴드 {formatNumber(state.lowerHoldingLimit)}~{formatNumber(state.upperHoldingLimit)}주</span>
          <span className="tabular-nums text-admin-accent">목표 {state.targetHoldingPercent.toFixed(2)}% · {formatNumber(account.targetHoldingQuantity)}주</span>
        </div>
        <div className="relative mt-2 h-2 rounded-full bg-white/10">
          <span className="absolute inset-y-0 left-1/2 w-px bg-white/50" />
          <span className="absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-admin-surface bg-admin-accent" style={{ left: `${inventoryMarker}%` }} />
        </div>
        <div className="mt-1 flex justify-between text-[10px] font-bold text-admin-placeholder"><span>하한</span><span>목표</span><span>상한</span></div>
      </div>
    </section>
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

function PolicyExplanation({ draft }: { draft: ListingAutoAccountDraft }) {
  return (
    <div className="min-w-0 rounded-md border border-white/10 bg-black/20 px-3 py-2.5 text-[11px] font-bold leading-5 text-stock-subtle sm:col-span-2 lg:col-span-2">
      <p className="text-admin-muted">{LISTING_AUTO_OPERATION_MODES.find((item) => item.value === draft.operationMode)?.description}</p>
      <p className="mt-1">{LISTING_AUTO_STRATEGY_PROFILES.find((item) => item.value === draft.strategyProfile)?.description}</p>
    </div>
  );
}

function AdvancedPolicyFields({
  draft,
  draftSetters,
}: {
  draft: ListingAutoAccountDraft;
  draftSetters: ListingAutoAccountDraftSetters;
}) {
  return (
    <details className="group min-w-0 rounded-md border border-white/10 bg-white/[0.025]">
      <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 marker:hidden">
        <span className="min-w-0">
          <span className="block text-sm font-black text-white">호가·위험 정책</span>
          <span className="mt-0.5 block text-[11px] font-bold leading-4 text-stock-subtle">TTL, 사다리, 스프레드와 재고 이탈 시 공격 주문 범위를 조정합니다.</span>
        </span>
        <span aria-hidden="true" className="shrink-0 text-admin-accent transition-transform group-open:rotate-180">⌄</span>
      </summary>
      <div className="grid min-w-0 gap-3 border-t border-white/10 p-4 sm:grid-cols-2 lg:grid-cols-4">
        <DarkInput label="TTL(시뮬 초)" value={draft.orderTtlSeconds} onChange={draftSetters.setOrderTtlSeconds} placeholder="60" />
        <DarkInput label="호가 사다리 깊이(틱)" value={draft.priceOffsetTicks} onChange={draftSetters.setPriceOffsetTicks} placeholder="5" />
        <DarkInput label="목표 스프레드(틱)" value={draft.targetSpreadTicks} onChange={draftSetters.setTargetSpreadTicks} placeholder="4" />
        <DarkInput label="최대 재고 보정(틱)" value={draft.inventorySkewTicks} onChange={draftSetters.setInventorySkewTicks} placeholder="4" />
        <DarkInput label="평시 매도 최소 이익률(%)" value={draft.minimumProfitRate} onChange={draftSetters.setMinimumProfitRate} placeholder="0.5" />
        <DarkInput label="공격 주문 시작 재고비율(0~1)" value={draft.aggressiveUnwindThreshold} onChange={draftSetters.setAggressiveUnwindThreshold} placeholder="0.9" />
        <DarkInput label="공격 주문 최대 비율(0~1)" value={draft.aggressiveOrderRatio} onChange={draftSetters.setAggressiveOrderRatio} placeholder="0.1" />
        <div className="min-w-0 rounded-md border border-white/10 bg-black/20 px-3 py-2.5 text-[11px] font-bold leading-5 text-stock-subtle">
          한 번에 방향별 최대 {MAX_LISTING_AUTO_NEW_ORDERS_PER_SIDE_PER_RUN}개 주문만 생성합니다. 공격 비율 0은 평시 지정가 공급만 허용합니다.
        </div>
      </div>
    </details>
  );
}

function TargetHoldingFitPreview({ fit }: { fit: ListingAutoTargetFit | null }) {
  if (!fit) {
    return (
      <div className="rounded-md border border-white/10 bg-black/20 px-3 py-3 text-xs font-bold leading-5 text-stock-subtle sm:col-span-2 lg:col-span-4">
        목표가 0% 또는 100%이면 대칭 양방향 밴드를 만들 수 없습니다. 매도 전용 또는 매수 전용 수량을 직접 설정하세요.
      </div>
    );
  }
  const netDirection = fit.netTargetQuantity > 0
    ? `순매수 ${formatNumber(fit.netTargetQuantity)}주`
    : fit.netTargetQuantity < 0
      ? `순매도 ${formatNumber(Math.abs(fit.netTargetQuantity))}주`
      : "매수·매도 균형";

  return (
    <div className="overflow-hidden rounded-md border border-admin-accent/25 bg-admin-accent-surface sm:col-span-2 lg:col-span-4">
      <div className="grid gap-px bg-white/10 sm:grid-cols-2 lg:grid-cols-4">
        <FitMetric label="권장 보유 밴드" value={`±${formatNumber(fit.inventoryBandQuantity)}주`} />
        <FitMetric label="양쪽 목표 잔량" value={`${formatNumber(fit.targetBuyQuantity)}주`} />
        <FitMetric label="주문 1건 상한" value={`${formatNumber(fit.maxOrderQuantity)}주`} />
        <FitMetric label="현재 재고 보정" value={netDirection} />
      </div>
      <p className="px-3 py-2.5 text-[11px] font-bold leading-5 text-stock-subtle">
        적용 후 {formatNumber(fit.lowerHoldingLimit)}~{formatNumber(fit.upperHoldingLimit)}주 · 유효 목표 매수 {formatNumber(fit.effectiveBuyTarget)}주 / 매도 {formatNumber(fit.effectiveSellTarget)}주 · 신규 보충 {fit.buyOrderFragments + fit.sellOrderFragments}건
      </p>
    </div>
  );
}

function SummaryMetric({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="min-w-0 bg-admin-surface/95 px-3 py-3">
      <p className="text-[10px] font-black text-admin-placeholder">{label}</p>
      <p className="mt-1 break-words text-sm font-black tabular-nums text-white">{value}</p>
      <p className="mt-1 break-words text-[10px] font-bold leading-4 text-stock-subtle">{detail}</p>
    </div>
  );
}

function FitMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 bg-admin-surface/95 px-3 py-2.5">
      <p className="text-[10px] font-black text-admin-placeholder">{label}</p>
      <p className="mt-1 break-words text-sm font-black tabular-nums text-white">{value}</p>
    </div>
  );
}

function EmptyAccounts() {
  return (
    <div className="mt-5 grid min-h-40 place-items-center rounded-md border border-dashed border-white/15 bg-black/15 px-4 text-center">
      <div>
        <p className="text-sm font-black text-white">상장주관사 자동계정이 없습니다.</p>
        <p className="mt-1 text-xs font-bold text-stock-subtle">신규 상장 이벤트를 적용하면 종목별 계정이 생성됩니다.</p>
      </div>
    </div>
  );
}

function deriveAccountOperatingState(account: ListingAutoAccount): AccountOperatingState {
  const lowerHoldingLimit = Math.max(0, account.targetHoldingQuantity - account.inventoryBandQuantity);
  const upperHoldingLimit = account.targetHoldingQuantity + account.inventoryBandQuantity;
  const effectiveBuyTarget = account.positionSide === "TWO_SIDED"
    ? Math.min(account.targetBuyQuantity, Math.max(0, upperHoldingLimit - account.holdingQuantity))
    : account.positionSide === "BUY_ONLY"
      ? Math.min(account.targetBuyQuantity, Math.max(0, account.targetHoldingQuantity - account.holdingQuantity))
      : 0;
  const effectiveSellTarget = account.positionSide === "TWO_SIDED"
    ? Math.min(account.targetSellQuantity, Math.max(0, account.holdingQuantity - lowerHoldingLimit))
    : account.positionSide === "SELL_ONLY"
      ? Math.min(account.targetSellQuantity, Math.max(0, account.holdingQuantity - account.targetHoldingQuantity))
      : 0;
  const targetHoldingPercent = account.issuedShares > 0 ? (account.targetHoldingQuantity / account.issuedShares) * 100 : 0;
  const buyRefillQuantity = Math.max(0, effectiveBuyTarget - account.openBuyQuantity);
  const sellRefillQuantity = Math.max(0, effectiveSellTarget - account.openSellQuantity);

  return {
    buyOrderFragments: account.maxOrderQuantity > 0 ? Math.ceil(buyRefillQuantity / account.maxOrderQuantity) : 0,
    effectiveBuyTarget,
    effectiveSellTarget,
    lowerHoldingLimit,
    sellOrderFragments: account.maxOrderQuantity > 0 ? Math.ceil(sellRefillQuantity / account.maxOrderQuantity) : 0,
    targetHoldingPercent,
    upperHoldingLimit,
  };
}

function formatSignedWon(value: number): string {
  return `${value >= 0 ? "+" : "-"}${formatWon(Math.abs(value))}`;
}

function formatSignedPercent(value: number): string {
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}
