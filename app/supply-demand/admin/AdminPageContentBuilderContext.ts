import type { Dispatch, SetStateAction } from "react";

import type { AdminPageContentProps } from "@/app/supply-demand/admin/AdminPageContent";
import type { useAdminPageActions } from "@/app/supply-demand/admin/useAdminPageActions";
import type { useAdminPageDerivedState } from "@/app/supply-demand/admin/useAdminPageDerivedState";
import type { useAdminPageDraftState } from "@/app/supply-demand/admin/useAdminPageDraftState";
import type { useAdminPageQueries } from "@/app/supply-demand/admin/useAdminPageQueries";
import type { useAdminQueryInvalidations } from "@/app/supply-demand/admin/useAdminQueryInvalidations";

export type AdminPageContentBuilderContext = {
  activeAdminSection: AdminPageContentProps["activeAdminSection"];
  activeAdminTab: AdminPageContentProps["activeAdminTab"];
  actions: ReturnType<typeof useAdminPageActions>;
  derived: ReturnType<typeof useAdminPageDerivedState>;
  drafts: ReturnType<typeof useAdminPageDraftState>;
  message: string | null;
  queries: ReturnType<typeof useAdminPageQueries>;
  queryInvalidations: ReturnType<typeof useAdminQueryInvalidations>;
  setAdminCashFlowPageIndex: (page: number) => void;
  setMessage: Dispatch<SetStateAction<string | null>>;
};
