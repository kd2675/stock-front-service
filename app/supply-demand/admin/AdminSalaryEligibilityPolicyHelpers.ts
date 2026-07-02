import {
  formatNumber,
  formatRecurringCashIntervalUnit,
  formatWon,
} from "@/app/supply-demand/admin/AdminFormatters";
import type {
  AutoParticipant,
  AutoParticipantOverview,
  AutoParticipantProfileConfig,
  AutoParticipantProfileType,
  RecurringCashIntervalUnit,
} from "@/app/types/stock";

export type RecurringCashPolicyResolution = {
  payable: boolean;
  source: "PARTICIPANT" | "PROFILE";
  sourceLabel: string;
  amount: number;
  intervalValue: number | null;
  intervalUnit: RecurringCashIntervalUnit | null;
  reason: string;
};

export type SalaryEligibilityRow = {
  participant: AutoParticipant;
  overview: AutoParticipantOverview | null;
  recurringPolicy: RecurringCashPolicyResolution;
  accountStatus: string | null;
  canReceive: boolean;
  blockers: string[];
};

export function resolveSalaryEligibilityRows(
  participants: AutoParticipant[],
  profileConfigByType: Map<AutoParticipantProfileType, AutoParticipantProfileConfig>,
  overviewByUserKey: Map<string, AutoParticipantOverview>,
): SalaryEligibilityRow[] {
  return participants.map((participant) => {
    const recurringPolicy = resolveRecurringCashPolicy(participant, profileConfigByType.get(participant.profileType) ?? null);
    const overview = overviewByUserKey.get(participant.userKey) ?? null;
    const accountStatus = overview?.accountStatus ?? participant.accountStatus ?? null;
    const blockers: string[] = [];
    if (!participant.enabled) {
      blockers.push("참여자 정지");
    }
    if (participant.withdrawnAt) {
      blockers.push("탈퇴 처리");
    }
    if (!recurringPolicy.payable) {
      blockers.push(recurringPolicy.reason);
    }
    if (accountStatus === null) {
      blockers.push("계좌 확인 필요");
    } else if (accountStatus !== "ACTIVE") {
      blockers.push(`계좌 ${accountStatus}`);
    }
    return {
      participant,
      overview,
      recurringPolicy,
      accountStatus,
      canReceive: blockers.length === 0,
      blockers,
    };
  }).sort((left, right) => {
    if (left.canReceive !== right.canReceive) {
      return left.canReceive ? -1 : 1;
    }
    return left.participant.userKey.localeCompare(right.participant.userKey);
  });
}

export function summarizeSalaryEligibilityRows(rows: SalaryEligibilityRow[]) {
  return rows.reduce(
    (summary, row) => {
      if (row.canReceive) {
        summary.receivableCount += 1;
      } else {
        summary.excludedCount += 1;
      }
      if (row.recurringPolicy.payable) {
        summary.policyCount += 1;
      }
      if (row.recurringPolicy.payable && row.participant.enabled && !row.participant.withdrawnAt && row.accountStatus === null) {
        summary.accountCheckCount += 1;
      }
      return summary;
    },
    {
      receivableCount: 0,
      policyCount: 0,
      accountCheckCount: 0,
      excludedCount: 0,
    },
  );
}

export function resolveRecurringCashPolicy(
  participant: AutoParticipant,
  profileConfig: AutoParticipantProfileConfig | null,
): RecurringCashPolicyResolution {
  if (participant.profileType === "DIVIDEND_REINVESTOR") {
    return {
      payable: false,
      source: "PROFILE",
      sourceLabel: "배당 이벤트",
      amount: 0,
      intervalValue: null,
      intervalUnit: null,
      reason: "배당 지급 기능 사용",
    };
  }
  if (participant.recurringCashAmount != null) {
    return resolveRecurringCashValues({
      source: "PARTICIPANT",
      sourceLabel: "개별 설정",
      amount: participant.recurringCashAmount,
      intervalValue: participant.recurringCashIntervalValue ?? null,
      intervalUnit: participant.recurringCashIntervalUnit ?? null,
    });
  }
  if (!profileConfig) {
    return {
      payable: false,
      source: "PROFILE",
      sourceLabel: "프로필 기본값",
      amount: 0,
      intervalValue: null,
      intervalUnit: null,
      reason: "프로필 설정 없음",
    };
  }
  return resolveRecurringCashValues({
    source: "PROFILE",
    sourceLabel: "프로필 기본값",
    amount: profileConfig.recurringDepositAmount,
    intervalValue: profileConfig.recurringDepositIntervalValue,
    intervalUnit: profileConfig.recurringDepositIntervalUnit,
  });
}

export function formatRecurringCashPolicy(policy: RecurringCashPolicyResolution) {
  if (!policy.payable) {
    return policy.reason;
  }
  return `${formatWon(policy.amount)} / ${formatNumber(policy.intervalValue)}${formatRecurringCashIntervalUnit(policy.intervalUnit)}`;
}

function resolveRecurringCashValues(options: {
  source: "PARTICIPANT" | "PROFILE";
  sourceLabel: string;
  amount: number | null | undefined;
  intervalValue: number | null | undefined;
  intervalUnit: RecurringCashIntervalUnit | null | undefined;
}): RecurringCashPolicyResolution {
  const amount = Number(options.amount ?? 0);
  const intervalValue = options.intervalValue == null ? null : Number(options.intervalValue);
  const intervalUnit = options.intervalUnit ?? null;
  if (!Number.isFinite(amount) || amount <= 0) {
    return {
      payable: false,
      source: options.source,
      sourceLabel: options.sourceLabel,
      amount: Number.isFinite(amount) ? amount : 0,
      intervalValue,
      intervalUnit,
      reason: options.source === "PARTICIPANT" ? "개별 미지급" : "프로필 미지급",
    };
  }
  if (!Number.isFinite(intervalValue) || intervalValue === null || intervalValue <= 0 || intervalUnit === null) {
    return {
      payable: false,
      source: options.source,
      sourceLabel: options.sourceLabel,
      amount,
      intervalValue,
      intervalUnit,
      reason: "지급 주기 미설정",
    };
  }
  return {
    payable: true,
    source: options.source,
    sourceLabel: options.sourceLabel,
    amount,
    intervalValue,
    intervalUnit,
    reason: "지급 정책 유효",
  };
}
