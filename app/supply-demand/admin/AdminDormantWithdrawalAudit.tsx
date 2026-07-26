import DataTableViewport from "@/app/components/DataTableViewport";
import {
  formatCount,
  formatDateTime,
  formatNumber,
  formatWon,
} from "@/app/supply-demand/admin/AdminFormatters";
import { ParticipantInfoItem } from "@/app/supply-demand/admin/AdminMetricCards";
import type { AutoParticipantWithdrawalAudit } from "@/app/types/stock";

export function AdminDormantWithdrawalAudit({
  audit,
}: {
  audit: AutoParticipantWithdrawalAudit | null;
}) {
  if (!audit) {
    return (
      <div className="mt-3 rounded-md border border-dashed border-admin-danger/30 bg-admin-danger-surface/40 px-3 py-4 text-xs font-bold text-admin-danger">
        자산 이전 감사 원장이 없습니다. 과거 소프트 탈퇴 데이터인지, 정산 트랜잭션이 완료되지 않았는지 확인해 주세요.
      </div>
    );
  }

  return (
    <section className="mt-3 rounded-md border border-white/10 bg-black/20 p-3">
      <div>
        <h4 className="text-sm font-black text-white">탈퇴 정산·보관 이전 감사</h4>
        <p className="mt-1 text-xs font-bold leading-5 text-stock-subtle">
          탈퇴 계좌에서 빠져나간 자산과 종목별 수령 계정, 현재 보관 상태를 함께 대조합니다.
        </p>
      </div>

      <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-4">
        <ParticipantInfoItem label="감사 원장">
          <p className="font-black text-white">ID {audit.withdrawalId}</p>
          <p className="mt-1 break-all text-xs font-bold text-stock-subtle">처리자 {audit.createdBy}</p>
          <p className="mt-1 text-xs font-bold text-stock-subtle">{formatDateTime(audit.createdAt)}</p>
        </ParticipantInfoItem>
        <ParticipantInfoItem label="원본 계좌">
          <p className="font-black text-white">ID {audit.sourceAccountId} · {audit.sourceAccountStatus}</p>
          <p className="mt-1 text-xs font-bold text-stock-subtle">
            잔존 현금 {formatWon(audit.sourceRemainingCashAmount)}
          </p>
          <p className="mt-1 text-xs font-bold text-stock-subtle">
            잔존 주식 {formatNumber(audit.sourceRemainingShareQuantity)}주 · 예약 {formatNumber(audit.sourceRemainingReservedShareQuantity)}주
          </p>
        </ParticipantInfoItem>
        <ParticipantInfoItem label="잔존 운영 상태">
          <p className="font-black text-white">미체결 {formatCount(audit.sourceOpenOrderCount, "건")}</p>
          <p className="mt-1 text-xs font-bold text-stock-subtle">
            미완료 기업행사 권리 {formatCount(audit.pendingCorporateActionRightCount, "건")}
          </p>
        </ParticipantInfoItem>
        <ParticipantInfoItem label="정산 합계">
          <p className="font-black text-white">회수 현금 {formatWon(audit.returnedCashAmount)}</p>
          <p className="mt-1 text-xs font-bold text-stock-subtle">
            이전 주식 {formatNumber(audit.returnedShareQuantity)}주 · {formatCount(audit.returnedSymbolCount, "종목")}
          </p>
        </ParticipantInfoItem>
      </div>

      <DataTableViewport label="종목별 보관 이전 원장" tone="dark" className="mt-3">
        <table className="min-w-[980px] w-full border-collapse text-sm">
          <thead className="bg-white/10 text-left text-admin-muted">
            <tr>
              <th className="px-3 py-2">종목</th>
              <th className="px-3 py-2">수령 역할·계정</th>
              <th className="px-3 py-2">이전 사유</th>
              <th className="px-3 py-2 text-right">이전 수량·평균가</th>
              <th className="px-3 py-2 text-right">현재 보관잔고</th>
              <th className="px-3 py-2 text-right">현재가·이전분 평가액</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {audit.shareTransfers.map((transfer) => (
              <tr key={`${audit.withdrawalId}:${transfer.symbol}`}>
                <td className="px-3 py-2 font-black text-white">{transfer.symbol}</td>
                <td className="px-3 py-2">
                  <p className="font-black text-admin-accent-soft">
                    {formatReceiverRole(transfer.receiverRole)} · ID {transfer.receiverAccountId}
                  </p>
                  <p className="mt-1 break-all text-xs font-bold text-stock-subtle">
                    {transfer.receiverUserKey} · {transfer.receiverAccountStatus}
                  </p>
                  <p className="mt-1 break-all text-[11px] font-bold text-admin-quiet">
                    자기체결 그룹 {transfer.receiverSelfTradeGroupId ?? "없음"}
                  </p>
                </td>
                <td className="px-3 py-2 font-bold text-stock-subtle">
                  {formatTransferReason(transfer.transferReason)}
                </td>
                <td className="px-3 py-2 text-right tabular-nums">
                  <p className="font-black text-white">{formatNumber(transfer.quantity)}주</p>
                  <p className="mt-1 text-xs font-bold text-stock-subtle">
                    평균 {formatWon(transfer.sourceAveragePrice)}
                  </p>
                </td>
                <td className="px-3 py-2 text-right tabular-nums">
                  <p className="font-black text-white">{formatNumber(transfer.receiverCurrentQuantity)}주</p>
                  <p className="mt-1 text-xs font-bold text-stock-subtle">
                    예약 {formatNumber(transfer.receiverReservedQuantity)}주 · 평균 {formatWon(transfer.receiverAveragePrice)}
                  </p>
                </td>
                <td className="px-3 py-2 text-right tabular-nums">
                  <p className="font-black text-white">{formatWon(transfer.currentPrice)}</p>
                  <p className="mt-1 text-xs font-bold text-stock-subtle">
                    이전분 {formatWon(transfer.transferMarketValue)}
                  </p>
                </td>
              </tr>
            ))}
            {audit.shareTransfers.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-4 text-stock-subtle">
                  이전된 주식이 없습니다. 현금만 회수했거나 원래 보유주식이 없었던 탈퇴입니다.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </DataTableViewport>
    </section>
  );
}

function formatReceiverRole(role: AutoParticipantWithdrawalAudit["shareTransfers"][number]["receiverRole"]) {
  return role === "SYSTEM_CUSTODY" ? "시스템 보관" : "과거 상장주관사 반환";
}

function formatTransferReason(reason: AutoParticipantWithdrawalAudit["shareTransfers"][number]["transferReason"]) {
  return reason === "AUTO_PARTICIPANT_WITHDRAWAL_CUSTODY"
    ? "자동 참여자 탈퇴 보관 이전"
    : "과거 상장주관사 반환";
}
