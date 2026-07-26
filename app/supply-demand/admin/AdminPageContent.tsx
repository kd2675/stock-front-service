import type { ComponentProps } from "react";

import { AdminAccountsSection } from "@/app/supply-demand/admin/AdminAccountsSection";
import { AdminAutomationSection } from "@/app/supply-demand/admin/AdminAutomationSection";
import { AdminAutoParticipantManagementPanel } from "@/app/supply-demand/admin/AdminAutoParticipantManagementPanel";
import { AdminDormantAssetsPanel } from "@/app/supply-demand/admin/AdminDormantAssetsPanel";
import { AdminEventsSection } from "@/app/supply-demand/admin/AdminEventsSection";
import { AdminEodSection } from "@/app/supply-demand/admin/AdminEodSection";
import { AdminInstitutionPortfolioPanel } from "@/app/supply-demand/admin/AdminInstitutionPortfolioPanel";
import { AdminMarketSection } from "@/app/supply-demand/admin/AdminMarketSection";
import type { AdminSection, AdminTab } from "@/app/supply-demand/admin/AdminNavigationConfig";
import { AdminPageShell } from "@/app/supply-demand/admin/AdminPageShell";
import { AdminUnderwritingContractPanel } from "@/app/supply-demand/admin/AdminUnderwritingContractPanel";

export type AdminPageContentProps = {
  accountsProps: ComponentProps<typeof AdminAccountsSection> | null;
  activeAdminSection: AdminSection;
  activeAdminTab: AdminTab;
  automationProps: ComponentProps<typeof AdminAutomationSection> | null;
  dormantAssetsProps: ComponentProps<typeof AdminDormantAssetsPanel> | null;
  eventsProps: ComponentProps<typeof AdminEventsSection> | null;
  eodProps: ComponentProps<typeof AdminEodSection> | null;
  institutionProps: ComponentProps<typeof AdminInstitutionPortfolioPanel> | null;
  marketProps: ComponentProps<typeof AdminMarketSection> | null;
  message: string | null;
  participantsProps: ComponentProps<typeof AdminAutoParticipantManagementPanel> | null;
  underwritingProps: ComponentProps<typeof AdminUnderwritingContractPanel> | null;
};

export function AdminPageContent({
  accountsProps,
  activeAdminSection,
  activeAdminTab,
  automationProps,
  dormantAssetsProps,
  eventsProps,
  eodProps,
  institutionProps,
  marketProps,
  message,
  participantsProps,
  underwritingProps,
}: AdminPageContentProps) {
  return (
    <AdminPageShell activeAdminSection={activeAdminSection} activeAdminTab={activeAdminTab} message={message}>
      {marketProps ? (
        <AdminMarketSection {...marketProps} />
      ) : null}

      {accountsProps ? (
        <AdminAccountsSection {...accountsProps} />
      ) : null}

      {automationProps ? (
        <AdminAutomationSection {...automationProps} />
      ) : null}

      {eodProps ? <AdminEodSection {...eodProps} /> : null}

      {activeAdminSection === "participants-list" && participantsProps ? (
        <AdminAutoParticipantManagementPanel {...participantsProps} />
      ) : null}

      {dormantAssetsProps ? <AdminDormantAssetsPanel {...dormantAssetsProps} /> : null}

      {institutionProps ? <AdminInstitutionPortfolioPanel {...institutionProps} /> : null}

      {underwritingProps ? <AdminUnderwritingContractPanel {...underwritingProps} /> : null}

      {activeAdminTab === "corporate" && eventsProps ? (
        <AdminEventsSection {...eventsProps} />
      ) : null}
    </AdminPageShell>
  );
}
