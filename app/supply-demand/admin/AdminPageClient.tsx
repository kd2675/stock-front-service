"use client";

import { AdminPageContent } from "@/app/supply-demand/admin/AdminPageContent";
import { AdminAccessStatusPanel } from "@/app/supply-demand/admin/AdminPageShell";
import { useSupplyDemandAdminPageModel } from "@/app/supply-demand/admin/useSupplyDemandAdminPageModel";

export default function AdminPageClient() {
  const { adminStatus, contentProps } = useSupplyDemandAdminPageModel();

  if (adminStatus === "checking") {
    return <AdminAccessStatusPanel status={adminStatus} />;
  }

  if (adminStatus === "denied") {
    return <AdminAccessStatusPanel status={adminStatus} />;
  }

  return <AdminPageContent {...contentProps} />;
}
