import { formatAutoParticipantProfile } from "@/app/lib/autoParticipantProfiles";
import {
  formatNumber,
  formatCount,
  formatRecurringCashIntervalUnit,
  formatWon,
} from "@/app/supply-demand/admin/AdminFormatters";
import type {
  AutoParticipant,
  AutoParticipantHolding,
  AutoParticipantProfileType,
} from "@/app/types/stock";

export function formatParticipantRecurringCash(participant: AutoParticipant) {
  if (participant.profileType === "DIVIDEND_REINVESTOR") {
    return "배당 이벤트만 사용";
  }
  if (participant.recurringCashAmount == null) {
    return "프로필 기본값";
  }
  if (participant.recurringCashAmount <= 0) {
    return "개별 지급 없음";
  }
  return `${formatWon(participant.recurringCashAmount)} / ${formatNumber(participant.recurringCashIntervalValue)}${formatRecurringCashIntervalUnit(participant.recurringCashIntervalUnit)}`;
}

export function resolveAutoParticipantHoldingPreview(holdings: AutoParticipantHolding[]) {
  const visibleHoldings = holdings
    .filter((holding) => holding.quantity > 0 || holding.reservedQuantity > 0)
    .sort((left, right) => right.marketValue - left.marketValue);
  const preview = visibleHoldings.slice(0, 3).map((holding) => `${holding.symbol} ${formatNumber(holding.quantity)}주`);
  const hiddenCount = visibleHoldings.length - preview.length;
  return hiddenCount > 0 ? [...preview, `외 ${formatCount(hiddenCount, "종목")}`] : preview;
}

export function filterAutoParticipants(
  participants: AutoParticipant[],
  filters: {
    profileType: "ALL" | AutoParticipantProfileType;
    search: string;
    status: "ALL" | "ENABLED" | "DISABLED";
  },
) {
  const search = filters.search.trim().toLowerCase();
  return participants.filter((participant) => {
    if (filters.status === "ENABLED" && !participant.enabled) {
      return false;
    }
    if (filters.status === "DISABLED" && participant.enabled) {
      return false;
    }
    if (filters.profileType !== "ALL" && participant.profileType !== filters.profileType) {
      return false;
    }
    if (!search) {
      return true;
    }
    return [
      participant.userKey,
      participant.displayName,
      formatAutoParticipantProfile(participant.profileType),
    ].some((value) => value.toLowerCase().includes(search));
  });
}
