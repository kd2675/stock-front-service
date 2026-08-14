import type { AdminPageContentProps } from "@/app/supply-demand/admin/AdminPageContent";
import type { AdminPageContentBuilderContext } from "@/app/supply-demand/admin/AdminPageContentBuilderContext";
import { buildAdminAccountsContentProps } from "@/app/supply-demand/admin/buildAdminAccountsContentProps";
import { buildAdminAutomationContentProps } from "@/app/supply-demand/admin/buildAdminAutomationContentProps";
import { buildAdminEventsContentProps } from "@/app/supply-demand/admin/buildAdminEventsContentProps";
import { buildAdminEodContentProps } from "@/app/supply-demand/admin/buildAdminEodContentProps";
import { buildAdminMarketContentProps } from "@/app/supply-demand/admin/buildAdminMarketContentProps";

export function buildAdminPageContentProps(context: AdminPageContentBuilderContext): AdminPageContentProps {
  const isAccountsContent = context.activeAdminTab === "funds" || context.activeAdminSection === "participants-overview";
  const isAutomationContent = context.activeAdminSection === "market-liquidity-providers"
    || context.activeAdminSection === "market-auto-market"
    || context.activeAdminSection === "participants-profiles"
    || context.activeAdminSection === "system-jobs";
  const isDormantAssetsContent = context.activeAdminSection === "funds-custody";
  const isUnderwritingContent = context.activeAdminSection === "corporate-underwriting";
  const isEventsContent = context.activeAdminTab === "corporate" && !isUnderwritingContent;
  const isInstitutionContent = context.activeAdminSection === "participants-institutions";
  const isScaledMarketContent = context.activeAdminSection === "market-scaled-market";
  const isMarketContent = context.activeAdminSection === "dashboard"
    || context.activeAdminSection === "market-instruments"
    || context.activeAdminTab === "flows";

  return {
    activeAdminSection: context.activeAdminSection,
    activeAdminTab: context.activeAdminTab,
    accountsProps: isAccountsContent ? buildAdminAccountsContentProps(context) : null,
    automationProps: isAutomationContent ? buildAdminAutomationContentProps(context) : null,
    dormantAssetsProps: isDormantAssetsContent ? {
      custodyOverview: context.queries.systemCustodyOverviewQuery.data ?? null,
      loading: context.queries.systemCustodyOverviewQuery.isFetching,
      error: context.queries.systemCustodyOverviewQuery.isError,
      onRefresh: () => {
        void context.queries.systemCustodyOverviewQuery.refetch();
      },
    } : null,
    eventsProps: isEventsContent ? buildAdminEventsContentProps(context) : null,
    eodProps: context.activeAdminSection === "system-eod" ? buildAdminEodContentProps(context) : null,
    institutionProps: isInstitutionContent ? {
      accessToken: context.queries.accessToken,
      portfolios: context.queries.institutionPortfoliosQuery.data ?? [],
      recommendation: context.queries.institutionPortfolioRecommendationQuery.data ?? null,
      loading: context.queries.institutionPortfoliosQuery.isFetching
        || context.queries.institutionPortfolioRecommendationQuery.isFetching,
      error: context.queries.institutionPortfoliosQuery.isError
        || context.queries.institutionPortfolioRecommendationQuery.isError,
      onRefresh: () => {
        void Promise.all([
          context.queries.institutionPortfoliosQuery.refetch(),
          context.queries.institutionPortfolioRecommendationQuery.refetch(),
        ]);
      },
    } : null,
    marketProps: isMarketContent ? buildAdminMarketContentProps(context) : null,
    message: context.message,
    scaledMarketProps: isScaledMarketContent ? {
      accessToken: context.queries.accessToken,
    } : null,
    underwritingProps: isUnderwritingContent ? {
      accessToken: context.queries.accessToken,
      contracts: context.queries.underwritingContractsQuery.data ?? [],
      recommendation: context.queries.underwritingContractRecommendationQuery.data ?? null,
      loading: context.queries.underwritingContractsQuery.isFetching
        || context.queries.underwritingContractRecommendationQuery.isFetching,
      error: context.queries.underwritingContractsQuery.isError
        || context.queries.underwritingContractRecommendationQuery.isError,
      onRefresh: () => {
        void Promise.all([
          context.queries.underwritingContractsQuery.refetch(),
          context.queries.underwritingContractRecommendationQuery.refetch(),
        ]);
      },
    } : null,
  };
}
