import { Fragment } from "react";

import DataTableViewport from "@/app/components/DataTableViewport";
import { MAX_LISTING_AUTO_NEW_ORDERS_PER_SIDE_PER_RUN } from "@/app/supply-demand/admin/AdminConstants";
import { formatListingAutoPosition, formatListingAutoPriceDirection, formatNumber, formatWon } from "@/app/supply-demand/admin/AdminFormatters";
import { DarkInput, DarkSelect } from "@/app/supply-demand/admin/AdminFormControls";
import { DarkMetric } from "@/app/supply-demand/admin/AdminMetricCards";
import { AdminTargetHoldingPercentageControl } from "@/app/supply-demand/admin/AdminTargetHoldingPercentageControl";
import { calculateListingAutoTargetFit, type ListingAutoTargetFit } from "@/app/supply-demand/admin/listingAutoTargetFit";
import type { ListingAutoAccount, ListingAutoPosition, ListingAutoPriceDirection } from "@/app/types/stock";

export type ListingAutoAccountDraft = {
  symbol: string;
  displayName: string;
  enabled: boolean;
  positionSide: ListingAutoPosition;
  maxOrderQuantity: string;
  orderTtlSeconds: string;
  priceOffsetTicks: string;
  targetBuyQuantity: string;
  targetSellQuantity: string;
  targetHoldingQuantity: string;
  inventoryBandQuantity: string;
  buyPriceOffsetDirection: ListingAutoPriceDirection;
  sellPriceOffsetDirection: ListingAutoPriceDirection;
};

export type ListingAutoAccountDraftSetters = {
  setSymbol: (value: string) => void;
  setDisplayName: (value: string) => void;
  setEnabled: (value: boolean) => void;
  setPositionSide: (value: ListingAutoPosition) => void;
  setMaxOrderQuantity: (value: string) => void;
  setOrderTtlSeconds: (value: string) => void;
  setPriceOffsetTicks: (value: string) => void;
  setTargetBuyQuantity: (value: string) => void;
  setTargetSellQuantity: (value: string) => void;
  setTargetHoldingQuantity: (value: string) => void;
  setInventoryBandQuantity: (value: string) => void;
  setBuyPriceOffsetDirection: (value: ListingAutoPriceDirection) => void;
  setSellPriceOffsetDirection: (value: ListingAutoPriceDirection) => void;
  setEditingSymbol: (value: string | null) => void;
};

