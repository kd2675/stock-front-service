import type {
  AutoParticipant,
  AutoParticipantOverview,
  AutoParticipantProfileConfig,
  AutoParticipantProfileType,
  AutoParticipantSymbolConfig,
  ListingAutoAccount,
  OrderBookInstrument,
  OrderBookMarketStatus,
} from "@/app/types/stock";
import { normalizeOrderBookSymbol } from "@/app/supply-demand/admin/AdminPayloadTextHelpers";

export function buildSymbolMap<T extends { symbol: string }>(items: T[]) {
  const map = new Map<string, T>();
  items.forEach((item) => {
    map.set(item.symbol, item);
  });
  return map;
}

export function buildProfileConfigMap(configs: AutoParticipantProfileConfig[]) {
  return new Map<AutoParticipantProfileType, AutoParticipantProfileConfig>(
    configs.map((config) => [config.profileType, config]),
  );
}

export function resolveSelectedProfileConfig(configs: AutoParticipantProfileConfig[], profileType: string | null) {
  if (profileType === null) {
    return null;
  }
  return configs.find((config) => config.profileType === profileType) ?? null;
}

export function buildAutoParticipantOverviewMap(overviews: AutoParticipantOverview[]) {
  return new Map(overviews.map((overview) => [overview.userKey, overview]));
}

export function resolveSelectedListingAutoAccount(accounts: ListingAutoAccount[], symbol: string) {
  return accounts.find((account) => account.symbol === symbol) ?? null;
}

export function resolveSelectedAutoParticipant(participants: AutoParticipant[], userKey: string | null) {
  if (userKey === null) {
    return null;
  }
  return participants.find((participant) => participant.userKey === userKey) ?? null;
}

export function resolveSelectedAutoParticipantSymbolConfigs(
  configs: AutoParticipantSymbolConfig[],
  participant: AutoParticipant | null,
) {
  if (participant === null) {
    return [];
  }
  return configs.filter((config) => config.userKey === participant.userKey);
}

export function resolveParticipantStrategyKey(participant: AutoParticipant | null, symbol: string) {
  return participant === null ? "" : `${participant.userKey}:${symbol}`;
}

export function resolveOpenOrderBookConfigCount(options: {
  summary: OrderBookMarketStatus | null;
  fallback: OrderBookMarketStatus | null;
  configs: OrderBookMarketStatus["configs"];
}) {
  return options.summary?.openConfigCount
    ?? options.fallback?.openConfigCount
    ?? options.configs.filter((config) => config.enabled && config.marketStatus === "OPEN").length;
}

export function resolveOrderBookInstrumentCount(options: {
  summary: OrderBookMarketStatus | null;
  fallback: OrderBookMarketStatus | null;
  instruments: OrderBookInstrument[];
}) {
  return options.summary?.instrumentCount
    ?? options.fallback?.instrumentCount
    ?? options.instruments.length;
}

export function resolveParticipantUserKeys(participants: AutoParticipant[]) {
  return participants.map((participant) => participant.userKey);
}

export function isKnownOrderBookSymbol(instruments: OrderBookInstrument[], symbol: string) {
  const normalizedSymbol = normalizeOrderBookSymbol(symbol);
  return Boolean(normalizedSymbol) && instruments.some((instrument) => instrument.symbol === normalizedSymbol);
}
