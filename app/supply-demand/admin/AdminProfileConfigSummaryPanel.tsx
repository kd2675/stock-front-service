import type { ReactNode } from "react";

import { AUTO_PARTICIPANT_PROFILE_OPTIONS, formatAutoParticipantProfile, formatAutoParticipantProfileBehavior, formatAutoParticipantProfileDescription } from "@/app/lib/autoParticipantProfiles";
import { formatNumber, formatRecurringCashIntervalUnit, formatWon } from "@/app/supply-demand/admin/AdminFormatters";
import { ProfileMetric } from "@/app/supply-demand/admin/AdminMetricCards";
import {
  PROFILE_CONFIG_EXECUTION_FIELDS,
  PROFILE_CONFIG_SIGNAL_FIELDS,
} from "@/app/supply-demand/admin/AdminProfileConfigFieldMetadata";
import type { AutoParticipantProfileConfig } from "@/app/types/stock";

type AdminProfileConfigSummaryPanelProps = {
  config: AutoParticipantProfileConfig;
};

export function AdminProfileConfigSummaryPanel({ config }: AdminProfileConfigSummaryPanelProps) {
  const selectedProfileOption = AUTO_PARTICIPANT_PROFILE_OPTIONS.find((option) => option.value === config.profileType) ?? null;
  const isDividendReinvestorProfileSelected = config.profileType === "DIVIDEND_REINVESTOR";
  const selectedProfileHasRecurringDeposit = config.fundingPolicy.recurringDepositAmount > 0;

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-base font-black">{selectedProfileOption?.label ?? formatAutoParticipantProfile(config.profileType)}</p>
          <p className="mt-0.5 text-xs font-bold text-stock-subtle">{selectedProfileOption?.description ?? formatAutoParticipantProfileDescription(config.profileType)}</p>
          <p className="mt-1 max-w-3xl text-xs font-bold leading-5 text-admin-muted">{selectedProfileOption?.behavior ?? formatAutoParticipantProfileBehavior(config.profileType)}</p>
        </div>
        <span className={["rounded-md px-2 py-1 text-xs font-black", config.customized ? "bg-admin-accent-surface text-admin-accent" : "bg-white/10 text-admin-muted"].join(" ")}>
          {config.customized ? "커스텀" : "기본값"}
        </span>
      </div>
      <ProfileSummaryGroup title="행동 모델">
        <ProfileMetric
          label="프로필 일괄 적용"
          value={config.behaviorModelVersion === "V2" ? "V2 · 상태 기반" : "V1 · 기존 모델"}
        />
      </ProfileSummaryGroup>
      <ProfileSummaryGroup title="행동 신호">
        {PROFILE_CONFIG_SIGNAL_FIELDS.map((field) => (
          <ProfileMetric key={field.key} label={field.summaryLabel} value={formatNumber(config[field.key])} />
        ))}
      </ProfileSummaryGroup>
      <ProfileSummaryGroup title="주문 실행">
        <ProfileMetric label="가격 모드" value={formatPricingMode(config.pricingMode)} />
        <ProfileMetric label="청산 모드" value={formatExitMode(config.exitMode)} />
        <ProfileMetric label="재고 모드" value={formatInventoryMode(config.inventoryMode)} />
        {PROFILE_CONFIG_EXECUTION_FIELDS.map((field) => (
          <ProfileMetric key={field.key} label={field.summaryLabel} value={`${formatNumber(config[field.key])}${field.suffix ?? ""}`} />
        ))}
      </ProfileSummaryGroup>
      <ProfileSummaryGroup title="자금 공급과 이력">
        <ProfileMetric label="주기 입금" value={isDividendReinvestorProfileSelected ? "배당 전용 예산" : formatWon(config.fundingPolicy.recurringDepositAmount)} />
        <ProfileMetric label="입금 주기" value={isDividendReinvestorProfileSelected || !selectedProfileHasRecurringDeposit ? "-" : `${formatNumber(config.fundingPolicy.recurringDepositIntervalValue)}${formatRecurringCashIntervalUnit(config.fundingPolicy.recurringDepositIntervalUnit)}`} />
        <ProfileMetric label="수정일" value={config.updatedAt ? config.updatedAt.slice(0, 10) : "-"} />
      </ProfileSummaryGroup>
    </>
  );
}

function ProfileSummaryGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-4">
      <h3 className="mb-2 text-xs font-black text-admin-muted">{title}</h3>
      <div className="grid gap-2 text-xs font-bold text-admin-muted sm:grid-cols-2 lg:grid-cols-5">{children}</div>
    </section>
  );
}

function formatPricingMode(value: AutoParticipantProfileConfig["pricingMode"]) {
  return value === "MARKET_MAKING" ? "양방향 시장조성" : "방향 신호";
}

function formatExitMode(value: AutoParticipantProfileConfig["exitMode"]) {
  if (value === "TAKE_PROFIT_FIRST") return "익절 우선";
  if (value === "HOLD_LOSSES") return "손실 보유 우선";
  return "신호 기반";
}

function formatInventoryMode(value: AutoParticipantProfileConfig["inventoryMode"]) {
  return value === "TARGET_ALLOCATION" ? "목표 재고" : "신호 기반";
}
