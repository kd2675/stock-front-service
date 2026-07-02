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
  setMessage,
  setReportSymbol,
}: {
  queryClient: QueryClient;
  reportSymbolRef: MutableRefObject<string>;
  setActionSymbol: (symbol: string) => void;
  setMessage: AdminActionMessageSetter;
  setReportSymbol: (symbol: string) => void;
}) {
  const createInstrumentForm = useForm<CreateInstrumentFormValues, unknown, CreateInstrumentPayload>({
    resolver: zodResolver(createInstrumentSchema),
    defaultValues: DEFAULT_CREATE_INSTRUMENT_FORM_VALUES,
  });

  const createInstrumentMutation = useMutation({
    ...createOrderBookInstrumentMutationOptions(),
    onSuccess: async (instrument) => {
      createInstrumentForm.reset(DEFAULT_CREATE_INSTRUMENT_FORM_VALUES);
      setActionSymbol(instrument.symbol);
      reportSymbolRef.current = instrument.symbol;
      setReportSymbol(instrument.symbol);
      setMessage("주식 이벤트를 적용했습니다. 신규 상장과 상장주관사 자동계정을 생성했습니다.");
      await invalidateAdminInitialIssueQueries(queryClient, instrument.symbol);
    },
    onError: (error) => {
      setMessage(getAdminUnknownErrorMessage(error, "주문장 종목 생성에 실패했습니다."));
    },
  });

  const submitInstrument = createInstrumentForm.handleSubmit(
    (values) => {
      createInstrumentMutation.mutate({
        symbol: values.symbol,
        name: values.name,
        market: values.market || DEFAULT_CREATE_INSTRUMENT_FORM_VALUES.market,
        initialPrice: values.initialPrice,
        issuedShares: values.issuedShares,
        tickSize: values.tickSize,
        priceLimitRate: values.priceLimitRate,
        listingAutoAccount: {
          displayName: optionalText(values.listingAutoDisplayName ?? "") ?? undefined,
          enabled: values.listingAutoEnabled === "true",
          positionSide: values.listingAutoPositionSide,
          maxOrderQuantity: values.listingAutoMaxOrderQuantity,
          orderTtlSeconds: values.listingAutoOrderTtlSeconds,
          priceOffsetTicks: values.listingAutoPriceOffsetTicks,
        },
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
