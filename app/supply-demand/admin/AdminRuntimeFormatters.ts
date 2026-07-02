import type { BatchJobRuntimeStatus } from "@/app/types/stock";

export function formatRuntimeUpdateMessage(label: string, requestedRuntimeEnabled: boolean, effectiveEnabled: boolean) {
  if (!requestedRuntimeEnabled) {
    return `${label}을 중지했습니다.`;
  }
  if (!effectiveEnabled) {
    return `${label} DB 런타임은 ON이지만 배치 서버 설정이 OFF라 자동 실행은 아직 스킵됩니다.`;
  }
  return `${label}을 재개했습니다.`;
}

export function formatRuntimeReason(control: Pick<BatchJobRuntimeStatus, "schedulerConfigured" | "runtimeEnabled" | "effectiveEnabled">) {
  if (control.effectiveEnabled) {
    return "스케줄러 설정과 DB 런타임이 모두 ON입니다.";
  }
  if (!control.schedulerConfigured && control.runtimeEnabled) {
    return "배치 서버 설정이 OFF라 DB ON이어도 자동 실행하지 않습니다.";
  }
  if (control.schedulerConfigured && !control.runtimeEnabled) {
    return "DB 런타임이 OFF라 스케줄러가 실행을 건너뜁니다.";
  }
  return "배치 서버 설정과 DB 런타임이 모두 OFF입니다.";
}
