import { formatNumber, formatWon } from "@/app/supply-demand/admin/AdminFormatters";
import type { AdminInvestorFlowSummary, AdminParticipantCategory, AdminParticipantCategoryFlow } from "@/app/types/stock";

export const ADMIN_PARTICIPANT_CATEGORIES: AdminParticipantCategory[] = [
  "MANUAL_PARTICIPANT",
  "AUTO_PARTICIPANT",
  "LISTING_UNDERWRITER",
];

export const ADMIN_PARTICIPANT_CATEGORY_META: Record<AdminParticipantCategory, {
  label: string;
  colorClassName: string;
  surfaceClassName: string;
}> = {
  MANUAL_PARTICIPANT: {
    label: "유저",
    colorClassName: "bg-admin-accent",
    surfaceClassName: "border-admin-accent/25 bg-admin-accent-surface/30",
  },
  AUTO_PARTICIPANT: {
    label: "자동 참여자",
    colorClassName: "bg-admin-success",
    surfaceClassName: "border-admin-success/25 bg-admin-success-surface/25",
  },
  LISTING_UNDERWRITER: {
    label: "상장주관사",
    colorClassName: "bg-admin-warning",
    surfaceClassName: "border-admin-warning/25 bg-admin-warning/[0.06]",
  },
};

export function resolveParticipantCategories(flow: AdminInvestorFlowSummary) {
  const categoryByKey = new Map(flow.categories.map((category) => [category.category, category]));
  return ADMIN_PARTICIPANT_CATEGORIES.map(
    (category) => categoryByKey.get(category) ?? emptyParticipantCategory(category),
  );
}

export function presentNetQuantity(netQuantity: number) {
  if (netQuantity > 0) {
    return {
      label: "순매수",
      value: `+${formatNumber(netQuantity)}주`,
      valueClassName: "text-admin-success",
    };
  }
  if (netQuantity < 0) {
    return {
      label: "순매도",
      value: `${formatNumber(Math.abs(netQuantity))}주`,
      valueClassName: "text-admin-danger",
    };
  }
  return { label: "순수량", value: "0주", valueClassName: "text-white" };
}

export function presentNetCashFlow(netCashFlow: number) {
  if (netCashFlow > 0) {
    return {
      label: "현금 순유입",
      value: `+${formatWon(netCashFlow)}`,
      valueClassName: "text-admin-success",
    };
  }
  if (netCashFlow < 0) {
    return {
      label: "현금 순유출",
      value: formatWon(Math.abs(netCashFlow)),
      valueClassName: "text-admin-danger",
    };
  }
  return { label: "순현금", value: "0원", valueClassName: "text-white" };
}

export function formatParticipationRate(value: number) {
  return `${formatNumber(value)}%`;
}

export function clampParticipationRate(value: number) {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.min(100, Math.max(0, value));
}

export function emptyParticipantCategory(category: AdminParticipantCategory): AdminParticipantCategoryFlow {
  return {
    category,
    buyQuantity: 0,
    sellQuantity: 0,
    netQuantity: 0,
    participationQuantity: 0,
    buyAmount: 0,
    sellAmount: 0,
    netCashFlow: 0,
    buyShareRate: 0,
    sellShareRate: 0,
    executionShareRate: 0,
  };
}
