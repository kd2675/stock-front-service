import { AUTO_PARTICIPANT_PROFILE_OPTIONS, formatAutoParticipantProfile, formatAutoParticipantProfileBehavior, formatAutoParticipantProfileDescription } from "@/app/lib/autoParticipantProfiles";
import { RECURRING_CASH_INTERVAL_UNIT_OPTIONS } from "@/app/supply-demand/admin/AdminConstants";
import { formatNumber, formatRecurringCashIntervalUnit, formatWon } from "@/app/supply-demand/admin/AdminFormatters";
import { DarkInput, DarkSelect } from "@/app/supply-demand/admin/AdminFormControls";
import { ProfileMetric } from "@/app/supply-demand/admin/AdminMetricCards";
import type { AutoParticipantProfileConfig, AutoParticipantProfileType, RecurringCashIntervalUnit } from "@/app/types/stock";

export type ProfileConfigDraft = {
  newsWeight: string;
  momentumWeight: string;
  contrarianWeight: string;
  lossAversionWeight: string;
  herdingWeight: string;
  marketMakingWeight: string;
  overconfidenceWeight: string;
  noiseWeight: string;
  panicSellWeight: string;
  dipBuyWeight: string;
  orderMultiplier: string;
  aggressionMultiplier: string;
  orderTtlMultiplier: string;
  quantityMultiplier: string;
  holdingPatienceWeight: string;
  deepLossHoldWeight: string;
  profitTakingWeight: string;
  recurringDepositAmount: string;
  recurringDepositIntervalValue: string;
  recurringDepositIntervalUnit: RecurringCashIntervalUnit;
};

export type ProfileConfigDraftSetters = {
  setNewsWeight: (value: string) => void;
  setMomentumWeight: (value: string) => void;
  setContrarianWeight: (value: string) => void;
  setLossAversionWeight: (value: string) => void;
  setHerdingWeight: (value: string) => void;
  setMarketMakingWeight: (value: string) => void;
  setOverconfidenceWeight: (value: string) => void;
  setNoiseWeight: (value: string) => void;
  setPanicSellWeight: (value: string) => void;
  setDipBuyWeight: (value: string) => void;
  setOrderMultiplier: (value: string) => void;
  setAggressionMultiplier: (value: string) => void;
  setOrderTtlMultiplier: (value: string) => void;
  setQuantityMultiplier: (value: string) => void;
  setHoldingPatienceWeight: (value: string) => void;
  setDeepLossHoldWeight: (value: string) => void;
  setProfitTakingWeight: (value: string) => void;
  setRecurringDepositAmount: (value: string) => void;
  setRecurringDepositIntervalValue: (value: string) => void;
  setRecurringDepositIntervalUnit: (value: RecurringCashIntervalUnit) => void;
};

