import type { QueryClient } from "@tanstack/react-query";

import { calculateChangeRate } from "@/app/lib/priceMath";
import { stockKeys } from "@/app/lib/react-query/stockKeys";
import type {
  BatchJobRuntimeStatus,
  InstitutionPortfolio,
  LiquidityProviderMandate,
  Price,
  PriceStreamEvent,
  PriceTick,
  StockBatchJobRun,
  UnderwritingContract,
} from "@/app/types/stock";

export function setBatchRuntimeControlQueryData(
  queryClient: QueryClient,
  nextControl: BatchJobRuntimeStatus,
) {
  queryClient.setQueryData<BatchJobRuntimeStatus[]>(
    stockKeys.batchJobRuntimeControls(),
    (controls) => controls?.map((control) =>
      control.jobName === nextControl.jobName ? nextControl : control,
    ) ?? [nextControl],
  );
}

export function setLatestManualCashFlowRunQueryData(
  queryClient: QueryClient,
  latestRun: StockBatchJobRun,
) {
  queryClient.setQueryData<StockBatchJobRun>(stockKeys.latestManualCashFlowRun(), latestRun);
}

export function setInstitutionPortfoliosQueryData(
  queryClient: QueryClient,
  portfolios: InstitutionPortfolio[],
) {
  queryClient.setQueryData<InstitutionPortfolio[]>(
    stockKeys.institutionPortfolios(),
    portfolios,
  );
}

export function upsertLiquidityProviderMandateQueryData(
  queryClient: QueryClient,
  nextMandate: LiquidityProviderMandate,
) {
  queryClient.setQueryData<LiquidityProviderMandate[]>(
    stockKeys.liquidityProviderMandates(),
    (current = []) => [
      ...current.filter((mandate) => mandate.mandateId !== nextMandate.mandateId),
      nextMandate,
    ].sort((left, right) => left.symbol.localeCompare(right.symbol)),
  );
}

export function upsertUnderwritingContractQueryData(
  queryClient: QueryClient,
  nextContract: UnderwritingContract,
) {
  queryClient.setQueryData<UnderwritingContract[]>(
    stockKeys.underwritingContracts(),
    (current = []) => [
      ...current.filter((contract) => contract.contractId !== nextContract.contractId),
      nextContract,
    ].sort((left, right) => left.symbol.localeCompare(right.symbol)),
  );
}

export function applyPriceStreamEventQueryData(
  queryClient: QueryClient,
  event: PriceStreamEvent,
  options: {
    selectedSymbol?: string | null;
  } = {},
) {
  queryClient.setQueryData<Price[]>(
    stockKeys.prices(),
    (currentPrices) => mergePriceStreamEvent(currentPrices ?? [], event),
  );
  if (options.selectedSymbol === event.symbol) {
    queryClient.setQueryData<PriceTick[]>(
      stockKeys.priceTicks(event.symbol),
      (currentTicks) => prependPriceTick(currentTicks ?? [], event),
    );
  }
}

function mergePriceStreamEvent(currentPrices: Price[], event: PriceStreamEvent): Price[] {
  const priceIndex = currentPrices.findIndex((price) => price.symbol === event.symbol);
  if (priceIndex < 0) {
    return currentPrices;
  }

  const nextPrices = [...currentPrices];
  const currentPrice = nextPrices[priceIndex];
  const previousClose = currentPrice.previousClose > 0 ? currentPrice.previousClose : event.currentPrice;
  nextPrices[priceIndex] = {
    ...currentPrice,
    currentPrice: event.currentPrice,
    changeRate: calculateChangeRate(event.currentPrice, previousClose),
    priceTime: event.priceTime,
    provider: event.provider,
  };
  return nextPrices;
}

function prependPriceTick(currentTicks: PriceTick[], event: PriceStreamEvent): PriceTick[] {
  return [
    {
      symbol: event.symbol,
      price: event.currentPrice,
      provider: event.provider,
      priceTime: event.priceTime,
    },
    ...currentTicks.filter((tick) => tick.priceTime !== event.priceTime || tick.price !== event.currentPrice),
  ].slice(0, 100);
}
