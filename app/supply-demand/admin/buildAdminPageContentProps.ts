import type { AdminPageContentProps } from "@/app/supply-demand/admin/AdminPageContent";
import type { AdminPageContentBuilderContext } from "@/app/supply-demand/admin/AdminPageContentBuilderContext";
import { buildAdminAccountsContentProps } from "@/app/supply-demand/admin/buildAdminAccountsContentProps";
import { buildAdminAutomationContentProps } from "@/app/supply-demand/admin/buildAdminAutomationContentProps";
import { buildAdminEventsContentProps } from "@/app/supply-demand/admin/buildAdminEventsContentProps";
import { buildAdminMarketContentProps } from "@/app/supply-demand/admin/buildAdminMarketContentProps";
import { buildAdminParticipantsContentProps } from "@/app/supply-demand/admin/buildAdminParticipantsContentProps";

export function buildAdminPageContentProps(context: AdminPageContentBuilderContext): AdminPageContentProps {
  const isAccountsContent = context.activeAdminTab === "funds" || context.activeAdminSection === "participants-overview";
  const isAutomationContent = context.activeAdminSection === "market-liquidity"
    || context.activeAdminSection === "participants-profiles"
    || context.activeAdminSection === "participants-symbols"
    || context.activeAdminSection === "system-jobs";
  const isEventsContent = context.activeAdminTab === "corporate";
  const isMarketContent = context.activeAdminSection === "dashboard"
    || context.activeAdminSection === "market-instruments"
    || context.activeAdminSection === "market-flows";
  const isParticipantsContent = context.activeAdminSection === "participants-list";

  return {
    activeAdminSection: context.activeAdminSection,
    activeAdminTab: context.activeAdminTab,
    accountsProps: isAccountsContent ? buildAdminAccountsContentProps(context) : null,
    automationProps: isAutomationContent ? buildAdminAutomationContentProps(context) : null,
    eventsProps: isEventsContent ? buildAdminEventsContentProps(context) : null,
    marketProps: isMarketContent ? buildAdminMarketContentProps(context) : null,
    message: context.message,
    participantsProps: isParticipantsContent ? buildAdminParticipantsContentProps(context) : null,
  };
}
