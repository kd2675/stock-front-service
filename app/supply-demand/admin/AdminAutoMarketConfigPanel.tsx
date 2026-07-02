import { Fragment } from "react";

import { formatAutoIntensityDirection } from "@/app/supply-demand/admin/AdminFormatters";
import { EnabledToggleButton, DarkInput, DarkSelect } from "@/app/supply-demand/admin/AdminFormControls";
import { AutoMarketConfigGuide } from "@/app/supply-demand/admin/AdminSignalGuide";
import type { AutoMarketConfig } from "@/app/types/stock";

export type AutoMarketConfigDraft = {
  symbol: string;
  enabled: boolean;
  intensity: string;
  maxOrderQuantity: string;
  orderTtlSeconds: string;
};

export type AutoMarketConfigDraftSetters = {
  setSymbol: (value: string) => void;
  setEnabled: (value: boolean) => void;
  setIntensity: (value: string) => void;
  setMaxOrderQuantity: (value: string) => void;
  setOrderTtlSeconds: (value: string) => void;
  setEditingSymbol: (value: string | null) => void;
};

type AdminAutoMarketConfigPanelProps = {
  configs: AutoMarketConfig[];
  draft: AutoMarketConfigDraft;
  draftSetters: AutoMarketConfigDraftSetters;
  editingSymbol: string | null;
  updating: boolean;
  togglingSymbol: string | null;
  onSelectDraft: (config: AutoMarketConfig) => void;
  onSubmit: () => void;
  onToggleEnabled: (config: AutoMarketConfig) => void;
};

export function AdminAutoMarketConfigPanel({
  configs,
  draft,
  draftSetters,
  editingSymbol,
  updating,
  togglingSymbol,
  onSelectDraft,
  onSubmit,
  onToggleEnabled,
}: AdminAutoMarketConfigPanelProps) {
  return (
    <section className="mt-5 rounded-lg border border-white/10 bg-white/[0.06] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-black">종목별 자동장 기본값</h2>
          <p className="mt-1 text-xs font-bold text-[#8b95a1]">자동참여자가 종목별 주문을 만들 때 먼저 적용하는 기본 방향, 주문 수량 상한, 미체결 유지 시간입니다.</p>
        </div>
        <span className="text-xs font-bold text-[#64a8ff]">batch 자동 주문 생성 기준</span>
      </div>
      <div className="mt-4 grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_0.8fr_0.8fr_0.8fr_0.8fr_auto]">
        <DarkSelect label="자동장 대상 종목" value={draft.symbol} onChange={(value) => {
          const config = configs.find((item) => item.symbol === value);
          if (config) {
            onSelectDraft(config);
            return;
          }
          draftSetters.setSymbol(value);
        }}>
          <option value="">선택</option>
          {configs.map((config) => (
            <option key={config.symbol} value={config.symbol}>{config.symbol}</option>
          ))}
        </DarkSelect>
        <DarkSelect label="자동 주문 생성" value={draft.enabled ? "true" : "false"} onChange={(value) => draftSetters.setEnabled(value === "true")}>
          <option value="true">가동</option>
          <option value="false">정지</option>
        </DarkSelect>
        <DarkInput label="기본 방향 강도(1-10)" value={draft.intensity} onChange={draftSetters.setIntensity} placeholder="10" />
        <DarkInput label="1회 주문 최대 수량" value={draft.maxOrderQuantity} onChange={draftSetters.setMaxOrderQuantity} placeholder="4" />
        <DarkInput label="미체결 호가 TTL(초)" value={draft.orderTtlSeconds} onChange={draftSetters.setOrderTtlSeconds} placeholder="15" />
        <button type="button" onClick={onSubmit} disabled={updating} className="min-h-11 min-w-0 self-end rounded-md bg-white px-3 py-3 text-sm font-black text-[#101418] disabled:opacity-50 sm:col-span-2 lg:col-span-1">
          {updating ? "저장 중" : "저장"}
        </button>
      </div>
      <p className="mt-2 text-xs font-bold leading-5 text-[#8b95a1]">
        미체결 호가 TTL은 실제 서버 시간이 아니라 시뮬레이션 시간 기준입니다. 예: 시뮬레이션 하루가 현실 2시간이면 TTL 60초는 현실 약 5초 후 만료됩니다.
      </p>
      <AutoMarketConfigGuide />
      <div className="mt-4 overflow-x-auto rounded-md border border-white/10">
        <table className="min-w-[760px] w-full border-collapse text-sm">
          <thead className="bg-white/10 text-left text-[#b8c2cc]">
            <tr>
              <th className="px-3 py-2">종목</th>
              <th className="px-3 py-2">자동 주문 생성</th>
              <th className="px-3 py-2">기본 가격 방향</th>
              <th className="px-3 py-2">기본 방향 강도</th>
              <th className="px-3 py-2">1회 주문 최대 수량</th>
              <th className="px-3 py-2">미체결 호가 TTL</th>
              <th className="px-3 py-2">수정</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {configs.map((config) => (
              <Fragment key={config.symbol}>
                <tr>
                  <td className="px-3 py-2 font-black">{config.symbol}</td>
                  <td className="px-3 py-2">
                    <EnabledToggleButton
                      enabled={config.enabled}
                      disabled={togglingSymbol === config.symbol}
                      onToggle={() => onToggleEnabled(config)}
                    />
                  </td>
                  <td className="px-3 py-2">{formatAutoIntensityDirection(config.intensity)}</td>
                  <td className="px-3 py-2 tabular-nums">{config.intensity}/10</td>
                  <td className="px-3 py-2 tabular-nums">{config.maxOrderQuantity}주</td>
                  <td className="px-3 py-2 tabular-nums">{config.orderTtlSeconds}초</td>
                  <td className="px-3 py-2">
                    <button type="button" onClick={() => onSelectDraft(config)} className="rounded-md bg-white/10 px-2 py-1 text-xs font-black text-white">
                      수정
                    </button>
                  </td>
                </tr>
                {editingSymbol === config.symbol ? (
                  <tr>
                    <td colSpan={7} className="bg-black/20 px-3 py-3">
                      <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[0.9fr_0.9fr_0.9fr_auto_auto]">
                        <DarkSelect label="자동 주문 생성" value={draft.enabled ? "true" : "false"} onChange={(value) => draftSetters.setEnabled(value === "true")}>
                          <option value="true">가동</option>
                          <option value="false">정지</option>
                        </DarkSelect>
                        <DarkInput label="기본 방향 강도(1-10)" value={draft.intensity} onChange={draftSetters.setIntensity} placeholder="10" />
                        <DarkInput label="1회 주문 최대 수량" value={draft.maxOrderQuantity} onChange={draftSetters.setMaxOrderQuantity} placeholder="4" />
                        <DarkInput label="미체결 호가 TTL(초)" value={draft.orderTtlSeconds} onChange={draftSetters.setOrderTtlSeconds} placeholder="15" />
                        <div className="grid grid-cols-2 gap-2 self-end">
                          <button type="button" onClick={onSubmit} disabled={updating} className="min-h-11 rounded-md bg-white px-3 py-3 text-sm font-black text-[#101418] disabled:opacity-50">
                            {updating ? "저장 중" : "저장"}
                          </button>
                          <button type="button" onClick={() => draftSetters.setEditingSymbol(null)} className="min-h-11 rounded-md bg-white/10 px-3 py-3 text-sm font-black text-white">
                            닫기
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : null}
              </Fragment>
            ))}
            {configs.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-3 py-4 text-[#8b95a1]">자동장 설정 대상 종목이 없습니다.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}
