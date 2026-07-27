import { formatCompactWon, formatNumber, formatWon } from "@/app/supply-demand/admin/AdminFormatters";
import type {
  AdminInvestorFlowSourceStatus,
  AdminInvestorFlowSummary,
  AdminFundFlowBreakdown,
  AdminFundFlowSummary,
  AdminParticipantCategory,
  AdminParticipantCategoryFlow,
  AdminParticipantScope,
} from "@/app/types/stock";

export const ADMIN_PARTICIPANT_CATEGORIES: AdminParticipantCategory[] = [
  "MANUAL_PARTICIPANT",
  "AUTO_PARTICIPANT",
  "INSTITUTIONAL_INVESTOR",
  "LIQUIDITY_PROVIDER",
  "ISSUE_UNDERWRITER",
  "SYSTEM_CUSTODY",
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
  INSTITUTIONAL_INVESTOR: {
    label: "기관투자자",
    colorClassName: "bg-admin-accent",
    surfaceClassName: "border-admin-accent/25 bg-admin-accent-surface/20",
  },
  LIQUIDITY_PROVIDER: {
    label: "유동성 공급자",
    colorClassName: "bg-admin-accent-soft",
    surfaceClassName: "border-admin-accent/20 bg-admin-accent-surface/15",
  },
  ISSUE_UNDERWRITER: {
    label: "발행 인수기관",
    colorClassName: "bg-admin-warning",
    surfaceClassName: "border-admin-warning/25 bg-admin-warning/[0.06]",
  },
  SYSTEM_CUSTODY: {
    label: "시스템 보관",
    colorClassName: "bg-admin-subtle",
    surfaceClassName: "border-white/10 bg-white/[0.04]",
  },
};

export const ADMIN_PARTICIPANT_SCOPES: AdminParticipantScope[] = [
  "ALL",
  ...ADMIN_PARTICIPANT_CATEGORIES,
];

export const ADMIN_PARTICIPANT_SCOPE_LABELS: Record<AdminParticipantScope, string> = {
  ALL: "전체",
  MANUAL_PARTICIPANT: ADMIN_PARTICIPANT_CATEGORY_META.MANUAL_PARTICIPANT.label,
  AUTO_PARTICIPANT: ADMIN_PARTICIPANT_CATEGORY_META.AUTO_PARTICIPANT.label,
  INSTITUTIONAL_INVESTOR: ADMIN_PARTICIPANT_CATEGORY_META.INSTITUTIONAL_INVESTOR.label,
  LIQUIDITY_PROVIDER: ADMIN_PARTICIPANT_CATEGORY_META.LIQUIDITY_PROVIDER.label,
  ISSUE_UNDERWRITER: ADMIN_PARTICIPANT_CATEGORY_META.ISSUE_UNDERWRITER.label,
  SYSTEM_CUSTODY: ADMIN_PARTICIPANT_CATEGORY_META.SYSTEM_CUSTODY.label,
};

export function resolveParticipantFundFlow(
  breakdown: AdminFundFlowBreakdown | null,
  scope: AdminParticipantScope,
): AdminFundFlowSummary | null {
  if (!breakdown) {
    return null;
  }
  if (scope === "ALL") {
    return breakdown.total;
  }
  return breakdown.categories.find((category) => category.participantCategory === scope)?.summary ?? null;
}

export type AdminParticipantAmountFlow = AdminParticipantCategoryFlow & {
  netBuyAmount: number;
  participationAmount: number;
  buyAmountShareRate: number;
  sellAmountShareRate: number;
  amountShareRate: number;
};

