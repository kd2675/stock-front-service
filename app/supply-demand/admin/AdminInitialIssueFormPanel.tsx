import type { UseFormReturn } from "react-hook-form";

import type {
  CreateInstrumentFormValues,
  CreateInstrumentPayload,
} from "@/app/lib/validation/adminSchemas";
import { DarkFormInput, DarkFormSelect } from "@/app/supply-demand/admin/AdminFormControls";
import { AdminTargetHoldingPercentageControl } from "@/app/supply-demand/admin/AdminTargetHoldingPercentageControl";
import {
  LISTING_AUTO_OPERATION_MODES,
  LISTING_AUTO_STRATEGY_PROFILES,
  listingAutoStrategyPreset,
} from "@/app/supply-demand/admin/listingAutoPolicy";
import type { ListingAutoStrategyProfile } from "@/app/types/stock";

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
  const initialIssueMode = createInstrumentForm.watch("initialIssueMode");
  const tradableShareRatePercent = Number(createInstrumentForm.watch("tradableShareRatePercent"));
  const targetHoldingQuantity = String(createInstrumentForm.watch("listingAutoTargetHoldingQuantity") ?? "0");
  const operationMode = createInstrumentForm.watch("listingAutoOperationMode");
  const strategyProfile = createInstrumentForm.watch("listingAutoStrategyProfile");
  const validIssuedShares = Number.isSafeInteger(issuedShares) && issuedShares > 0 ? issuedShares : 0;
  const hasValidTradableRate = Number.isFinite(tradableShareRatePercent)
    && tradableShareRatePercent >= 20
    && tradableShareRatePercent <= 85;
  const tradableShares = hasValidTradableRate
    ? Math.floor(validIssuedShares * tradableShareRatePercent / 100)
    : 0;
  const lockedShares = hasValidTradableRate ? Math.max(0, validIssuedShares - tradableShares) : 0;

  const applyStrategyProfile = (profile: ListingAutoStrategyProfile) => {
    const preset = listingAutoStrategyPreset(profile);
    createInstrumentForm.setValue("listingAutoStrategyProfile", profile, { shouldDirty: true, shouldValidate: true });
    createInstrumentForm.setValue("listingAutoTargetSpreadTicks", preset.targetSpreadTicks, { shouldDirty: true, shouldValidate: true });
    createInstrumentForm.setValue("listingAutoInventorySkewTicks", preset.inventorySkewTicks, { shouldDirty: true, shouldValidate: true });
    createInstrumentForm.setValue("listingAutoMinimumProfitRate", preset.minimumProfitRate, { shouldDirty: true, shouldValidate: true });
    createInstrumentForm.setValue("listingAutoAggressiveUnwindThreshold", preset.aggressiveUnwindThreshold, { shouldDirty: true, shouldValidate: true });
    createInstrumentForm.setValue("listingAutoAggressiveOrderRatio", preset.aggressiveOrderRatio, { shouldDirty: true, shouldValidate: true });
  };

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
          <DarkFormSelect label="발행 방식" registration={createInstrumentForm.register("initialIssueMode")} className="sm:col-span-2">
            <option value="SCALED_ROLE_SEPARATED">역할 분리형 · 권장</option>
            <option value="LEGACY_FULL_FLOAT">기존 100% 유통 · 호환용</option>
          </DarkFormSelect>
          {initialIssueMode === "SCALED_ROLE_SEPARATED" ? (
            <>
              <DarkFormInput
                label="초기 유통비율(%)"
                registration={createInstrumentForm.register("tradableShareRatePercent")}
                placeholder="50"
                error={createInstrumentForm.formState.errors.tradableShareRatePercent?.message}
              />
              <div className="rounded-md border border-admin-accent/25 bg-admin-accent/[0.07] px-3 py-2.5 text-[11px] font-bold leading-5 text-stock-subtle">
                <p className="text-white">
                  {hasValidTradableRate
                    ? `유통 ${tradableShares.toLocaleString()}주 · 보관 ${lockedShares.toLocaleString()}주`
                    : "유통비율 입력값을 확인해 주세요."}
                </p>
                <p className="mt-1">유통분과 잠금분은 각각 비거래 보관계정에 적재하며 인수계약과 LP가 준비될 때까지 시장을 열지 않습니다.</p>
              </div>
            </>
          ) : (
            <div className="rounded-md border border-admin-warning/25 bg-admin-warning-surface px-3 py-2.5 text-[11px] font-bold leading-5 text-admin-warning sm:col-span-2">
              기존 데이터·회귀 시험용 경로입니다. 발행량 전부를 유통시키고 아래 자동계정을 함께 생성합니다.
            </div>
          )}
        </div>
      </InitialIssueSection>

      {initialIssueMode === "LEGACY_FULL_FLOAT" ? (
        <>
          <InitialIssueSection title="기존 주관사 운용" description="100% 유통 호환 경로에서만 생성할 자동계정의 목적과 기본 전략을 정합니다.">
            <div className="grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
              <DarkFormSelect label="운용 목적" registration={createInstrumentForm.register("listingAutoOperationMode", {
                onChange: (event) => {
                  if (event.target.value !== "UNDERWRITER_RETURN") {
                    createInstrumentForm.setValue("listingAutoPositionSide", "TWO_SIDED", { shouldDirty: true, shouldValidate: true });
                  }
                },
              })}>
                {LISTING_AUTO_OPERATION_MODES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
              </DarkFormSelect>
              <DarkFormSelect label="전략 프리셋" registration={createInstrumentForm.register("listingAutoStrategyProfile", {
                onChange: (event) => applyStrategyProfile(event.target.value as ListingAutoStrategyProfile),
              })}>
                {LISTING_AUTO_STRATEGY_PROFILES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
              </DarkFormSelect>
              <div className="rounded-md border border-white/10 bg-black/20 px-3 py-2.5 text-[11px] font-bold leading-5 text-stock-subtle sm:col-span-2">
                <p className="text-admin-muted">{LISTING_AUTO_OPERATION_MODES.find((item) => item.value === operationMode)?.description}</p>
                <p className="mt-1">{LISTING_AUTO_STRATEGY_PROFILES.find((item) => item.value === strategyProfile)?.description}</p>
              </div>
            </div>
          </InitialIssueSection>

          <InitialIssueSection title="최초 재고 목표" description="전체 발행량 중 기존 자동계정에 남길 재고와 호가 공급 한도를 설정합니다.">
            <div className="grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <input type="hidden" {...createInstrumentForm.register("listingAutoTargetHoldingQuantity")} />
              <AdminTargetHoldingPercentageControl
                issuedShares={validIssuedShares}
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
              <DarkFormInput label="주문 1건 최대 수량" registration={createInstrumentForm.register("listingAutoMaxOrderQuantity")} placeholder="100" error={createInstrumentForm.formState.errors.listingAutoMaxOrderQuantity?.message} />
            </div>
          </InitialIssueSection>

          <details className="group min-w-0 rounded-md border border-white/10 bg-white/[0.025]">
            <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 marker:hidden">
              <span className="min-w-0">
                <span className="block text-sm font-black text-white">기존 호가·위험 정책</span>
                <span className="mt-0.5 block text-[11px] font-bold text-stock-subtle">호환 경로의 자동호가 세부값입니다.</span>
              </span>
              <span aria-hidden="true" className="shrink-0 text-admin-accent transition-transform group-open:rotate-180">⌄</span>
            </summary>
            <div className="grid min-w-0 gap-3 border-t border-white/10 p-4 sm:grid-cols-2 lg:grid-cols-4">
              <DarkFormInput label="호가 TTL(시뮬 초)" registration={createInstrumentForm.register("listingAutoOrderTtlSeconds")} placeholder="90" error={createInstrumentForm.formState.errors.listingAutoOrderTtlSeconds?.message} />
              <DarkFormInput label="호가 사다리 깊이(틱)" registration={createInstrumentForm.register("listingAutoPriceOffsetTicks")} placeholder="3" error={createInstrumentForm.formState.errors.listingAutoPriceOffsetTicks?.message} />
              <DarkFormInput label="목표 스프레드(틱)" registration={createInstrumentForm.register("listingAutoTargetSpreadTicks")} placeholder="8" error={createInstrumentForm.formState.errors.listingAutoTargetSpreadTicks?.message} />
              <DarkFormInput label="최대 재고 보정(틱)" registration={createInstrumentForm.register("listingAutoInventorySkewTicks")} placeholder="3" error={createInstrumentForm.formState.errors.listingAutoInventorySkewTicks?.message} />
              <DarkFormInput label="평시 매도 최소 이익률(%)" registration={createInstrumentForm.register("listingAutoMinimumProfitRate")} placeholder="1" error={createInstrumentForm.formState.errors.listingAutoMinimumProfitRate?.message} />
              <DarkFormInput label="공격 주문 시작 재고비율(0~1)" registration={createInstrumentForm.register("listingAutoAggressiveUnwindThreshold")} placeholder="1" error={createInstrumentForm.formState.errors.listingAutoAggressiveUnwindThreshold?.message} />
              <DarkFormInput label="공격 주문 최대 비율(0~1)" registration={createInstrumentForm.register("listingAutoAggressiveOrderRatio")} placeholder="0" error={createInstrumentForm.formState.errors.listingAutoAggressiveOrderRatio?.message} />
            </div>
          </details>
        </>
      ) : null}

      <div className="flex flex-col gap-2 border-t border-white/10 pt-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[11px] font-bold leading-5 text-admin-placeholder">
          {initialIssueMode === "SCALED_ROLE_SEPARATED"
            ? "종목과 유통 대기·잠금 배정원장만 만들고 CLOSED로 대기합니다. 인수계약 생성과 LP 전환은 역할별 탭에서 각각 진행합니다."
            : "종목과 기존 상장주관사 자동계정을 함께 만드는 호환 경로입니다."}
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
