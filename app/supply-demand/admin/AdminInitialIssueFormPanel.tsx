import type { UseFormReturn } from "react-hook-form";

import type {
  CreateInstrumentFormValues,
  CreateInstrumentPayload,
} from "@/app/lib/validation/adminSchemas";
import { DarkFormInput } from "@/app/supply-demand/admin/AdminFormControls";

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
  const tradableShareRatePercent = Number(createInstrumentForm.watch("tradableShareRatePercent"));
  const validIssuedShares = Number.isSafeInteger(issuedShares) && issuedShares > 0 ? issuedShares : 0;
  const hasValidTradableRate = Number.isFinite(tradableShareRatePercent)
    && tradableShareRatePercent >= 20
    && tradableShareRatePercent <= 85;
  const tradableShares = hasValidTradableRate
    ? Math.floor(validIssuedShares * tradableShareRatePercent / 100)
    : 0;
  const lockedShares = hasValidTradableRate ? Math.max(0, validIssuedShares - tradableShares) : 0;

  return (
    <form
      className="mt-4 grid min-w-0 gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <InitialIssueSection title="발행 조건" description="종목 원장과 최초 인수원가의 기준이 되는 값을 입력합니다.">
        <div className="grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <DarkFormInput label="종목 코드" registration={createInstrumentForm.register("symbol")} placeholder="예: DEMO001" error={createInstrumentForm.formState.errors.symbol?.message} />
          <DarkFormInput label="종목명" registration={createInstrumentForm.register("name")} placeholder="예: 제로큐 주문장" error={createInstrumentForm.formState.errors.name?.message} className="sm:col-span-2" />
          <DarkFormInput label="시장" registration={createInstrumentForm.register("market")} placeholder="ORDERBOOK" error={createInstrumentForm.formState.errors.market?.message} />
          <DarkFormInput label="발행가" registration={createInstrumentForm.register("initialPrice")} placeholder="70000" error={createInstrumentForm.formState.errors.initialPrice?.message} />
          <DarkFormInput label="발행주식수" registration={createInstrumentForm.register("issuedShares")} placeholder="100000" error={createInstrumentForm.formState.errors.issuedShares?.message} />
          <DarkFormInput label="가격제한폭(%)" registration={createInstrumentForm.register("priceLimitRate")} placeholder="30" error={createInstrumentForm.formState.errors.priceLimitRate?.message} />
        </div>
      </InitialIssueSection>

      <InitialIssueSection title="최초 배정 구조" description="축소시장에 맞춰 유통 가능한 물량과 비거래 보관 물량을 분리합니다.">
        <div className="grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <input type="hidden" {...createInstrumentForm.register("initialIssueMode")} />
          <div className="rounded-md border border-admin-accent/25 bg-admin-accent/[0.07] px-3 py-2.5 text-[11px] font-bold leading-5 text-stock-subtle sm:col-span-2">
            <p className="text-white">역할 분리형 발행</p>
            <p className="mt-1">유통 대기 물량, 잠금 물량, 인수계정, LP 계정을 서로 분리합니다. 기존 자동 유동성 계정은 새로 만들지 않습니다.</p>
          </div>
          <DarkFormInput
            label="초기 유통비율(%)"
            registration={createInstrumentForm.register("tradableShareRatePercent")}
            placeholder="50"
            error={createInstrumentForm.formState.errors.tradableShareRatePercent?.message}
          />
          <div className="rounded-md border border-white/10 bg-black/20 px-3 py-2.5 text-[11px] font-bold leading-5 text-stock-subtle">
            <p className="text-white">
              {hasValidTradableRate
                ? `유통 ${tradableShares.toLocaleString()}주 · 보관 ${lockedShares.toLocaleString()}주`
                : "유통비율 입력값을 확인해 주세요."}
            </p>
            <p className="mt-1">발행 직후에는 CLOSED로 대기하며, 인수와 LP를 각 전용 탭에서 별도로 생성합니다.</p>
          </div>
        </div>
      </InitialIssueSection>

      <div className="flex flex-col gap-2 border-t border-white/10 pt-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[11px] font-bold leading-5 text-admin-placeholder">
          종목과 유통 대기·잠금 배정원장만 만들고 CLOSED로 대기합니다. 인수계약 생성과 LP 생성은 역할별 탭에서 각각 진행합니다.
        </p>
        <button type="submit" disabled={creatingInitialIssue} className="min-h-11 shrink-0 rounded-md bg-white px-5 py-3 text-sm font-black text-admin-canvas transition hover:bg-admin-accent-label disabled:cursor-wait disabled:opacity-50">
          {creatingInitialIssue ? "발행 중" : "신규 발행 생성"}
        </button>
      </div>
    </form>
  );
}

function InitialIssueSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset className="min-w-0 rounded-md border border-white/10 bg-white/[0.025] p-4">
      <legend className="px-1 text-sm font-black text-white">{title}</legend>
      <p className="mb-4 mt-1 text-[11px] font-bold leading-5 text-stock-subtle">{description}</p>
      {children}
    </fieldset>
  );
}
