import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { AuthUser } from "@/app/types/auth";

export type AuthStatus = "unknown" | "in" | "out";

type AuthState = {
  status: AuthStatus;
  user: AuthUser | null;
  isHydrated: boolean;
};

const initialState: AuthState = {
  status: "unknown",
  user: null,
  isHydrated: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setAuthSnapshot(
      state,
      action: PayloadAction<{
        status: AuthStatus;
        user: AuthUser | null;
        isHydrated: boolean;
      }>,
    ) {
      state.status = action.payload.status;
      state.user = action.payload.user;
      state.isHydrated = action.payload.isHydrated;
    },
  },
});

export const { setAuthSnapshot } = authSlice.actions;
export default authSlice.reducer;
