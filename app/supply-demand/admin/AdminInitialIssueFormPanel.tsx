import type { UseFormReturn } from "react-hook-form";

import type {
  CreateInstrumentFormValues,
  CreateInstrumentPayload,
} from "@/app/lib/validation/adminSchemas";
import { DarkFormInput, DarkFormSelect } from "@/app/supply-demand/admin/AdminFormControls";
import { AdminTargetHoldingPercentageControl } from "@/app/supply-demand/admin/AdminTargetHoldingPercentageControl";

type AdminInitialIssueFormPanelProps = {
  createInstrumentForm: UseFormReturn<CreateInstrumentFormValues, unknown, CreateInstrumentPayload>;
  creatingInitialIssue: boolean;
  onSubmit: () => void;
};

export function AdminInitialIssueFormPanel({
  createInstrumentForm,
  creatingInitialIssue,
  onSubmit,
}: AdminInitialIssueFormPanelProps) {
  const issuedShares = Number(createInstrumentForm.watch("issuedShares"));
  const targetHoldingQuantity = String(createInstrumentForm.watch("listingAutoTargetHoldingQuantity") ?? "0");

  return (
    <div className="mt-4 grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <DarkFormInput label="종목 코드" registration={createInstrumentForm.register("symbol")} placeholder="예: DEMO001" error={createInstrumentForm.formState.errors.symbol?.message} />
      <DarkFormInput label="종목명" registration={createInstrumentForm.register("name")} placeholder="예: 제로큐 주문장" error={createInstrumentForm.formState.errors.name?.message} className="sm:col-span-2 lg:col-span-2" />
      <DarkFormInput label="시장" registration={createInstrumentForm.register("market")} placeholder="ORDERBOOK" error={createInstrumentForm.formState.errors.market?.message} />
      <DarkFormInput label="초기 가격" registration={createInstrumentForm.register("initialPrice")} placeholder="70000" error={createInstrumentForm.formState.errors.initialPrice?.message} />
      <DarkFormInput label="발행주식수" registration={createInstrumentForm.register("issuedShares")} placeholder="100000" error={createInstrumentForm.formState.errors.issuedShares?.message} />
      <DarkFormInput label="가격제한폭(%)" registration={createInstrumentForm.register("priceLimitRate")} placeholder="30" error={createInstrumentForm.formState.errors.priceLimitRate?.message} />
      <DarkFormInput label="주관사 표시명" registration={createInstrumentForm.register("listingAutoDisplayName")} placeholder="미입력 시 자동 생성" error={createInstrumentForm.formState.errors.listingAutoDisplayName?.message} className="sm:col-span-2" />
      <DarkFormSelect label="주관사 상태" registration={createInstrumentForm.register("listingAutoEnabled")}>
        <option value="true">가동</option>
        <option value="false">정지</option>
      </DarkFormSelect>
      <DarkFormSelect label="주관사 포지션" registration={createInstrumentForm.register("listingAutoPositionSide")}>
        <option value="SELL_ONLY">매도 전용</option>
        <option value="BUY_ONLY">매수 전용</option>
        <option value="TWO_SIDED">양방향 기관 운용</option>
      </DarkFormSelect>
      <input type="hidden" {...createInstrumentForm.register("listingAutoTargetHoldingQuantity")} />
      <AdminTargetHoldingPercentageControl
        issuedShares={Number.isSafeInteger(issuedShares) ? issuedShares : 0}
        targetHoldingQuantity={targetHoldingQuantity}
        onTargetHoldingQuantityChange={(value) => createInstrumentForm.setValue(
          "listingAutoTargetHoldingQuantity",
          value,
          { shouldDirty: true, shouldValidate: true },
        )}
        error={createInstrumentForm.formState.errors.listingAutoTargetHoldingQuantity?.message}
      />
      <DarkFormInput label="보유 허용 밴드(±주)" registration={createInstrumentForm.register("listingAutoInventoryBandQuantity")} placeholder="0" error={createInstrumentForm.formState.errors.listingAutoInventoryBandQuantity?.message} />
      <DarkFormInput label="목표 매수 호가 잔량" registration={createInstrumentForm.register("listingAutoTargetBuyQuantity")} placeholder="0" error={createInstrumentForm.formState.errors.listingAutoTargetBuyQuantity?.message} />
      <DarkFormInput label="목표 매도 호가 잔량" registration={createInstrumentForm.register("listingAutoTargetSellQuantity")} placeholder="100" error={createInstrumentForm.formState.errors.listingAutoTargetSellQuantity?.message} />
      <DarkFormInput label="주관사 최대 수량" registration={createInstrumentForm.register("listingAutoMaxOrderQuantity")} placeholder="100" error={createInstrumentForm.formState.errors.listingAutoMaxOrderQuantity?.message} />
      <DarkFormInput label="주관사 호가 TTL(시뮬 초)" registration={createInstrumentForm.register("listingAutoOrderTtlSeconds")} placeholder="90" error={createInstrumentForm.formState.errors.listingAutoOrderTtlSeconds?.message} />
      <DarkFormInput label="가격 분산 틱" registration={createInstrumentForm.register("listingAutoPriceOffsetTicks")} placeholder="3" error={createInstrumentForm.formState.errors.listingAutoPriceOffsetTicks?.message} />
      <DarkFormSelect label="매수 분산 방향" registration={createInstrumentForm.register("listingAutoBuyPriceOffsetDirection")}>
        <option value="DOWN">아래</option>
        <option value="UP">위</option>
        <option value="RANDOM">위·아래 무작위(비교차)</option>
      </DarkFormSelect>
      <DarkFormSelect label="매도 분산 방향" registration={createInstrumentForm.register("listingAutoSellPriceOffsetDirection")}>
        <option value="UP">위</option>
        <option value="DOWN">아래</option>
        <option value="RANDOM">위·아래 무작위(비교차)</option>
      </DarkFormSelect>
      <button type="button" onClick={onSubmit} disabled={creatingInitialIssue} className="min-h-11 min-w-0 self-end rounded-md bg-white px-3 py-3 text-sm font-black text-admin-canvas disabled:opacity-50 sm:col-span-2 lg:col-span-1">
        {creatingInitialIssue ? "적용 중" : "이벤트 적용"}
      </button>
    </div>
  );
}
