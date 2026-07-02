import { useMemo } from "react";

import {
  buildProfileConfigMap,
  buildSymbolMap,
  resolveParticipantStrategyKey,
  resolveSelectedAutoParticipant,
  resolveSelectedAutoParticipantSymbolConfigs,
  resolveSelectedListingAutoAccount,
  resolveSelectedProfileConfig,
} from "@/app/supply-demand/admin/AdminSelectionHelpers";
import type {
  AutoParticipant,
  AutoParticipantProfileConfig,
  AutoParticipantSymbolConfig,
  ListingAutoAccount,
  OrderBookMarketStatus,
} from "@/app/types/stock";

export function useAdminSelectionState({
  autoParticipantSymbolConfigs,
  autoParticipants,
  editingAutoParticipantUserKey,
  editingProfileType,
  listingAutoAccounts,
  listingAutoSymbol,
  orderBookConfigs,
  profileConfigs,
  strategySymbol,
}: {
  autoParticipantSymbolConfigs: AutoParticipantSymbolConfig[];
  autoParticipants: AutoParticipant[];
  editingAutoParticipantUserKey: string | null;
  editingProfileType: string | null;
  listingAutoAccounts: ListingAutoAccount[];
  listingAutoSymbol: string;
  orderBookConfigs: OrderBookMarketStatus["configs"];
  profileConfigs: AutoParticipantProfileConfig[];
  strategySymbol: string;
}) {
  const orderBookConfigBySymbol = useMemo<Map<string, OrderBookMarketStatus["configs"][number]>>(
    () => buildSymbolMap(orderBookConfigs),
    [orderBookConfigs],
  );

  const selectedListingAutoAccount = useMemo(
    () => resolveSelectedListingAutoAccount(listingAutoAccounts, listingAutoSymbol),
    [listingAutoAccounts, listingAutoSymbol],
  );

  const profileConfigByType = useMemo(
    () => buildProfileConfigMap(profileConfigs),
    [profileConfigs],
  );

  const selectedAutoParticipant = useMemo(
    () => resolveSelectedAutoParticipant(autoParticipants, editingAutoParticipantUserKey),
    [autoParticipants, editingAutoParticipantUserKey],
  );

  const selectedAutoParticipantSymbolConfigs = useMemo(
    () => resolveSelectedAutoParticipantSymbolConfigs(autoParticipantSymbolConfigs, selectedAutoParticipant),
    [autoParticipantSymbolConfigs, selectedAutoParticipant],
  );

  const selectedProfileConfig = useMemo(
    () => resolveSelectedProfileConfig(profileConfigs, editingProfileType),
    [editingProfileType, profileConfigs],
  );

  return {
    orderBookConfigBySymbol,
    profileConfigByType,
    selectedAutoParticipant,
    selectedAutoParticipantSymbolConfigs,
    selectedListingAutoAccount,
    selectedParticipantStrategyKey: resolveParticipantStrategyKey(selectedAutoParticipant, strategySymbol),
    selectedProfileConfig,
  };
}
