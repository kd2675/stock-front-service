import { mutationOptions } from "@tanstack/react-query";

import { formatAutoParticipantProfile } from "@/app/lib/autoParticipantProfiles";
import { upsertAutoParticipant } from "@/app/lib/stock";
import { getAdminActionFailureMessage } from "@/app/supply-demand/admin/AdminActionResultHelpers";
import { ADMIN_AUTO_GENERATE_CONCURRENCY } from "@/app/supply-demand/admin/AdminConstants";
import { formatCount } from "@/app/supply-demand/admin/AdminFormatters";
import type { AutoParticipantGenerateRequest } from "@/app/supply-demand/admin/AdminAutoParticipantGeneratePayloadHelpers";
import type { AutoParticipantPayload } from "@/app/supply-demand/admin/AdminAutoParticipantMutationPayloadHelpers";
import type { AutoParticipant, AutoParticipantProfileType } from "@/app/types/stock";

export type AutoParticipantGenerateMutationVariables = {
  token: string;
  requests: AutoParticipantGenerateRequest[];
};

export function toAutoParticipantTogglePayload(participant: AutoParticipant, enabled: boolean): AutoParticipantPayload {
  return {
    displayName: participant.displayName,
    enabled,
    profileType: participant.profileType,
    recurringCashAmount: participant.recurringCashAmount ?? null,
    recurringCashIntervalValue: participant.recurringCashIntervalValue ?? null,
    recurringCashIntervalUnit: participant.recurringCashIntervalUnit ?? null,
  };
}

export function autoParticipantGenerateMutationOptions() {
  return mutationOptions({
    mutationFn: (variables: AutoParticipantGenerateMutationVariables) =>
      upsertGeneratedAutoParticipants(variables.token, variables.requests),
  });
}

export async function upsertGeneratedAutoParticipants(token: string, requests: AutoParticipantGenerateRequest[]) {
  let created = 0;
  for (let index = 0; index < requests.length; index += ADMIN_AUTO_GENERATE_CONCURRENCY) {
    const chunk = requests.slice(index, index + ADMIN_AUTO_GENERATE_CONCURRENCY);
    const results = await Promise.all(chunk.map((request) => upsertAutoParticipant(token, request.userKey, {
      displayName: request.displayName,
      enabled: true,
      profileType: request.profileType,
      recurringCashAmount: request.recurringCashAmount,
      recurringCashIntervalValue: request.recurringCashIntervalValue,
      recurringCashIntervalUnit: request.recurringCashIntervalUnit,
      createAccount: request.createAccount,
      initialCashAmount: request.initialCashAmount,
    })));
    const failedIndex = results.findIndex((result) => !result.ok);
    if (failedIndex >= 0) {
      const failedRequest = chunk[failedIndex];
      const failedResult = results[failedIndex];
      const fallbackMessage = `${failedRequest.userKey} 자동 참여자 생성에 실패했습니다.`;
      return {
        ok: false as const,
        message: getAdminActionFailureMessage(failedResult, fallbackMessage) ?? fallbackMessage,
      };
    }
    created += chunk.length;
  }

  return {
    ok: true as const,
    created,
  };
}

export function formatAutoParticipantGenerateSuccessMessage(options: {
  created: number;
  profileMode: "ROTATE" | "SINGLE";
  profileType: AutoParticipantProfileType;
}) {
  if (options.profileMode === "SINGLE") {
    return `자동 참여자 ${formatCount(options.created, "명")}을 ${formatAutoParticipantProfile(options.profileType)} 프로필로 생성했습니다.`;
  }
  return `자동 참여자 ${formatCount(options.created, "명")}을 생성했습니다. 프로필은 순서대로 분산 적용했습니다.`;
}
