import type { Dispatch, SetStateAction } from "react";

export type RequireAdminToken = (missingTokenMessage: string) => Promise<string | null>;

export type AdminActionMessageSetter = Dispatch<SetStateAction<string | null>>;
