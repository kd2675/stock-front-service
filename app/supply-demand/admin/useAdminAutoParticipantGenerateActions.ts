import { useCallback } from "react";
import { useMutation } from "@tanstack/react-query";

import {
  DEFAULT_AUTO_GENERATE_DISPLAY_PREFIX,
  DEFAULT_AUTO_GENERATE_KEY_PREFIX,
  DEFAULT_AUTO_PARTICIPANT_PROFILE_TYPE,
} from "@/app/supply-demand/admin/AdminConstants";
import {
  autoParticipantGenerateMutationOptions,
  formatAutoParticipantGenerateSuccessMessage,
} from "@/app/supply-demand/admin/AdminAutoParticipantActionHelpers";
import type { AdminActionMessageSetter, RequireAdminToken } from "@/app/supply-demand/admin/AdminActionTypes";
import type { AutoParticipantGenerateDraft } from "@/app/supply-demand/admin/AdminAutoParticipantActionTypes";
import { buildAutoParticipantGenerateRequests } from "@/app/supply-demand/admin/AdminAutoParticipantGeneratePayloadHelpers";
import { resolveParticipantUserKeys } from "@/app/supply-demand/admin/AdminSelectionHelpers";
import type { AutoParticipant } from "@/app/types/stock";

export function useAdminAutoParticipantGenerateActions({
  existingParticipants,
  generateDraft,
  requireAdminToken,
  resetAutoParticipantDraft,
  reloadAutoParticipantState,
  savingAutoParticipant,
  setMessage,
}: {
  existingParticipants: AutoParticipant[];
  generateDraft: AutoParticipantGenerateDraft;
  requireAdminToken: RequireAdminToken;
  resetAutoParticipantDraft: () => void;
  reloadAutoParticipantState: () => void;
  savingAutoParticipant: boolean;
  setMessage: AdminActionMessageSetter;
}) {
  const generateAutoParticipantsMutation = useMutation(autoParticipantGenerateMutationOptions());
  const runGenerateAutoParticipants = generateAutoParticipantsMutation.mutateAsync;

  const generateAutoParticipants = useCallback(async () => {
    if (generateAutoParticipantsMutation.isPending || savingAutoParticipant) {
      return;
    }
    const generateRequestDraft = buildAutoParticipantGenerateRequests({
      ...generateDraft,
      existingUserKeys: resolveParticipantUserKeys(existingParticipants),
      fallbackKeyPrefix: DEFAULT_AUTO_GENERATE_KEY_PREFIX,
      fallbackDisplayPrefix: DEFAULT_AUTO_GENERATE_DISPLAY_PREFIX,
      fallbackProfileType: DEFAULT_AUTO_PARTICIPANT_PROFILE_TYPE,
    });
    if (!generateRequestDraft.ok) {
      setMessage(generateRequestDraft.message);
      return;
    }

    const token = await requireAdminToken("관리자 로그인 후 자동 참여자를 생성할 수 있습니다.");
    if (!token) {
      return;
    }

    const generated = await runGenerateAutoParticipants({
      token,
      requests: generateRequestDraft.requests,
    });
    if (!generated.ok) {
      setMessage(generated.message);
      return;
    }
    resetAutoParticipantDraft();
    setMessage(formatAutoParticipantGenerateSuccessMessage({
      created: generated.created,
      profileMode: generateRequestDraft.profileMode,
      profileType: generateRequestDraft.profileType,
    }));
    reloadAutoParticipantState();
  }, [
    existingParticipants,
    generateDraft,
    generateAutoParticipantsMutation.isPending,
    reloadAutoParticipantState,
    requireAdminToken,
    resetAutoParticipantDraft,
    runGenerateAutoParticipants,
    savingAutoParticipant,
    setMessage,
  ]);

  return {
    generateAutoParticipants,
    generatingAutoParticipants: generateAutoParticipantsMutation.isPending,
  };
}
