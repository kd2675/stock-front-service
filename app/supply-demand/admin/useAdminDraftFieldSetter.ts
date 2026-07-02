import { useCallback, type Dispatch, type SetStateAction } from "react";

export function useAdminDraftFieldSetter<TDraft extends object>(
  setDraft: Dispatch<SetStateAction<TDraft>>,
) {
  return useCallback(<K extends keyof TDraft>(key: K, value: TDraft[K]) => {
    setDraft((previous) => ({
      ...previous,
      [key]: value,
    }));
  }, [setDraft]);
}