type AdminListingAutoAccountPanelProps = {
  accounts: ListingAutoAccount[];
  selectedAccount: ListingAutoAccount | null;
  draft: ListingAutoAccountDraft;
  draftSetters: ListingAutoAccountDraftSetters;
  editingSymbol: string | null;
  updating: boolean;
  onSelectDraft: (account: ListingAutoAccount) => void;
  onSubmit: () => void;
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
}: AdminListingAutoAccountPanelProps) {
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
  const canApplyTargetHolding = targetHoldingFit !== null;

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

  return (
    <section className="admin-panel mt-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-black">상장주관사 자동계정</h2>
          <p className="mt-1 text-xs font-bold text-stock-subtle">기관처럼 방향별 목표 미체결 잔량을 유지하고, 위·아래 분산 방향과 주문 단위·TTL을 제어합니다.</p>
          <p className="mt-1 text-xs font-bold text-admin-placeholder">매수는 최우선 매수호가, 매도는 최우선 매도호가를 기준으로 분산합니다. 위쪽 매수와 아래쪽 매도는 상대 최우선 호가를 넘어 즉시 체결될 수 있으며, 동일 계좌끼리의 실제 자기체결만 체결 엔진이 차단합니다.</p>
          <p className="mt-1 text-xs font-bold text-admin-placeholder">양방향 운용은 목표±보유 밴드 안에서 매수·매도 호가를 함께 유지하고, 밴드 밖에서는 재고를 목표 쪽으로 줄이는 방향만 유지합니다.</p>
          <p className="mt-1 text-xs font-bold text-admin-placeholder">각 호가 잔량은 한쪽 주문이 전부 체결돼도 보유 상·하한을 넘지 않도록 독립적으로 제한됩니다.</p>
          <p className="mt-1 text-xs font-bold text-admin-placeholder">최대 수량은 주문 1건의 상한이며, 부족한 목표 잔량은 방향별 최대 {MAX_LISTING_AUTO_NEW_ORDERS_PER_SIDE_PER_RUN}개 주문으로 한 번에 보충합니다.</p>
          <p className="mt-1 text-xs font-bold text-admin-placeholder">TTL은 현실 시간이 아니라 시뮬레이션 초 기준이며, 만료된 호가는 다음 공급 실행에서 목표 잔량만큼 다시 채웁니다.</p>
        </div>
        <span className="text-xs font-bold text-admin-accent">{accounts.length}개 계정</span>
      </div>
      <div className="mt-4 grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <DarkSelect label="종목" value={draft.symbol} onChange={(value) => {
          const account = accounts.find((item) => item.symbol === value);
          if (account) {
            onSelectDraft(account);
            return;
          }
          draftSetters.setSymbol(value);
        }}>
          <option value="">선택</option>
          {accounts.map((account) => (
            <option key={account.symbol} value={account.symbol}>{account.symbol}</option>
          ))}
        </DarkSelect>
        <DarkInput label="표시명" value={draft.displayName} onChange={draftSetters.setDisplayName} placeholder="상장주관사" />
        <DarkSelect label="상태" value={draft.enabled ? "true" : "false"} onChange={(value) => draftSetters.setEnabled(value === "true")}>
          <option value="true">가동</option>
          <option value="false">정지</option>
        </DarkSelect>
        <DarkSelect label="포지션" value={draft.positionSide} onChange={(value) => draftSetters.setPositionSide(value as ListingAutoPosition)}>
          <option value="SELL_ONLY">매도 전용</option>
          <option value="BUY_ONLY">매수 전용</option>
          <option value="TWO_SIDED">양방향 기관 운용</option>
        </DarkSelect>
        <AdminTargetHoldingPercentageControl
          issuedShares={draftAccount?.issuedShares ?? 0}
          targetHoldingQuantity={draft.targetHoldingQuantity}
          onTargetHoldingQuantityChange={draftSetters.setTargetHoldingQuantity}
          actionLabel="목표 보유 수량 맞춤"
          onAction={applyTargetHoldingConfig}
          actionDisabled={!canApplyTargetHolding}
        />
        <TargetHoldingFitPreview fit={targetHoldingFit} />
        <DarkInput label="보유 허용 밴드(±주)" value={draft.inventoryBandQuantity} onChange={draftSetters.setInventoryBandQuantity} placeholder="30000" />
        <DarkInput label="목표 매수 호가 잔량" value={draft.targetBuyQuantity} onChange={draftSetters.setTargetBuyQuantity} placeholder="100" />
        <DarkInput label="목표 매도 호가 잔량" value={draft.targetSellQuantity} onChange={draftSetters.setTargetSellQuantity} placeholder="100" />
        <DarkInput label="최대 수량" value={draft.maxOrderQuantity} onChange={draftSetters.setMaxOrderQuantity} placeholder="100" />
        <DarkInput label="TTL(시뮬 초)" value={draft.orderTtlSeconds} onChange={draftSetters.setOrderTtlSeconds} placeholder="30" />
        <DarkInput label="분산 틱" value={draft.priceOffsetTicks} onChange={draftSetters.setPriceOffsetTicks} placeholder="3" />
        <DarkSelect label="매수 분산 방향" value={draft.buyPriceOffsetDirection} onChange={(value) => draftSetters.setBuyPriceOffsetDirection(value as ListingAutoPriceDirection)}>
          <option value="DOWN">아래</option>
          <option value="UP">위</option>
          <option value="RANDOM">위·아래 무작위</option>
        </DarkSelect>
        <DarkSelect label="매도 분산 방향" value={draft.sellPriceOffsetDirection} onChange={(value) => draftSetters.setSellPriceOffsetDirection(value as ListingAutoPriceDirection)}>
          <option value="UP">위</option>
          <option value="DOWN">아래</option>
          <option value="RANDOM">위·아래 무작위</option>
        </DarkSelect>
        <button type="button" onClick={onSubmit} disabled={updating} className="min-h-11 min-w-0 self-end rounded-md bg-white px-3 py-3 text-sm font-black text-admin-canvas disabled:opacity-50 sm:col-span-2 lg:col-span-1 lg:col-start-4">
          {updating ? "저장 중" : "저장"}
        </button>
      </div>
      {selectedAccount ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <DarkMetric label="전체 발행량" value={`${formatNumber(selectedAccount.issuedShares)}주`} />
          <DarkMetric label="주관사 보유 주식" value={`${formatNumber(selectedAccount.holdingQuantity)}주`} />
          <DarkMetric label="예약 매도 수량" value={`${formatNumber(selectedAccount.reservedQuantity)}주`} />
          <DarkMetric label="가용 매도 수량" value={`${formatNumber(selectedAccount.availableQuantity)}주`} />
          <DarkMetric label="주관사 현금" value={formatWon(selectedAccount.cashBalance)} />
          <DarkMetric label="평균단가" value={formatWon(selectedAccount.averagePrice)} />
          <DarkMetric label="현재가" value={formatWon(selectedAccount.currentPrice)} />
          <DarkMetric label="보유 평가액" value={formatWon(selectedAccount.marketValue)} />
        </div>
      ) : (
        <div className="mt-4 rounded-md border border-white/10 bg-black/20 px-3 py-3 text-xs font-bold text-stock-subtle">
          종목을 선택하면 상장주관사 자동계정의 실제 보유 주식, 예약 수량, 가용 수량, 현금, 평가액을 확인할 수 있습니다.
        </div>
      )}
      <DataTableViewport label="상장주관사 자동계정" tone="dark" className="mt-4">
        <table className="min-w-[1280px] w-full border-collapse text-sm">
          <thead className="bg-white/10 text-left text-admin-muted">
            <tr>
              <th className="px-3 py-2">종목</th>
              <th className="px-3 py-2">계정</th>
              <th className="px-3 py-2">상태</th>
              <th className="px-3 py-2">전체 발행량</th>
              <th className="px-3 py-2">보유/예약</th>
              <th className="px-3 py-2">가용</th>
              <th className="px-3 py-2">현금</th>
              <th className="px-3 py-2">평가액</th>
              <th className="px-3 py-2">운용 설정</th>
              <th className="px-3 py-2">수정</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {accounts.map((account) => {
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
              const targetHoldingPercent = account.issuedShares > 0
                ? (account.targetHoldingQuantity / account.issuedShares) * 100
                : 0;
              const buyRefillQuantity = Math.max(0, effectiveBuyTarget - account.openBuyQuantity);
              const sellRefillQuantity = Math.max(0, effectiveSellTarget - account.openSellQuantity);
              const buyOrderFragments = account.maxOrderQuantity > 0
                ? Math.ceil(buyRefillQuantity / account.maxOrderQuantity)
                : 0;
              const sellOrderFragments = account.maxOrderQuantity > 0
                ? Math.ceil(sellRefillQuantity / account.maxOrderQuantity)
                : 0;
              return (
                <Fragment key={account.symbol}>
                <tr>
                  <td className="px-3 py-2 font-black">{account.symbol}</td>
                  <td className="px-3 py-2">
                    <p className="font-black">{account.displayName}</p>
                    <p className="mt-0.5 text-xs font-bold text-stock-subtle">{account.userKey}</p>
                    <p className="mt-0.5 text-xs font-bold text-admin-placeholder">계좌 ID {account.accountId ?? "-"}</p>
                  </td>
                  <td className="px-3 py-2">{account.enabled ? "가동" : "정지"}</td>
                  <td className="px-3 py-2 tabular-nums">{formatNumber(account.issuedShares)}주</td>
                  <td className="px-3 py-2 tabular-nums">
                    <p className="font-black">{formatNumber(account.holdingQuantity)}주</p>
                    <p className="mt-0.5 text-xs font-bold text-stock-subtle">예약 {formatNumber(account.reservedQuantity)}주</p>
                  </td>
                  <td className="px-3 py-2 tabular-nums">{formatNumber(account.availableQuantity)}주</td>
                  <td className="px-3 py-2 tabular-nums">{formatWon(account.cashBalance)}</td>
                  <td className="px-3 py-2 tabular-nums">
                    <p className="font-black">{formatWon(account.marketValue)}</p>
                    <p className="mt-0.5 text-xs font-bold text-stock-subtle">현재가 {formatWon(account.currentPrice)}</p>
                  </td>
                  <td className="px-3 py-2">
                    <p className="font-black">{formatListingAutoPosition(account.positionSide)}</p>
                    <p className="mt-0.5 text-xs font-bold text-stock-subtle">
                      최대 {formatNumber(account.maxOrderQuantity)}주 · TTL {account.orderTtlSeconds}시뮬 초 · {account.priceOffsetTicks}틱
                    </p>
                    <p className="mt-0.5 text-xs font-bold text-stock-subtle">
                      매수 {formatNumber(account.openBuyQuantity)}/{formatNumber(account.targetBuyQuantity)}주 · {formatListingAutoPriceDirection(account.buyPriceOffsetDirection)}
                    </p>
                    <p className="mt-0.5 text-xs font-bold text-stock-subtle">
                      매도 {formatNumber(account.openSellQuantity)}/{formatNumber(account.targetSellQuantity)}주 · {formatListingAutoPriceDirection(account.sellPriceOffsetDirection)}
                    </p>
                    <p className="mt-0.5 text-xs font-bold text-stock-subtle">
                      목표 보유 {targetHoldingPercent.toFixed(2)}% · {formatNumber(account.targetHoldingQuantity)}주 ± {formatNumber(account.inventoryBandQuantity)}주
                    </p>
                    <p className="mt-0.5 text-xs font-bold text-stock-subtle">
                      허용 {formatNumber(lowerHoldingLimit)}~{formatNumber(upperHoldingLimit)}주 · 유효 호가 매수 {formatNumber(effectiveBuyTarget)} / 매도 {formatNumber(effectiveSellTarget)}주
                    </p>
                    <p className="mt-0.5 text-xs font-bold text-stock-subtle">
                      신규 보충 매수 {formatNumber(buyRefillQuantity)}주/{buyOrderFragments}개 · 매도 {formatNumber(sellRefillQuantity)}주/{sellOrderFragments}개 · 방향별 최대 {MAX_LISTING_AUTO_NEW_ORDERS_PER_SIDE_PER_RUN}개
                    </p>
                  </td>
                  <td className="px-3 py-2">
                    <button type="button" onClick={() => onSelectDraft(account)} className="rounded-md bg-white/10 px-2 py-1 text-xs font-black text-white">
                      수정
                    </button>
                  </td>
                </tr>
                {editingSymbol === account.symbol ? (
                  <tr>
                    <td colSpan={10} className="bg-black/20 px-3 py-3">
                      <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        <DarkInput label="표시명" value={draft.displayName} onChange={draftSetters.setDisplayName} placeholder="상장주관사" />
                        <DarkSelect label="상태" value={draft.enabled ? "true" : "false"} onChange={(value) => draftSetters.setEnabled(value === "true")}>
                          <option value="true">가동</option>
                          <option value="false">정지</option>
                        </DarkSelect>
                        <DarkSelect label="포지션" value={draft.positionSide} onChange={(value) => draftSetters.setPositionSide(value as ListingAutoPosition)}>
                          <option value="SELL_ONLY">매도 전용</option>
                          <option value="BUY_ONLY">매수 전용</option>
                          <option value="TWO_SIDED">양방향 기관 운용</option>
                        </DarkSelect>
                        <AdminTargetHoldingPercentageControl
                          issuedShares={account.issuedShares}
                          targetHoldingQuantity={draft.targetHoldingQuantity}
                          onTargetHoldingQuantityChange={draftSetters.setTargetHoldingQuantity}
                          actionLabel="목표 보유 수량 맞춤"
                          onAction={applyTargetHoldingConfig}
                          actionDisabled={!canApplyTargetHolding}
                        />
                        <TargetHoldingFitPreview fit={targetHoldingFit} />
                        <DarkInput label="보유 허용 밴드(±주)" value={draft.inventoryBandQuantity} onChange={draftSetters.setInventoryBandQuantity} placeholder="30000" />
                        <DarkInput label="목표 매수 호가 잔량" value={draft.targetBuyQuantity} onChange={draftSetters.setTargetBuyQuantity} placeholder="100" />
                        <DarkInput label="목표 매도 호가 잔량" value={draft.targetSellQuantity} onChange={draftSetters.setTargetSellQuantity} placeholder="100" />
                        <DarkInput label="최대 수량" value={draft.maxOrderQuantity} onChange={draftSetters.setMaxOrderQuantity} placeholder="100" />
                        <DarkInput label="TTL(시뮬 초)" value={draft.orderTtlSeconds} onChange={draftSetters.setOrderTtlSeconds} placeholder="30" />
                        <DarkInput label="분산 틱" value={draft.priceOffsetTicks} onChange={draftSetters.setPriceOffsetTicks} placeholder="3" />
                        <DarkSelect label="매수 분산 방향" value={draft.buyPriceOffsetDirection} onChange={(value) => draftSetters.setBuyPriceOffsetDirection(value as ListingAutoPriceDirection)}>
                          <option value="DOWN">아래</option>
                          <option value="UP">위</option>
                          <option value="RANDOM">위·아래 무작위</option>
                        </DarkSelect>
                        <DarkSelect label="매도 분산 방향" value={draft.sellPriceOffsetDirection} onChange={(value) => draftSetters.setSellPriceOffsetDirection(value as ListingAutoPriceDirection)}>
                          <option value="UP">위</option>
                          <option value="DOWN">아래</option>
                          <option value="RANDOM">위·아래 무작위</option>
                        </DarkSelect>
                        <div className="grid grid-cols-2 gap-2 self-end lg:col-start-4">
                          <button type="button" onClick={onSubmit} disabled={updating} className="min-h-11 rounded-md bg-white px-3 py-3 text-sm font-black text-admin-canvas disabled:opacity-50">
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
              );
            })}
            {accounts.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-3 py-4 text-stock-subtle">상장주관사 자동계정이 없습니다. 상장 이벤트를 먼저 적용하세요.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </DataTableViewport>
    </section>
  );
}

function TargetHoldingFitPreview({ fit }: { fit: ListingAutoTargetFit | null }) {
  if (!fit) {
    return (
      <div className="rounded-md border border-white/10 bg-black/20 px-3 py-3 text-xs font-bold leading-5 text-stock-subtle sm:col-span-2 lg:col-span-4">
        목표가 0% 또는 100%이면 대칭 양방향 밴드를 만들 수 없습니다. 해당 경우에는 매도 전용 또는 매수 전용으로 직접 설정하세요.
      </div>
    );
  }

  const netDirection = fit.netTargetQuantity > 0
    ? `순매수 ${formatNumber(fit.netTargetQuantity)}주`
    : fit.netTargetQuantity < 0
      ? `순매도 ${formatNumber(Math.abs(fit.netTargetQuantity))}주`
      : "매수·매도 균형";

  return (
    <div className="overflow-hidden rounded-md border border-admin-accent/25 bg-[linear-gradient(135deg,rgba(49,130,246,0.12),rgba(0,0,0,0.18))] sm:col-span-2 lg:col-span-4">
      <div className="grid gap-px bg-white/10 sm:grid-cols-2 lg:grid-cols-4">
        <FitMetric label="권장 보유 밴드" value={`±${formatNumber(fit.inventoryBandQuantity)}주`} />
        <FitMetric label="양쪽 목표 잔량" value={`${formatNumber(fit.targetBuyQuantity)}주`} />
        <FitMetric label="주문 1건 상한" value={`${formatNumber(fit.maxOrderQuantity)}주`} />
        <FitMetric label="현재 재고 보정" value={netDirection} />
      </div>
      <div className="px-3 py-2.5 text-[11px] font-bold leading-5 text-stock-subtle">
        <p>
          적용 후 허용 범위 {formatNumber(fit.lowerHoldingLimit)}~{formatNumber(fit.upperHoldingLimit)}주 · 현재 유효 목표 매수 {formatNumber(fit.effectiveBuyTarget)}주 / 매도 {formatNumber(fit.effectiveSellTarget)}주
        </p>
        <p>
          현재 미체결 잔량을 제외한 신규 보충량 매수 {formatNumber(fit.buyRefillQuantity)}주({fit.buyOrderFragments}개) / 매도 {formatNumber(fit.sellRefillQuantity)}주({fit.sellOrderFragments}개)
        </p>
        <p>
          대칭 가능 재고 범위의 30%를 밴드로 사용하고, 양쪽 잔량을 밴드와 같게 맞춥니다. 최대 수량은 한 번의 공급 실행에서 10개 이하로 채우도록 계산합니다. TTL·분산 틱·가격 방향은 변경하지 않습니다.
        </p>
      </div>
    </div>
  );
}

function FitMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-admin-surface/95 px-3 py-2.5">
      <p className="text-[10px] font-black uppercase tracking-[0.08em] text-admin-placeholder">{label}</p>
      <p className="mt-1 text-sm font-black tabular-nums text-white">{value}</p>
    </div>
  );
}
