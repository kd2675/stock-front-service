import { AUTO_PARTICIPANT_PROFILE_OPTIONS, formatAutoParticipantProfile, formatAutoParticipantProfileBehavior, formatAutoParticipantProfileDescription } from "@/app/lib/autoParticipantProfiles";
import { formatNumber, formatRecurringCashIntervalUnit, formatWon } from "@/app/supply-demand/admin/AdminFormatters";
import { ProfileMetric } from "@/app/supply-demand/admin/AdminMetricCards";
import { PROFILE_CONFIG_BEHAVIOR_FIELDS } from "@/app/supply-demand/admin/AdminProfileConfigFieldMetadata";
import type { AutoParticipantProfileConfig } from "@/app/types/stock";

type AdminProfileConfigSummaryPanelProps = {
  config: AutoParticipantProfileConfig;
};

export function AdminProfileConfigSummaryPanel({ config }: AdminProfileConfigSummaryPanelProps) {
  const selectedProfileOption = AUTO_PARTICIPANT_PROFILE_OPTIONS.find((option) => option.value === config.profileType) ?? null;
  const isDividendReinvestorProfileSelected = config.profileType === "DIVIDEND_REINVESTOR";
  const selectedProfileHasRecurringDeposit = config.recurringDepositAmount > 0;

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-base font-black">{selectedProfileOption?.label ?? formatAutoParticipantProfile(config.profileType)}</p>
          <p className="mt-0.5 text-xs font-bold text-[#8b95a1]">{selectedProfileOption?.description ?? formatAutoParticipantProfileDescription(config.profileType)}</p>
          <p className="mt-1 max-w-3xl text-xs font-bold leading-5 text-[#b8c2cc]">{selectedProfileOption?.behavior ?? formatAutoParticipantProfileBehavior(config.profileType)}</p>
        </div>
        <span className={["rounded-md px-2 py-1 text-xs font-black", config.customized ? "bg-[#19324a] text-[#64a8ff]" : "bg-white/10 text-[#b8c2cc]"].join(" ")}>
          {config.customized ? "커스텀" : "기본값"}
        </span>
      </div>
      <div className="mt-4 grid gap-2 text-xs font-bold text-[#b8c2cc] sm:grid-cols-2 lg:grid-cols-5">
        {PROFILE_CONFIG_BEHAVIOR_FIELDS.map((field) => (
          <ProfileMetric
            key={field.key}
            label={field.summaryLabel}
            value={`${formatNumber(config[field.key])}${"suffix" in field ? field.suffix : ""}`}
          />
        ))}
        <ProfileMetric label="주기 입금" value={isDividendReinvestorProfileSelected ? "배당 이벤트만 사용" : formatWon(config.recurringDepositAmount)} />
        <ProfileMetric label="입금 주기" value={isDividendReinvestorProfileSelected || !selectedProfileHasRecurringDeposit ? "-" : `${formatNumber(config.recurringDepositIntervalValue)}${formatRecurringCashIntervalUnit(config.recurringDepositIntervalUnit)}`} />
        <ProfileMetric label="수정일" value={config.updatedAt ? config.updatedAt.slice(0, 10) : "-"} />
      </div>
    </>
  );
}