export const ADMIN_INVESTOR_FLOW_SOURCE_META: Record<AdminInvestorFlowSourceStatus, {
  label: string;
  description: string;
  badgeClassName: string;
}> = {
  LIVE_ASYNC: {
    label: "장중 비동기",
    description: "계좌별 당일 요약을 비동기로 반영합니다.",
    badgeClassName: "bg-admin-accent-surface text-admin-accent",
  },
  CLOSED_SNAPSHOT: {
    label: "장마감 스냅샷",
    description: "장마감 보고서 집계가 완료된 불변 데이터입니다.",
    badgeClassName: "bg-admin-success-surface text-admin-success",
  },
  NO_TRADING: {
    label: "정상 무거래일",
    description: "거래가 없도록 정상적으로 건너뛴 시뮬레이션 일자입니다.",
    badgeClassName: "bg-white/10 text-admin-muted",
  },
  EOD_PENDING: {
    label: "EOD 집계 대기",
    description: "장마감 보고서 집계가 아직 완료되지 않았습니다.",
    badgeClassName: "bg-admin-warning-surface text-admin-warning",
  },
  EOD_FAILED: {
    label: "EOD 집계 실패",
    description: "장마감 후처리 실패로 권위 있는 보고서가 없습니다.",
    badgeClassName: "bg-admin-danger-surface text-admin-danger",
  },
  MISSING: {
    label: "집계 누락",
    description: "이 날짜의 권위 있는 cycle 또는 보고서를 찾지 못했습니다.",
    badgeClassName: "bg-admin-danger-surface text-admin-danger",
  },
};

export function resolveInvestorFlowSourceStatus(
  flow: AdminInvestorFlowSummary,
  currentSimulationDate: string,
): AdminInvestorFlowSourceStatus {
  if (flow.sourceStatus) {
    return flow.sourceStatus;
  }
  return flow.simulationTradeDate === currentSimulationDate ? "LIVE_ASYNC" : "MISSING";
}

export function isInvestorFlowIncludedInAggregate(sourceStatus: AdminInvestorFlowSourceStatus) {
  return sourceStatus === "LIVE_ASYNC" || sourceStatus === "CLOSED_SNAPSHOT" || sourceStatus === "NO_TRADING";
}

export function resolveParticipantCategories(flow: AdminInvestorFlowSummary) {
  const categoryByKey = new Map(flow.categories.map((category) => [category.category, category]));
  return ADMIN_PARTICIPANT_CATEGORIES.map(
    (category) => categoryByKey.get(category) ?? emptyParticipantCategory(category),
  );
}

export function summarizeInvestorFlowAmounts(
  categories: AdminParticipantCategoryFlow[],
) {
  const totalBuyAmount = categories.reduce((sum, category) => sum + category.buyAmount, 0);
  const totalSellAmount = categories.reduce((sum, category) => sum + category.sellAmount, 0);
  const totalParticipationAmount = totalBuyAmount + totalSellAmount;
  const amountCategories: AdminParticipantAmountFlow[] = categories.map((category) => {
    const participationAmount = category.buyAmount + category.sellAmount;
    return {
      ...category,
      netBuyAmount: category.buyAmount - category.sellAmount,
      participationAmount,
      buyAmountShareRate: percentageOf(category.buyAmount, totalBuyAmount),
      sellAmountShareRate: percentageOf(category.sellAmount, totalSellAmount),
      amountShareRate: percentageOf(participationAmount, totalParticipationAmount),
    };
  });
  return {
    categories: amountCategories,
    totalBuyAmount,
    totalSellAmount,
    totalParticipationAmount,
    balanced: totalBuyAmount === totalSellAmount,
  };
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

export function presentNetBuyAmount(netBuyAmount: number) {
  if (netBuyAmount > 0) {
    return {
      label: "순매수 금액",
      value: `+${formatCompactWon(netBuyAmount)}`,
      exactValue: `+${formatWon(netBuyAmount)}`,
      valueClassName: "text-admin-success",
    };
  }
  if (netBuyAmount < 0) {
    return {
      label: "순매도 금액",
      value: `-${formatCompactWon(Math.abs(netBuyAmount))}`,
      exactValue: `-${formatWon(Math.abs(netBuyAmount))}`,
      valueClassName: "text-admin-danger",
    };
  }
  return {
    label: "순매수 금액",
    value: "0원",
    exactValue: "0원",
    valueClassName: "text-white",
  };
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

function percentageOf(value: number, total: number) {
  return total > 0 ? (value * 100) / total : 0;
}
