import { Fragment, type Dispatch, type SetStateAction } from "react";

import { formatListingAutoPosition, formatNumber, formatWon } from "@/app/supply-demand/admin/AdminFormatters";
import { DarkInput, DarkSelect } from "@/app/supply-demand/admin/AdminFormControls";
import { DarkMetric } from "@/app/supply-demand/admin/AdminMetricCards";
import type { ListingAutoAccount, ListingAutoPosition } from "@/app/types/stock";

export type ListingAutoAccountDraft = {
  symbol: string;
  displayName: string;
  enabled: boolean;
  positionSide: ListingAutoPosition;
  maxOrderQuantity: string;
  orderTtlSeconds: string;
  priceOffsetTicks: string;
};

export type ListingAutoAccountDraftSetters = {
  setSymbol: Dispatch<SetStateAction<string>>;
  setDisplayName: Dispatch<SetStateAction<string>>;
  setEnabled: Dispatch<SetStateAction<boolean>>;
  setPositionSide: Dispatch<SetStateAction<ListingAutoPosition>>;
  setMaxOrderQuantity: Dispatch<SetStateAction<string>>;
  setOrderTtlSeconds: Dispatch<SetStateAction<string>>;
  setPriceOffsetTicks: Dispatch<SetStateAction<string>>;
  setEditingSymbol: Dispatch<SetStateAction<string | null>>;
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
  return (
    <section className="mt-5 rounded-lg border border-white/10 bg-white/[0.06] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-black">상장주관사 자동계정</h2>
          <p className="mt-1 text-xs font-bold text-[#8b95a1]">상장 때 받은 물량을 소량 매도하거나, 매수 전용으로 바꿔 자사주 매입 흐름처럼 운용합니다.</p>
        </div>
        <span className="text-xs font-bold text-[#64a8ff]">{accounts.length}개 계정</span>
      </div>
      <div className="mt-4 grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1.4fr_0.8fr_0.9fr_0.8fr_0.8fr_0.8fr_auto]">
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
        </DarkSelect>
        <DarkInput label="최대 수량" value={draft.maxOrderQuantity} onChange={draftSetters.setMaxOrderQuantity} placeholder="100" />
        <DarkInput label="TTL(초)" value={draft.orderTtlSeconds} onChange={draftSetters.setOrderTtlSeconds} placeholder="30" />
        <DarkInput label="분산 틱" value={draft.priceOffsetTicks} onChange={draftSetters.setPriceOffsetTicks} placeholder="3" />
        <button type="button" onClick={onSubmit} disabled={updating} className="min-h-11 min-w-0 self-end rounded-md bg-white px-3 py-3 text-sm font-black text-[#101418] disabled:opacity-50 sm:col-span-2 lg:col-span-1">
          {updating ? "저장 중" : "저장"}
        </button>
      </div>
      {selectedAccount ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
        <table className="min-w-[1180px] w-full border-collapse text-sm">
          <thead className="bg-white/10 text-left text-[#b8c2cc]">
            <tr>
              <th className="px-3 py-2">종목</th>
              <th className="px-3 py-2">계정</th>
              <th className="px-3 py-2">상태</th>
              <th className="px-3 py-2">보유/예약</th>
              <th className="px-3 py-2">가용</th>
              <th className="px-3 py-2">현금</th>
              <th className="px-3 py-2">평가액</th>
              <th className="px-3 py-2">운용 설정</th>
              <th className="px-3 py-2">수정</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {accounts.map((account) => (
              <Fragment key={account.symbol}>
                <tr>
                  <td className="px-3 py-2 font-black">{account.symbol}</td>
                  <td className="px-3 py-2">
                    <p className="font-black">{account.displayName}</p>
                    <p className="mt-0.5 text-xs font-bold text-[#8b95a1]">{account.userKey}</p>
                    <p className="mt-0.5 text-xs font-bold text-[#5f6b76]">계좌 ID {account.accountId ?? "-"}</p>
                  </td>
                  <td className="px-3 py-2">{account.enabled ? "가동" : "정지"}</td>
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
                  </td>
                  <td className="px-3 py-2">
                    <button type="button" onClick={() => onSelectDraft(account)} className="rounded-md bg-white/10 px-2 py-1 text-xs font-black text-white">
                      수정
                    </button>
                  </td>
                </tr>
                {editingSymbol === account.symbol ? (
                  <tr>
                    <td colSpan={9} className="bg-black/20 px-3 py-3">
                      <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[1.4fr_0.8fr_0.9fr_0.8fr_0.8fr_0.8fr_auto]">
                        <DarkInput label="표시명" value={draft.displayName} onChange={draftSetters.setDisplayName} placeholder="상장주관사" />
                        <DarkSelect label="상태" value={draft.enabled ? "true" : "false"} onChange={(value) => draftSetters.setEnabled(value === "true")}>
                          <option value="true">가동</option>
                          <option value="false">정지</option>
                        </DarkSelect>
                        <DarkSelect label="포지션" value={draft.positionSide} onChange={(value) => draftSetters.setPositionSide(value as ListingAutoPosition)}>
                          <option value="SELL_ONLY">매도 전용</option>
                          <option value="BUY_ONLY">매수 전용</option>
                        </DarkSelect>
                        <DarkInput label="최대 수량" value={draft.maxOrderQuantity} onChange={draftSetters.setMaxOrderQuantity} placeholder="100" />
                        <DarkInput label="TTL(초)" value={draft.orderTtlSeconds} onChange={draftSetters.setOrderTtlSeconds} placeholder="30" />
                        <DarkInput label="분산 틱" value={draft.priceOffsetTicks} onChange={draftSetters.setPriceOffsetTicks} placeholder="3" />
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
            {accounts.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-3 py-4 text-[#8b95a1]">상장주관사 자동계정이 없습니다. 상장 이벤트를 먼저 적용하세요.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}
