import { Fragment } from "react";

import { formatListingAutoPosition, formatListingAutoPriceDirection, formatNumber, formatWon } from "@/app/supply-demand/admin/AdminFormatters";
import { DarkInput, DarkSelect } from "@/app/supply-demand/admin/AdminFormControls";
import { DarkMetric } from "@/app/supply-demand/admin/AdminMetricCards";
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
  const maximumSymmetricBand = draftAccount && targetHoldingQuantityValid
    ? Math.min(parsedTargetHoldingQuantity, draftAccount.issuedShares - parsedTargetHoldingQuantity)
    : 0;
  const canApplyTargetHolding = draftAccount !== null && targetHoldingQuantityValid && maximumSymmetricBand > 0;

  const applyTargetHoldingConfig = () => {
    if (!canApplyTargetHolding) {
      return;
    }
    const positiveDraftQuantities = [draft.targetBuyQuantity, draft.targetSellQuantity, draft.maxOrderQuantity]
      .map(Number)
      .filter((quantity) => Number.isSafeInteger(quantity) && quantity > 0);
    const requestedQuoteQuantity = Math.max(...positiveDraftQuantities, 1);
    const nextBandQuantity = Math.min(requestedQuoteQuantity, maximumSymmetricBand);
    const parsedMaxOrderQuantity = Number(draft.maxOrderQuantity);
    const nextMaxOrderQuantity = Number.isSafeInteger(parsedMaxOrderQuantity) && parsedMaxOrderQuantity > 0
      ? Math.min(parsedMaxOrderQuantity, nextBandQuantity)
      : nextBandQuantity;
    draftSetters.setEnabled(true);
    draftSetters.setPositionSide("TWO_SIDED");
    draftSetters.setInventoryBandQuantity(String(nextBandQuantity));
    draftSetters.setTargetBuyQuantity(String(nextBandQuantity));
    draftSetters.setTargetSellQuantity(String(nextBandQuantity));
    draftSetters.setMaxOrderQuantity(String(nextMaxOrderQuantity));
  };

  return (
    <section className="mt-5 rounded-lg border border-white/10 bg-white/[0.06] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-black">상장주관사 자동계정</h2>
          <p className="mt-1 text-xs font-bold text-[#8b95a1]">기관처럼 방향별 목표 미체결 잔량을 유지하고, 위·아래 분산 방향과 주문 단위·TTL을 제어합니다.</p>
          <p className="mt-1 text-xs font-bold text-[#5f6b76]">매수는 최우선 매수호가, 매도는 최우선 매도호가를 기준으로 분산하며 자기 계정의 반대 호가와는 교차하지 않습니다.</p>
          <p className="mt-1 text-xs font-bold text-[#5f6b76]">양방향 운용은 목표±보유 밴드 안에서 매수·매도 호가를 함께 유지하고, 밴드 밖에서는 재고를 목표 쪽으로 줄이는 방향만 유지합니다.</p>
          <p className="mt-1 text-xs font-bold text-[#5f6b76]">각 호가 잔량은 한쪽 주문이 전부 체결돼도 보유 상·하한을 넘지 않도록 독립적으로 제한됩니다.</p>
        </div>
        <span className="text-xs font-bold text-[#64a8ff]">{accounts.length}개 계정</span>
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
        <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] gap-2">
          <DarkInput label="목표 보유 수량" value={draft.targetHoldingQuantity} onChange={draftSetters.setTargetHoldingQuantity} placeholder="2000000" />
          <button type="button" onClick={applyTargetHoldingConfig} disabled={!canApplyTargetHolding} className="min-h-11 self-end rounded-md bg-[#2f6feb] px-3 py-2 text-xs font-black text-white disabled:cursor-not-allowed disabled:opacity-40">
            목표 보유 수량 맞춤
          </button>
        </div>
        <DarkInput label="보유 허용 밴드(±주)" value={draft.inventoryBandQuantity} onChange={draftSetters.setInventoryBandQuantity} placeholder="30000" />
        <DarkInput label="목표 매수 호가 잔량" value={draft.targetBuyQuantity} onChange={draftSetters.setTargetBuyQuantity} placeholder="100" />
        <DarkInput label="목표 매도 호가 잔량" value={draft.targetSellQuantity} onChange={draftSetters.setTargetSellQuantity} placeholder="100" />
        <DarkInput label="최대 수량" value={draft.maxOrderQuantity} onChange={draftSetters.setMaxOrderQuantity} placeholder="100" />
        <DarkInput label="TTL(초)" value={draft.orderTtlSeconds} onChange={draftSetters.setOrderTtlSeconds} placeholder="30" />
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
        <button type="button" onClick={onSubmit} disabled={updating} className="min-h-11 min-w-0 self-end rounded-md bg-white px-3 py-3 text-sm font-black text-[#101418] disabled:opacity-50 sm:col-span-2 lg:col-span-1">
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
        <div className="mt-4 rounded-md border border-white/10 bg-black/20 px-3 py-3 text-xs font-bold text-[#8b95a1]">
          종목을 선택하면 상장주관사 자동계정의 실제 보유 주식, 예약 수량, 가용 수량, 현금, 평가액을 확인할 수 있습니다.
        </div>
      )}
      <div className="mt-4 overflow-x-auto rounded-md border border-white/10">
        <table className="min-w-[1280px] w-full border-collapse text-sm">
          <thead className="bg-white/10 text-left text-[#b8c2cc]">
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
                : account.targetBuyQuantity;
              const effectiveSellTarget = account.positionSide === "TWO_SIDED"
                ? Math.min(account.targetSellQuantity, Math.max(0, account.holdingQuantity - lowerHoldingLimit))
                : account.targetSellQuantity;
              return (
                <Fragment key={account.symbol}>
                <tr>
                  <td className="px-3 py-2 font-black">{account.symbol}</td>
                  <td className="px-3 py-2">
                    <p className="font-black">{account.displayName}</p>
                    <p className="mt-0.5 text-xs font-bold text-[#8b95a1]">{account.userKey}</p>
                    <p className="mt-0.5 text-xs font-bold text-[#5f6b76]">계좌 ID {account.accountId ?? "-"}</p>
                  </td>
                  <td className="px-3 py-2">{account.enabled ? "가동" : "정지"}</td>
                  <td className="px-3 py-2 tabular-nums">{formatNumber(account.issuedShares)}주</td>
                  <td className="px-3 py-2 tabular-nums">
                    <p className="font-black">{formatNumber(account.holdingQuantity)}주</p>
                    <p className="mt-0.5 text-xs font-bold text-[#8b95a1]">예약 {formatNumber(account.reservedQuantity)}주</p>
                  </td>
                  <td className="px-3 py-2 tabular-nums">{formatNumber(account.availableQuantity)}주</td>
                  <td className="px-3 py-2 tabular-nums">{formatWon(account.cashBalance)}</td>
                  <td className="px-3 py-2 tabular-nums">
                    <p className="font-black">{formatWon(account.marketValue)}</p>
                    <p className="mt-0.5 text-xs font-bold text-[#8b95a1]">현재가 {formatWon(account.currentPrice)}</p>
                  </td>
                  <td className="px-3 py-2">
                    <p className="font-black">{formatListingAutoPosition(account.positionSide)}</p>
                    <p className="mt-0.5 text-xs font-bold text-[#8b95a1]">
                      최대 {formatNumber(account.maxOrderQuantity)}주 · {account.orderTtlSeconds}초 · {account.priceOffsetTicks}틱
                    </p>
                    <p className="mt-0.5 text-xs font-bold text-[#8b95a1]">
                      매수 {formatNumber(account.openBuyQuantity)}/{formatNumber(account.targetBuyQuantity)}주 · {formatListingAutoPriceDirection(account.buyPriceOffsetDirection)}
                    </p>
                    <p className="mt-0.5 text-xs font-bold text-[#8b95a1]">
                      매도 {formatNumber(account.openSellQuantity)}/{formatNumber(account.targetSellQuantity)}주 · {formatListingAutoPriceDirection(account.sellPriceOffsetDirection)}
                    </p>
                    <p className="mt-0.5 text-xs font-bold text-[#8b95a1]">
                      목표 보유 {formatNumber(account.targetHoldingQuantity)}주 ± {formatNumber(account.inventoryBandQuantity)}주
                    </p>
                    <p className="mt-0.5 text-xs font-bold text-[#8b95a1]">
                      허용 {formatNumber(lowerHoldingLimit)}~{formatNumber(upperHoldingLimit)}주 · 유효 호가 매수 {formatNumber(effectiveBuyTarget)} / 매도 {formatNumber(effectiveSellTarget)}주
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
                        <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] gap-2">
                          <DarkInput label="목표 보유 수량" value={draft.targetHoldingQuantity} onChange={draftSetters.setTargetHoldingQuantity} placeholder="2000000" />
                          <button type="button" onClick={applyTargetHoldingConfig} disabled={!canApplyTargetHolding} className="min-h-11 self-end rounded-md bg-[#2f6feb] px-3 py-2 text-xs font-black text-white disabled:cursor-not-allowed disabled:opacity-40">
                            목표 보유 수량 맞춤
                          </button>
                        </div>
                        <DarkInput label="보유 허용 밴드(±주)" value={draft.inventoryBandQuantity} onChange={draftSetters.setInventoryBandQuantity} placeholder="30000" />
                        <DarkInput label="목표 매수 호가 잔량" value={draft.targetBuyQuantity} onChange={draftSetters.setTargetBuyQuantity} placeholder="100" />
                        <DarkInput label="목표 매도 호가 잔량" value={draft.targetSellQuantity} onChange={draftSetters.setTargetSellQuantity} placeholder="100" />
                        <DarkInput label="최대 수량" value={draft.maxOrderQuantity} onChange={draftSetters.setMaxOrderQuantity} placeholder="100" />
                        <DarkInput label="TTL(초)" value={draft.orderTtlSeconds} onChange={draftSetters.setOrderTtlSeconds} placeholder="30" />
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
              );
            })}
            {accounts.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-3 py-4 text-[#8b95a1]">상장주관사 자동계정이 없습니다. 상장 이벤트를 먼저 적용하세요.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}
