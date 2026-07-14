import type { ComponentProps } from "react";

import { AdminAccountsSection } from "@/app/supply-demand/admin/AdminAccountsSection";
import { AdminAutomationSection } from "@/app/supply-demand/admin/AdminAutomationSection";
import { AdminAutoParticipantManagementPanel } from "@/app/supply-demand/admin/AdminAutoParticipantManagementPanel";
import { AdminEventsSection } from "@/app/supply-demand/admin/AdminEventsSection";
import { AdminMarketSection } from "@/app/supply-demand/admin/AdminMarketSection";
import type { AdminSection, AdminTab } from "@/app/supply-demand/admin/AdminNavigationConfig";
import { AdminPageShell } from "@/app/supply-demand/admin/AdminPageShell";

export type AdminPageContentProps = {
  accountsProps: ComponentProps<typeof AdminAccountsSection> | null;
  activeAdminSection: AdminSection;
  activeAdminTab: AdminTab;
  automationProps: ComponentProps<typeof AdminAutomationSection> | null;
  eventsProps: ComponentProps<typeof AdminEventsSection> | null;
  marketProps: ComponentProps<typeof AdminMarketSection> | null;
  message: string | null;
  participantsProps: ComponentProps<typeof AdminAutoParticipantManagementPanel> | null;
};

export function AdminPageContent({
  accountsProps,
  activeAdminSection,
  activeAdminTab,
  automationProps,
  eventsProps,
  marketProps,
  message,
  participantsProps,
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

      {activeAdminSection === "participants-list" && participantsProps ? (
        <AdminAutoParticipantManagementPanel {...participantsProps} />
      ) : null}

      {activeAdminTab === "corporate" && eventsProps ? (
        <AdminEventsSection {...eventsProps} />
      ) : null}
    </AdminPageShell>
  );
}
