import { parsePositiveIntegerInput } from "@/app/lib/numberParsing";
import { formatAutoStrategyActivityLevel, formatCount } from "@/app/supply-demand/admin/AdminFormatters";
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
          <p className="text-sm font-black text-white">종목별 주문 활동 강도</p>
          <p className="mt-1 text-xs font-bold text-[#8b95a1]">
            {selectedParticipant.displayName}에게만 적용되는 주문 생성 활동도입니다. 값이 클수록 주문 횟수와 가격 반응이 적극적이며, 주문 방향은 별도의 압력·보고서·프로필 신호가 정합니다.
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
        <DarkInput label="주문 활동 강도(1-10)" value={strategyIntensity} onChange={onStrategyIntensityChange} placeholder="5" />
        <div className="grid gap-1 text-xs font-bold text-[#b8c2cc]">
          활동 수준
          <div className="rounded-md border border-white/10 bg-[#161b21] px-3 py-3 text-sm font-black text-white">
            {formatAutoStrategyActivityLevel(parsePositiveIntegerInput(strategyIntensity) ?? 0)}
          </div>
        </div>
        <button type="button" onClick={onSubmitStrategy} disabled={savingStrategy} className="min-h-11 self-end rounded-md bg-white px-3 py-3 text-sm font-black text-[#101418] disabled:opacity-50 sm:col-span-2 lg:col-span-1">
          {savingStrategy ? "저장 중" : editingStrategyKey === selectedStrategyKey ? "활동 강도 저장" : "활동 강도 추가"}
        </button>
      </div>
      <div className="mt-3 grid gap-2 text-xs font-bold leading-5 text-[#8b95a1] lg:grid-cols-3">
        <div className="rounded-md bg-white/[0.04] px-3 py-2.5">
          <span className="font-black text-white">주문 건수</span>
          <p className="mt-0.5">1-3은 보통 1건, 4-7은 2건, 8-10은 3건에서 시작하며 프로필과 유동성 압력에 따라 0-8건으로 최종 조정됩니다.</p>
        </div>
        <div className="rounded-md bg-white/[0.04] px-3 py-2.5">
          <span className="font-black text-white">가격 반응</span>
          <p className="mt-0.5">활동 강도 1은 가격 압력의 약 10%, 10은 약 100%를 호가 계산에 반영합니다. 강도가 높아도 압력이 0이면 방향을 만들지 않습니다.</p>
        </div>
        <div className="rounded-md bg-white/[0.04] px-3 py-2.5">
          <span className="font-black text-white">기본값·프로필 보정</span>
          <p className="mt-0.5">설정이 없으면 5입니다. 보고서 점수로 유효 강도를 보정한 뒤 프로필별 주문·공격성 배율과 매 주문 노이즈를 별도로 적용합니다.</p>
        </div>
      </div>
      <div className="mt-3 overflow-x-auto rounded-md border border-white/10">
        <table className="min-w-[640px] w-full border-collapse text-sm">
          <thead className="bg-white/10 text-left text-[#b8c2cc]">
            <tr>
              <th className="px-3 py-2">종목</th>
              <th className="px-3 py-2">상태</th>
              <th className="px-3 py-2">활동 수준</th>
              <th className="px-3 py-2">활동 강도</th>
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
                  <td className="px-3 py-2">{formatAutoStrategyActivityLevel(config.intensity)}</td>
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
                <td colSpan={5} className="px-3 py-4 text-[#8b95a1]">이 참여자에게 지정된 종목별 주문 활동 강도가 없습니다. 종목을 선택해 추가하세요.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
