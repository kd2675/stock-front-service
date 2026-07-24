import type { ReactNode } from "react";

import { RECURRING_CASH_INTERVAL_UNIT_OPTIONS } from "@/app/supply-demand/admin/AdminConstants";
import { DarkInput, DarkSelect } from "@/app/supply-demand/admin/AdminFormControls";
import {
  PROFILE_CONFIG_EXECUTION_FIELDS,
  PROFILE_CONFIG_SIGNAL_FIELDS,
} from "@/app/supply-demand/admin/AdminProfileConfigFieldMetadata";
import type { ProfileConfigDraft, ProfileConfigDraftSetters } from "@/app/supply-demand/admin/AdminProfileConfigTypes";
import type { RecurringCashIntervalUnit } from "@/app/types/stock";

const PRICING_MODE_OPTIONS = [
  { value: "DIRECTIONAL", label: "방향 신호형" },
  { value: "MARKET_MAKING", label: "양방향 시장조성형" },
] as const;
const EXIT_MODE_OPTIONS = [
  { value: "SIGNAL_DRIVEN", label: "신호 기반" },
  { value: "TAKE_PROFIT_FIRST", label: "익절 우선" },
  { value: "HOLD_LOSSES", label: "손실 보유 우선" },
] as const;
const INVENTORY_MODE_OPTIONS = [
  { value: "SIGNAL_DRIVEN", label: "신호 기반" },
  { value: "TARGET_ALLOCATION", label: "목표 재고형" },
] as const;

type AdminProfileConfigFormPanelProps = {
  draft: ProfileConfigDraft;
  draftSetters: ProfileConfigDraftSetters;
  isDividendReinvestorProfileSelected: boolean;
  saving: boolean;
  onClearSelection: () => void;
  onSubmit: () => void;
};

