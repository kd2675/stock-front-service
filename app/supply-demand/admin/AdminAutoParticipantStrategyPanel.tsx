import { parsePositiveIntegerInput } from "@/app/lib/numberParsing";
import { formatAutoIntensityFollowLevel, formatCount } from "@/app/supply-demand/admin/AdminFormatters";
import { DarkInput, DarkSelect, EnabledToggleButton } from "@/app/supply-demand/admin/AdminFormControls";
import type { AutoParticipant, AutoParticipantSymbolConfig } from "@/app/types/stock";

type AdminAutoParticipantStrategyPanelProps = {
  selectedParticipant: AutoParticipant | null;
  selectedSymbolConfigs: AutoParticipantSymbolConfig[];
  strategySymbols: string[];
  strategyUserKey: string;
  strategySymbol: string;
  strategyEnabled: boolean;
  strategyIntensity: string;
  editingStrategyKey: string | null;
  selectedStrategyKey: string;
  savingStrategy: boolean;
  togglingStrategyKey: string | null;
  onSelectStrategySymbol: (userKey: string, symbol: string) => void;
  onClearStrategy: (userKey: string) => void;
  onStrategyEnabledChange: (enabled: boolean) => void;
  onStrategyIntensityChange: (value: string) => void;
  onSubmitStrategy: () => void;
  onToggleStrategyEnabled: (config: AutoParticipantSymbolConfig) => void;
  onSelectStrategyDraft: (config: AutoParticipantSymbolConfig) => void;
};

export function AdminAutoParticipantStrategyPanel({
  selectedParticipant,
  selectedSymbolConfigs,
  strategySymbols,
  strategyUserKey,
  strategySymbol,
  strategyEnabled,
  strategyIntensity,
  editingStrategyKey,
  selectedStrategyKey,
  savingStrategy,
  togglingStrategyKey,
  onSelectStrategySymbol,
  onClearStrategy,
  onStrategyEnabledChange,
  onStrategyIntensityChange,
  onSubmitStrategy,
  onToggleStrategyEnabled,
  onSelectStrategyDraft,
}: AdminAutoParticipantStrategyPanelProps) {
  if (!selectedParticipant) {
    return null;
  }

  return (
    <div className="mt-4 rounded-lg border border-white/10 bg-black/20 p-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-black text-white">종목별 추종 강도</p>
          <p className="mt-1 text-xs font-bold text-[#8b95a1]">
            {selectedParticipant.displayName}에게만 적용되는 종목별 강도입니다. 10은 그날 정해진 방향을 적극적으로 따르고, 1은 소극적으로 움직입니다.
          </p>
        </div>
        <span className="rounded-md bg-white/10 px-2 py-1 text-xs font-black text-[#64a8ff]">
          {formatCount(selectedSymbolConfigs.length, "개 설정")}
        </span>
      </div>
      <div className="mt-3 grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_0.8fr_0.8fr_0.9fr_auto]">
        <DarkSelect
          label="종목"
          value={strategyUserKey === selectedParticipant.userKey ? strategySymbol : ""}
          onChange={(value) => {
            if (!value) {
              onClearStrategy(selectedParticipant.userKey);
              return;
            }
            onSelectStrategySymbol(selectedParticipant.userKey, value);
          }}
        >
          <option value="">선택</option>
          {strategySymbols.map((symbol) => (
            <option key={symbol} value={symbol}>{symbol}</option>
          ))}
        </DarkSelect>
        <DarkSelect label="가동 상태" value={strategyEnabled ? "true" : "false"} onChange={(value) => onStrategyEnabledChange(value === "true")}>
          <option value="true">가동</option>
          <option value="false">정지</option>
        </DarkSelect>
        <DarkInput label="추종 강도(1-10)" value={strategyIntensity} onChange={onStrategyIntensityChange} placeholder="10" />
        <div className="grid gap-1 text-xs font-bold text-[#b8c2cc]">
          추종 성향
          <div className="rounded-md border border-white/10 bg-[#161b21] px-3 py-3 text-sm font-black text-white">
            {formatAutoIntensityFollowLevel(parsePositiveIntegerInput(strategyIntensity) ?? 0)}
          </div>
        </div>
        <button type="button" onClick={onSubmitStrategy} disabled={savingStrategy} className="min-h-11 self-end rounded-md bg-white px-3 py-3 text-sm font-black text-[#101418] disabled:opacity-50 sm:col-span-2 lg:col-span-1">
          {savingStrategy ? "저장 중" : editingStrategyKey === selectedStrategyKey ? "추종 강도 저장" : "추종 강도 추가"}
        </button>
      </div>
      <div className="mt-3 overflow-x-auto rounded-md border border-white/10">
        <table className="min-w-[640px] w-full border-collapse text-sm">
          <thead className="bg-white/10 text-left text-[#b8c2cc]">
            <tr>
              <th className="px-3 py-2">종목</th>
              <th className="px-3 py-2">상태</th>
              <th className="px-3 py-2">추종 성향</th>
              <th className="px-3 py-2">추종 강도</th>
              <th className="px-3 py-2">수정</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {selectedSymbolConfigs.map((config) => {
              const rowKey = `${config.userKey}:${config.symbol}`;
              return (
                <tr key={rowKey} className={editingStrategyKey === rowKey ? "bg-[#10233a]/50" : undefined}>
                  <td className="px-3 py-2 font-black">{config.symbol}</td>
                  <td className="px-3 py-2">
                    <EnabledToggleButton
                      enabled={config.enabled}
                      disabled={togglingStrategyKey === rowKey}
                      onToggle={() => onToggleStrategyEnabled(config)}
                    />
                  </td>
                  <td className="px-3 py-2">{formatAutoIntensityFollowLevel(config.intensity)}</td>
                  <td className="px-3 py-2 tabular-nums">{config.intensity}/10</td>
                  <td className="px-3 py-2">
                    <button type="button" onClick={() => onSelectStrategyDraft(config)} className="rounded-md bg-white/10 px-2 py-1 text-xs font-black text-white">
                      값 불러오기
                    </button>
                  </td>
                </tr>
              );
            })}
            {selectedSymbolConfigs.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-3 py-4 text-[#8b95a1]">이 참여자에게 지정된 종목별 추종 강도가 없습니다. 종목을 선택해 추가하세요.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
