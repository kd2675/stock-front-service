import { useMutation } from "@tanstack/react-query";

import { adminUpdateListingAutoAccountConfigMutationOptions } from "@/app/lib/react-query/stockMutations";
import { reportAdminActionFailure } from "@/app/supply-demand/admin/AdminActionResultHelpers";
import type { AdminActionMessageSetter, RequireAdminToken } from "@/app/supply-demand/admin/AdminActionTypes";
import type { ListingAutoAccountDraft } from "@/app/supply-demand/admin/AdminListingAutoAccountPanel";
import { buildListingAutoAccountConfigPayload } from "@/app/supply-demand/admin/AdminMarketPayloadHelpers";

export function useAdminListingAutoAccountActions({
  draft,
  reloadAutoMarketDetailsState,
  requireAdminToken,
  setEditingListingAutoSymbol,
  setMessage,
}: {
  draft: ListingAutoAccountDraft;
  reloadAutoMarketDetailsState: () => void;
  requireAdminToken: RequireAdminToken;
  setEditingListingAutoSymbol: (symbol: string | null) => void;
  setMessage: AdminActionMessageSetter;
}) {
  const updateListingAutoAccountMutation = useMutation(adminUpdateListingAutoAccountConfigMutationOptions());

  const submitListingAutoAccountConfig = async () => {
    if (updateListingAutoAccountMutation.isPending) {
      return;
    }
    const listingAutoAccountPayload = buildListingAutoAccountConfigPayload(draft);
    if (!listingAutoAccountPayload.ok) {
      setMessage(listingAutoAccountPayload.message);
      return;
    }
    const token = await requireAdminToken("관리자 로그인 후 상장주관사 자동계정을 변경할 수 있습니다.");
    if (!token) {
      return;
    }
    const result = await updateListingAutoAccountMutation.mutateAsync({
      token,
      symbol: listingAutoAccountPayload.symbol,
      payload: listingAutoAccountPayload.payload,
    });
    if (reportAdminActionFailure(result, "상장주관사 자동계정 설정 변경에 실패했습니다.", setMessage)) {
      return;
    }
    setMessage("상장주관사 자동계정 설정을 변경했습니다.");
    setEditingListingAutoSymbol(null);
    reloadAutoMarketDetailsState();
  };

  return {
    submitListingAutoAccountConfig,
    updatingListingAutoAccount: updateListingAutoAccountMutation.isPending,
  };
}