export function AdminProfileConfigFormPanel({
  draft,
  draftSetters,
  isDividendReinvestorProfileSelected,
  saving,
  onClearSelection,
  onSubmit,
}: AdminProfileConfigFormPanelProps) {
  return (
    <>
      <ProfilePolicySection
        title="행동 모델"
        description="이 프로필을 사용하는 모든 자동 참여자에게 동일하게 적용됩니다. 이미 생성된 주문은 생성 당시 모델을 유지하고, 저장 이후 신규 주문부터 선택한 모델을 사용합니다."
      >
        <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2">
          <DarkSelect
            label="프로필 행동 모델"
            value={draft.behaviorModelVersion}
            onChange={(value) => draftSetters.setBehaviorModelVersion(value as typeof draft.behaviorModelVersion)}
          >
            <option value="V2">V2 · 상태 기반 모델</option>
            <option value="V1">V1 · 기존 모델</option>
          </DarkSelect>
          <div className="rounded-md border border-white/10 bg-black/15 px-3 py-2 text-xs font-bold leading-5 text-stock-subtle">
            개인별 V1/V2 선택은 사용하지 않습니다. 참여자의 프로필을 바꾸면 새 프로필의 행동 모델이 적용됩니다.
          </div>
        </div>
      </ProfilePolicySection>

      <ProfilePolicySection
        title="행동 신호"
        description="뉴스·추세·손익과 군중 신호를 매수·매도·관망 의사결정에 반영하는 상대 강도입니다. 주문 빈도나 수량을 직접 늘리지 않습니다."
      >
        <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {PROFILE_CONFIG_SIGNAL_FIELDS.map((field) => (
            <DarkInput key={field.key} label={field.formLabel} value={draft[field.key]} onChange={draftSetters[field.setterKey]} placeholder={field.placeholder} />
          ))}
        </div>
      </ProfilePolicySection>

      <ProfilePolicySection
        title="주문 실행"
        description="결정 주기·회당 주문 수·가격·청산·재고·TTL·수량을 독립적으로 제어합니다. 의사결정 빈도·회당 주문 수·주문 수량의 0배만 주문 생성을 중지하며, 공격성·가격 민감도의 0배는 해당 반응만 끕니다."
      >
        <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-3">
          <DarkSelect label="가격 생성 모드" value={draft.pricingMode} onChange={(value) => draftSetters.setPricingMode(value as typeof draft.pricingMode)}>
            {PRICING_MODE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </DarkSelect>
          <DarkSelect label="청산 모드" value={draft.exitMode} onChange={(value) => draftSetters.setExitMode(value as typeof draft.exitMode)}>
            {EXIT_MODE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </DarkSelect>
          <DarkSelect label="재고 관리 모드" value={draft.inventoryMode} onChange={(value) => draftSetters.setInventoryMode(value as typeof draft.inventoryMode)}>
            {INVENTORY_MODE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </DarkSelect>
        </div>
        <div className="mt-3 grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {PROFILE_CONFIG_EXECUTION_FIELDS.map((field) => (
            <DarkInput key={field.key} label={field.formLabel} value={draft[field.key]} onChange={draftSetters[field.setterKey]} placeholder={field.placeholder} />
          ))}
        </div>
        <p className="mt-3 text-xs font-bold leading-5 text-stock-subtle">
          V2는 의사결정 빈도와 회당 주문 수를 분리해 배율 중복 증폭을 막습니다. 기존 주문 배율은 V1 호환용이며, V2 실행에서는 분리된 값을 사용합니다.
        </p>
      </ProfilePolicySection>

      <ProfilePolicySection
        title="자금 공급"
        description="외부 현금 유입 일정입니다. 거래 심리·가격 방향과 분리되며, 입금 자체가 모든 주문에 매수 보너스를 주지 않습니다."
      >
        <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-3">
          <DarkInput label="주기 입금" value={isDividendReinvestorProfileSelected ? "0" : draft.recurringDepositAmount} onChange={draftSetters.setRecurringDepositAmount} placeholder="0" disabled={isDividendReinvestorProfileSelected} />
          <DarkInput label="입금 주기 값" value={isDividendReinvestorProfileSelected ? "0" : draft.recurringDepositIntervalValue} onChange={draftSetters.setRecurringDepositIntervalValue} placeholder="0" disabled={isDividendReinvestorProfileSelected} />
          <DarkSelect
            label="입금 주기 단위"
            value={isDividendReinvestorProfileSelected ? "DAY" : draft.recurringDepositIntervalUnit}
            onChange={(value) => draftSetters.setRecurringDepositIntervalUnit(value as RecurringCashIntervalUnit)}
            disabled={isDividendReinvestorProfileSelected}
          >
            {RECURRING_CASH_INTERVAL_UNIT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </DarkSelect>
        </div>
        <p className="mt-3 text-xs font-bold leading-5 text-stock-subtle">
          {isDividendReinvestorProfileSelected
            ? "배당재투자형은 정기 입금을 사용하지 않습니다. 실제 현금배당 원장에서 부여된 전용 예산의 가용액만 매수 주문에 예약·사용하고, 미체결 취소분은 같은 예산으로 반환합니다."
            : "기본 EOD 모드의 주기 입금은 야간 현금흐름 단계에서 거래일당 한 번 도래 여부를 확인하며, 프로필의 매수·매도 방향을 강제하지 않습니다."}
        </p>
      </ProfilePolicySection>

      <div className="mt-4 flex flex-col-reverse gap-2 border-t border-white/10 pt-4 sm:flex-row sm:justify-end">
        <button type="button" onClick={onClearSelection} className="min-h-11 rounded-md bg-white/10 px-5 py-3 text-sm font-black text-white">
          선택 해제
        </button>
        <button type="button" onClick={onSubmit} disabled={saving} className="min-h-11 rounded-md bg-white px-5 py-3 text-sm font-black text-admin-canvas disabled:opacity-50">
          {saving ? "저장 중" : "설정 저장"}
        </button>
      </div>
    </>
  );
}

function ProfilePolicySection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="mt-4 rounded-md border border-white/10 bg-white/[0.025] p-3">
      <div className="mb-3">
        <h3 className="text-sm font-black text-white">{title}</h3>
        <p className="mt-1 max-w-4xl text-xs font-bold leading-5 text-stock-subtle">{description}</p>
      </div>
      {children}
    </section>
  );
}
