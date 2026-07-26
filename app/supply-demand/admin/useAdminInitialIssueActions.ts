import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import type { QueryClient } from "@tanstack/react-query";
import type { MutableRefObject } from "react";
import { useForm } from "react-hook-form";

import { invalidateAdminInitialIssueQueries } from "@/app/lib/react-query/stockInvalidations";
import { createOrderBookInstrumentMutationOptions } from "@/app/lib/react-query/stockMutations";
import { resolveFirstFieldErrorMessage } from "@/app/lib/validation/formErrors";
import {
  createInstrumentSchema,
  type CreateInstrumentPayload,
  type CreateInstrumentFormValues,
} from "@/app/lib/validation/adminSchemas";
import {
  DEFAULT_CREATE_INSTRUMENT_FORM_VALUES,
} from "@/app/supply-demand/admin/AdminConstants";
import { getAdminUnknownErrorMessage } from "@/app/supply-demand/admin/AdminActionResultHelpers";
import type { AdminActionMessageSetter } from "@/app/supply-demand/admin/AdminActionTypes";
import { optionalText } from "@/app/supply-demand/admin/AdminPayloadTextHelpers";

export function useAdminInitialIssueActions({
  queryClient,
  reportSymbolRef,
  setActionSymbol,
  setHistorySymbol,
  setMessage,
  setReportSymbol,
}: {
  queryClient: QueryClient;
  reportSymbolRef: MutableRefObject<string>;
  setActionSymbol: (symbol: string) => void;
  setHistorySymbol: (symbol: string) => void;
  setMessage: AdminActionMessageSetter;
  setReportSymbol: (symbol: string) => void;
}) {
  const createInstrumentForm = useForm<CreateInstrumentFormValues, unknown, CreateInstrumentPayload>({
    resolver: zodResolver(createInstrumentSchema),
    defaultValues: DEFAULT_CREATE_INSTRUMENT_FORM_VALUES,
  });

  const createInstrumentMutation = useMutation({
    ...createOrderBookInstrumentMutationOptions(),
    onSuccess: async (instrument, submitted) => {
      createInstrumentForm.reset(DEFAULT_CREATE_INSTRUMENT_FORM_VALUES);
      setActionSymbol(instrument.symbol);
      setHistorySymbol(instrument.symbol);
      reportSymbolRef.current = instrument.symbol;
      setReportSymbol(instrument.symbol);
      setMessage(
        submitted.initialIssueAllocation?.mode === "SCALED_ROLE_SEPARATED"
          ? "신규 상장을 준비했습니다. 유통분은 종목별 인수계정, 비유통분은 시스템 보관계정에 분리 배정했습니다. 시장은 CLOSED로 유지되며 종목 전용 LP의 LIVE 전환 전에는 거래되지 않습니다."
          : "신규 상장을 적용했습니다. 100% 유통과 기존 상장주관사 자동계정을 생성했습니다.",
      );
      await invalidateAdminInitialIssueQueries(queryClient, instrument.symbol);
    },
    onError: (error) => {
      setMessage(getAdminUnknownErrorMessage(error, "주문장 종목 생성에 실패했습니다."));
    },
  });

  const submitInstrument = createInstrumentForm.handleSubmit(
    (values) => {
      if (values.initialIssueMode === "SCALED_ROLE_SEPARATED"
          && values.tradableShareRatePercent === undefined) {
        setMessage("초기 유통비율을 입력해 주세요.");
        return;
      }
      createInstrumentMutation.mutate({
        symbol: values.symbol,
        name: values.name,
        market: values.market || DEFAULT_CREATE_INSTRUMENT_FORM_VALUES.market,
        initialPrice: values.initialPrice,
        issuedShares: values.issuedShares,
        priceLimitRate: values.priceLimitRate,
        initialIssueAllocation: {
          mode: values.initialIssueMode,
          ...(values.initialIssueMode === "SCALED_ROLE_SEPARATED"
            ? { tradableShareRate: values.tradableShareRatePercent! / 100 }
            : {}),
        },
        listingAutoAccount: values.initialIssueMode === "LEGACY_FULL_FLOAT"
          ? {
              displayName: optionalText(values.listingAutoDisplayName ?? "") ?? undefined,
              enabled: values.listingAutoEnabled === "true",
              positionSide: values.listingAutoPositionSide,
              operationMode: values.listingAutoOperationMode,
              strategyProfile: values.listingAutoStrategyProfile,
              maxOrderQuantity: values.listingAutoMaxOrderQuantity,
              orderTtlSeconds: values.listingAutoOrderTtlSeconds,
              priceOffsetTicks: values.listingAutoPriceOffsetTicks,
              targetSpreadTicks: values.listingAutoTargetSpreadTicks,
              inventorySkewTicks: values.listingAutoInventorySkewTicks,
              minimumProfitRate: values.listingAutoMinimumProfitRate,
              aggressiveUnwindThreshold: values.listingAutoAggressiveUnwindThreshold,
              aggressiveOrderRatio: values.listingAutoAggressiveOrderRatio,
              targetBuyQuantity: values.listingAutoTargetBuyQuantity,
              targetSellQuantity: values.listingAutoTargetSellQuantity,
              targetHoldingQuantity: values.listingAutoTargetHoldingQuantity,
              inventoryBandQuantity: values.listingAutoInventoryBandQuantity,
            }
          : undefined,
      });
    },
    (errors) => {
      setMessage(resolveFirstFieldErrorMessage(errors, "종목 입력값을 확인해 주세요."));
    },
  );

  return {
    createInstrumentForm,
    creatingInitialIssue: createInstrumentMutation.isPending,
    submitInstrument,
  };
}
