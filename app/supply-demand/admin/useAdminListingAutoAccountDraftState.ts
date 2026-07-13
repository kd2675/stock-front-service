import { useCallback, useMemo, useState } from "react";

import {
  DEFAULT_LISTING_AUTO_MAX_ORDER_QUANTITY,
  DEFAULT_LISTING_AUTO_ORDER_TTL_SECONDS,
  DEFAULT_LISTING_AUTO_POSITION_SIDE,
  DEFAULT_LISTING_AUTO_PRICE_OFFSET_TICKS,
  DEFAULT_LISTING_AUTO_TARGET_BUY_QUANTITY,
  DEFAULT_LISTING_AUTO_TARGET_SELL_QUANTITY,
  DEFAULT_LISTING_AUTO_TARGET_HOLDING_QUANTITY,
  DEFAULT_LISTING_AUTO_INVENTORY_BAND_QUANTITY,
  DEFAULT_LISTING_AUTO_BUY_PRICE_OFFSET_DIRECTION,
  DEFAULT_LISTING_AUTO_SELL_PRICE_OFFSET_DIRECTION,
} from "@/app/supply-demand/admin/AdminConstants";
import { resolveListingAutoAccountConfigDraft } from "@/app/supply-demand/admin/AdminDraftHelpers";
import type {
  ListingAutoAccountDraft,
  ListingAutoAccountDraftSetters,
} from "@/app/supply-demand/admin/AdminListingAutoAccountPanel";
import { useAdminDraftFieldSetter } from "@/app/supply-demand/admin/useAdminDraftFieldSetter";
import type { ListingAutoAccount } from "@/app/types/stock";

const DEFAULT_LISTING_AUTO_ACCOUNT_DRAFT: ListingAutoAccountDraft = {
  symbol: "",
  displayName: "",
  enabled: true,
  positionSide: DEFAULT_LISTING_AUTO_POSITION_SIDE,
  maxOrderQuantity: DEFAULT_LISTING_AUTO_MAX_ORDER_QUANTITY,
  orderTtlSeconds: DEFAULT_LISTING_AUTO_ORDER_TTL_SECONDS,
  priceOffsetTicks: DEFAULT_LISTING_AUTO_PRICE_OFFSET_TICKS,
  targetBuyQuantity: DEFAULT_LISTING_AUTO_TARGET_BUY_QUANTITY,
  targetSellQuantity: DEFAULT_LISTING_AUTO_TARGET_SELL_QUANTITY,
  targetHoldingQuantity: DEFAULT_LISTING_AUTO_TARGET_HOLDING_QUANTITY,
  inventoryBandQuantity: DEFAULT_LISTING_AUTO_INVENTORY_BAND_QUANTITY,
  buyPriceOffsetDirection: DEFAULT_LISTING_AUTO_BUY_PRICE_OFFSET_DIRECTION,
  sellPriceOffsetDirection: DEFAULT_LISTING_AUTO_SELL_PRICE_OFFSET_DIRECTION,
};

export function useAdminListingAutoAccountDraftState() {
  const [editingSymbol, setEditingSymbol] = useState<string | null>(null);
  const [draft, setDraft] = useState<ListingAutoAccountDraft>(DEFAULT_LISTING_AUTO_ACCOUNT_DRAFT);
  const setDraftField = useAdminDraftFieldSetter(setDraft);

  const applyListingAutoAccountConfigDraft = useCallback((nextDraft: ReturnType<typeof resolveListingAutoAccountConfigDraft>) => {
    setDraft(nextDraft);
  }, []);

  const selectListingAutoAccountDraft = useCallback((account: ListingAutoAccount) => {
    const draft = resolveListingAutoAccountConfigDraft(account);
    setEditingSymbol(draft.symbol);
    applyListingAutoAccountConfigDraft(draft);
  }, [applyListingAutoAccountConfigDraft]);

  const draftSetters: ListingAutoAccountDraftSetters = useMemo(() => ({
    setSymbol: (value) => setDraftField("symbol", value),
    setDisplayName: (value) => setDraftField("displayName", value),
    setEnabled: (value) => setDraftField("enabled", value),
    setPositionSide: (value) => setDraftField("positionSide", value),
    setMaxOrderQuantity: (value) => setDraftField("maxOrderQuantity", value),
    setOrderTtlSeconds: (value) => setDraftField("orderTtlSeconds", value),
    setPriceOffsetTicks: (value) => setDraftField("priceOffsetTicks", value),
    setTargetBuyQuantity: (value) => setDraftField("targetBuyQuantity", value),
    setTargetSellQuantity: (value) => setDraftField("targetSellQuantity", value),
    setTargetHoldingQuantity: (value) => setDraftField("targetHoldingQuantity", value),
    setInventoryBandQuantity: (value) => setDraftField("inventoryBandQuantity", value),
    setBuyPriceOffsetDirection: (value) => setDraftField("buyPriceOffsetDirection", value),
    setSellPriceOffsetDirection: (value) => setDraftField("sellPriceOffsetDirection", value),
    setEditingSymbol,
  }), [setDraftField]);

  return {
    applyListingAutoAccountConfigDraft,
    draft,
    draftSetters,
    editingSymbol,
    selectListingAutoAccountDraft,
    setEditingSymbol,
    setSymbol: draftSetters.setSymbol,
    symbol: draft.symbol,
  };
}
