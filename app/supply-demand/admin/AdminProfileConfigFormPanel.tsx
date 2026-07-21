import { RECURRING_CASH_INTERVAL_UNIT_OPTIONS } from "@/app/supply-demand/admin/AdminConstants";
import { DarkInput, DarkSelect } from "@/app/supply-demand/admin/AdminFormControls";
import { PROFILE_CONFIG_BEHAVIOR_FIELDS } from "@/app/supply-demand/admin/AdminProfileConfigFieldMetadata";
import type { ProfileConfigDraft, ProfileConfigDraftSetters } from "@/app/supply-demand/admin/AdminProfileConfigTypes";
import type { RecurringCashIntervalUnit } from "@/app/types/stock";

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
      <div className="mt-4 grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {PROFILE_CONFIG_BEHAVIOR_FIELDS.map((field) => (
          <DarkInput
            key={field.key}
            label={field.formLabel}
            value={draft[field.key]}
            onChange={draftSetters[field.setterKey]}
            placeholder={field.placeholder}
          />
        ))}
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
        <div className="grid grid-cols-2 gap-2 self-end lg:col-span-2">
          <button type="button" onClick={onSubmit} disabled={saving} className="min-h-11 rounded-md bg-white px-3 py-3 text-sm font-black text-admin-canvas disabled:opacity-50">
            {saving ? "저장 중" : "저장"}
          </button>
          <button type="button" onClick={onClearSelection} className="min-h-11 rounded-md bg-white/10 px-3 py-3 text-sm font-black text-white">
            선택 해제
          </button>
        </div>
      </div>
      <p className="mt-2 text-xs font-bold text-stock-subtle">
        {isDividendReinvestorProfileSelected
          ? "배당재투자형은 월급/정기 입금을 쓰지 않습니다. 배당 지급 이벤트로 현금이 들어온 뒤 재매수 성향만 강화됩니다."
          : "심리 행동 가중치는 0-1 사이이며 실제 매수/매도 판단 방향에 직접 들어갑니다. 가격 압력 민감도는 주문 건수와 무관하게 시장·보고서 방향이 호가 가격과 교차 확률에 반영되는 크기만 조절합니다. 주문 빈도, 호가 공격성, TTL, 수량은 행동 결과의 빈도와 크기를 별도로 조정합니다. 기본 EOD 모드의 주기 입금은 00시 이후 거래일당 한 번만 도래 여부를 확인하고 누락 회차를 소급 지급하지 않습니다."}
      </p>
    </>
  );
}
