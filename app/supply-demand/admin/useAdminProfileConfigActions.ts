import { useMutation } from "@tanstack/react-query";

import { adminUpdateAutoParticipantProfileConfigMutationOptions } from "@/app/lib/react-query/stockMutations";
import { reportAdminActionFailure } from "@/app/supply-demand/admin/AdminActionResultHelpers";
import type { AdminActionMessageSetter, RequireAdminToken } from "@/app/supply-demand/admin/AdminActionTypes";
import type { ProfileConfigDraft } from "@/app/supply-demand/admin/AdminProfileConfigTypes";
import { buildProfileConfigPayload } from "@/app/supply-demand/admin/AdminProfilePayloadHelpers";
import type { AutoParticipantProfileType } from "@/app/types/stock";

export function useAdminProfileConfigActions({
  draft,
  editingProfileType,
  reloadAutoMarketDetailsState,
  requireAdminToken,
  setMessage,
}: {
  draft: ProfileConfigDraft;
  editingProfileType: AutoParticipantProfileType | null;
  reloadAutoMarketDetailsState: () => void;
  requireAdminToken: RequireAdminToken;
  setMessage: AdminActionMessageSetter;
}) {
  const profileConfigMutation = useMutation(adminUpdateAutoParticipantProfileConfigMutationOptions());

  const submitProfileConfig = async () => {
    if (profileConfigMutation.isPending || editingProfileType === null) {
      return;
    }
    const profileConfigPayload = buildProfileConfigPayload({
      profileType: editingProfileType,
      ...draft,
    });
    if (!profileConfigPayload.ok) {
      setMessage(profileConfigPayload.message);
      return;
    }
    const token = await requireAdminToken("관리자 로그인 후 프로필 행동 설정을 저장할 수 있습니다.");
    if (!token) {
      return;
    }
    const result = await profileConfigMutation.mutateAsync({
      token,
      profileType: editingProfileType,
      payload: profileConfigPayload.payload,
    });
    if (reportAdminActionFailure(result, "프로필 행동 설정 저장에 실패했습니다.", setMessage)) {
      return;
    }
    setMessage("프로필 행동 설정을 저장했습니다.");
    reloadAutoMarketDetailsState();
  };

  return {
    savingProfileConfig: profileConfigMutation.isPending,
    submitProfileConfig,
  };
}
