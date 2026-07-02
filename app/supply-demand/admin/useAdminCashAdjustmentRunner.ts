import { useCallback, useState } from "react";

import type { CashAdjustmentType } from "@/app/supply-demand/admin/AdminCashAdjustmentPayloadHelpers";

export function useAdminCashAdjustmentRunner() {
  const [adjustingCashType, setAdjustingCashType] = useState<CashAdjustmentType | null>(null);

  const runCashAdjustment = useCallback(async (
    adjustmentType: CashAdjustmentType,
    action: () => Promise<void>,
  ) => {
    if (adjustingCashType) {
      return;
    }
    setAdjustingCashType(adjustmentType);
    try {
      await action();
    } finally {
      setAdjustingCashType(null);
    }
  }, [adjustingCashType]);

  return {
    adjustingCashType,
    runCashAdjustment,
  };
}
