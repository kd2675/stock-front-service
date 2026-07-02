export type AdminPayloadFailure = {
  ok: false;
  message: string;
};

export type AdminPayloadResult<TSuccess extends { ok: true }> = TSuccess | AdminPayloadFailure;