export function AdminProfileConfigPanel({
  profileConfigs,
  editingProfileType,
  selectedProfileConfig,
  draft,
  draftSetters,
  saving,
  onSelectProfile,
  onSubmit,
  onClearSelection,
}: {
  profileConfigs: AutoParticipantProfileConfig[];
  editingProfileType: AutoParticipantProfileType | null;
  selectedProfileConfig: AutoParticipantProfileConfig | null;
  draft: ProfileConfigDraft;
  draftSetters: ProfileConfigDraftSetters;
  saving: boolean;
  onSelectProfile: (profileType: string) => void;
  onSubmit: () => void;
  onClearSelection: () => void;
}) {
  const selectedProfileOption = selectedProfileConfig
    ? AUTO_PARTICIPANT_PROFILE_OPTIONS.find((option) => option.value === selectedProfileConfig.profileType) ?? null
    : null;
  const isDividendReinvestorProfileSelected = selectedProfileConfig?.profileType === "DIVIDEND_REINVESTOR";
  const selectedProfileHasRecurringDeposit = (selectedProfileConfig?.recurringDepositAmount ?? 0) > 0;

  return (
    <section className="mt-5 rounded-lg border border-white/10 bg-white/[0.06] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-black">프로필 행동 설정</h2>
          <p className="mt-1 text-xs font-bold text-[#8b95a1]">자동 참여자 심리 프로필별 주문 빈도, 호가 공격성, 주문 유지 시간, 수량, 보유 성향, 주기적 현금 유입을 조정합니다.</p>
        </div>
      </div>
      <div className="mt-4 grid min-w-0 gap-4 lg:grid-cols-[minmax(240px,320px)_minmax(0,1fr)]">
        <div className="rounded-md border border-white/10 bg-black/15 p-3">
          <DarkSelect label="프로필 선택" value={editingProfileType ?? ""} onChange={onSelectProfile}>
            <option value="">프로필을 선택하세요</option>
            {profileConfigs.map((config) => (
              <option key={config.profileType} value={config.profileType}>
                {formatAutoParticipantProfile(config.profileType)}
              </option>
            ))}
          </DarkSelect>
          <div className="mt-3 grid gap-2 text-xs font-bold text-[#8b95a1]">
            <div className="flex items-center justify-between gap-3 rounded-md bg-white/[0.04] px-3 py-2">
              <span>전체 프로필</span>
              <span className="font-black text-white">{profileConfigs.length}개</span>
            </div>
            <div className="flex items-center justify-between gap-3 rounded-md bg-white/[0.04] px-3 py-2">
              <span>선택 상태</span>
              <span className="font-black text-[#64a8ff]">{selectedProfileConfig ? (selectedProfileConfig.customized ? "커스텀" : "기본값") : "미선택"}</span>
            </div>
          </div>
        </div>
        {selectedProfileConfig ? (
          <div className="min-w-0 rounded-md border border-white/10 bg-black/20 p-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-base font-black">{selectedProfileOption?.label ?? formatAutoParticipantProfile(selectedProfileConfig.profileType)}</p>
                <p className="mt-0.5 text-xs font-bold text-[#8b95a1]">{selectedProfileOption?.description ?? formatAutoParticipantProfileDescription(selectedProfileConfig.profileType)}</p>
                <p className="mt-1 max-w-3xl text-xs font-bold leading-5 text-[#b8c2cc]">{selectedProfileOption?.behavior ?? formatAutoParticipantProfileBehavior(selectedProfileConfig.profileType)}</p>
              </div>
              <span className={["rounded-md px-2 py-1 text-xs font-black", selectedProfileConfig.customized ? "bg-[#19324a] text-[#64a8ff]" : "bg-white/10 text-[#b8c2cc]"].join(" ")}>
                {selectedProfileConfig.customized ? "커스텀" : "기본값"}
              </span>
            </div>
            <div className="mt-4 grid gap-2 text-xs font-bold text-[#b8c2cc] sm:grid-cols-2 lg:grid-cols-5">
              <ProfileMetric label="뉴스" value={formatNumber(selectedProfileConfig.newsWeight)} />
              <ProfileMetric label="추세" value={formatNumber(selectedProfileConfig.momentumWeight)} />
              <ProfileMetric label="역추세" value={formatNumber(selectedProfileConfig.contrarianWeight)} />
              <ProfileMetric label="손실" value={formatNumber(selectedProfileConfig.lossAversionWeight)} />
              <ProfileMetric label="군중" value={formatNumber(selectedProfileConfig.herdingWeight)} />
              <ProfileMetric label="조성" value={formatNumber(selectedProfileConfig.marketMakingWeight)} />
              <ProfileMetric label="과신" value={formatNumber(selectedProfileConfig.overconfidenceWeight)} />
              <ProfileMetric label="노이즈" value={formatNumber(selectedProfileConfig.noiseWeight)} />
              <ProfileMetric label="패닉" value={formatNumber(selectedProfileConfig.panicSellWeight)} />
              <ProfileMetric label="저가매수" value={formatNumber(selectedProfileConfig.dipBuyWeight)} />
              <ProfileMetric label="주문 빈도" value={`${formatNumber(selectedProfileConfig.orderMultiplier)}배`} />
              <ProfileMetric label="호가 공격성" value={`${formatNumber(selectedProfileConfig.aggressionMultiplier)}배`} />
              <ProfileMetric label="TTL" value={`${formatNumber(selectedProfileConfig.orderTtlMultiplier)}배`} />
              <ProfileMetric label="수량" value={`${formatNumber(selectedProfileConfig.quantityMultiplier)}배`} />
              <ProfileMetric label="익절" value={formatNumber(selectedProfileConfig.profitTakingWeight)} />
              <ProfileMetric label="보유 인내" value={formatNumber(selectedProfileConfig.holdingPatienceWeight)} />
              <ProfileMetric label="손실 보유" value={formatNumber(selectedProfileConfig.deepLossHoldWeight)} />
              <ProfileMetric label="주기 입금" value={isDividendReinvestorProfileSelected ? "배당 이벤트만 사용" : formatWon(selectedProfileConfig.recurringDepositAmount)} />
              <ProfileMetric label="입금 주기" value={isDividendReinvestorProfileSelected || !selectedProfileHasRecurringDeposit ? "-" : `${formatNumber(selectedProfileConfig.recurringDepositIntervalValue)}${formatRecurringCashIntervalUnit(selectedProfileConfig.recurringDepositIntervalUnit)}`} />
              <ProfileMetric label="수정일" value={selectedProfileConfig.updatedAt ? selectedProfileConfig.updatedAt.slice(0, 10) : "-"} />
            </div>
            <div className="mt-4 grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <DarkInput label="뉴스 민감(0-1)" value={draft.newsWeight} onChange={draftSetters.setNewsWeight} placeholder="0.6" />
              <DarkInput label="추세 추종(0-1)" value={draft.momentumWeight} onChange={draftSetters.setMomentumWeight} placeholder="0.6" />
              <DarkInput label="역추세(0-1)" value={draft.contrarianWeight} onChange={draftSetters.setContrarianWeight} placeholder="0.6" />
              <DarkInput label="손실 회피(0-1)" value={draft.lossAversionWeight} onChange={draftSetters.setLossAversionWeight} placeholder="0.7" />
              <DarkInput label="군중 추종(0-1)" value={draft.herdingWeight} onChange={draftSetters.setHerdingWeight} placeholder="0.6" />
              <DarkInput label="시장 조성(0-1)" value={draft.marketMakingWeight} onChange={draftSetters.setMarketMakingWeight} placeholder="0.9" />
              <DarkInput label="과신(0-1)" value={draft.overconfidenceWeight} onChange={draftSetters.setOverconfidenceWeight} placeholder="0.6" />
              <DarkInput label="노이즈(0-1)" value={draft.noiseWeight} onChange={draftSetters.setNoiseWeight} placeholder="0.8" />
              <DarkInput label="패닉 매도(0-1)" value={draft.panicSellWeight} onChange={draftSetters.setPanicSellWeight} placeholder="0.5" />
              <DarkInput label="저가 매수(0-1)" value={draft.dipBuyWeight} onChange={draftSetters.setDipBuyWeight} placeholder="0.5" />
              <DarkInput label="주문 빈도(0-5)" value={draft.orderMultiplier} onChange={draftSetters.setOrderMultiplier} placeholder="1" />
              <DarkInput label="호가 공격성(0-5)" value={draft.aggressionMultiplier} onChange={draftSetters.setAggressionMultiplier} placeholder="1" />
              <DarkInput label="TTL 배율(0.1-10)" value={draft.orderTtlMultiplier} onChange={draftSetters.setOrderTtlMultiplier} placeholder="1" />
              <DarkInput label="수량 배율(0-5)" value={draft.quantityMultiplier} onChange={draftSetters.setQuantityMultiplier} placeholder="1" />
              <DarkInput label="보유 인내(0-1)" value={draft.holdingPatienceWeight} onChange={draftSetters.setHoldingPatienceWeight} placeholder="0.5" />
              <DarkInput label="손실 보유(0-1)" value={draft.deepLossHoldWeight} onChange={draftSetters.setDeepLossHoldWeight} placeholder="0.5" />
              <DarkInput label="익절 성향(0-1)" value={draft.profitTakingWeight} onChange={draftSetters.setProfitTakingWeight} placeholder="0.8" />
              <DarkInput label="주기 입금" value={isDividendReinvestorProfileSelected ? "0" : draft.recurringDepositAmount} onChange={draftSetters.setRecurringDepositAmount} placeholder="0" disabled={isDividendReinvestorProfileSelected} />
              <DarkInput label="입금 주기 값" value={isDividendReinvestorProfileSelected ? "0" : draft.recurringDepositIntervalValue} onChange={draftSetters.setRecurringDepositIntervalValue} placeholder="0" disabled={isDividendReinvestorProfileSelected} />
              <DarkSelect
                label="입금 주기 단위"
                value={isDividendReinvestorProfileSelected ? "DAY" : draft.recurringDepositIntervalUnit}
                onChange={(value) => draftSetters.setRecurringDepositIntervalUnit(value as RecurringCashIntervalUnit)}
                disabled={isDividendReinvestorProfileSelected}
              >
                {RECURRING_CASH_INTERVAL_UNIT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </DarkSelect>
              <div className="grid grid-cols-2 gap-2 self-end lg:col-span-2">
                <button type="button" onClick={onSubmit} disabled={saving} className="min-h-11 rounded-md bg-white px-3 py-3 text-sm font-black text-[#101418] disabled:opacity-50">
                  {saving ? "저장 중" : "저장"}
                </button>
                <button type="button" onClick={onClearSelection} className="min-h-11 rounded-md bg-white/10 px-3 py-3 text-sm font-black text-white">
                  선택 해제
                </button>
              </div>
            </div>
            <p className="mt-2 text-xs font-bold text-[#8b95a1]">
              {isDividendReinvestorProfileSelected
                ? "배당재투자형은 월급/정기 입금을 쓰지 않습니다. 배당 지급 이벤트로 현금이 들어온 뒤 재매수 성향만 강화됩니다."
                : "심리 행동 가중치는 0-1 사이이며 실제 매수/매도 판단 방향에 직접 들어갑니다. 주문 빈도, 호가 공격성, TTL, 수량은 행동 결과의 빈도와 크기를 조정하고, 주기 입금은 외부 현금 유입을 시뮬레이션합니다."}
            </p>
          </div>
        ) : (
          <div className="grid min-h-[220px] place-items-center rounded-md border border-dashed border-white/15 bg-black/15 px-4 py-8 text-center">
            <p className="text-sm font-bold text-[#8b95a1]">수정할 프로필을 하나 선택하세요.</p>
          </div>
        )}
      </div>
    </section>
  );
}
