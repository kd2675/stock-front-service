import { useState } from "react";

export function useAdminUserCashAdjustmentDraftState() {
  const [userKey, setUserKey] = useState("");
  const [amount, setAmount] = useState("");
  const [fundFlowUserKey, setFundFlowUserKey] = useState<string | null>(null);

  return {
    amount,
    clearAmount: () => setAmount(""),
    fundFlowUserKey,
    setAmount,
    setFundFlowUserKey,
    setUserKey,
    userKey,
  };
}
